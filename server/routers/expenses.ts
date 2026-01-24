import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { appendToGoogleSheet, fetchExpensesFromSheet } from "../_core/googleSheets";

const expenseSchema = z.object({
  date: z.string(),
  amount: z.number().positive(),
  categoryCode: z.string().min(2).max(4),
  categoryName: z.string(),
});

export const expensesRouter = router({
  addExpense: publicProcedure
    .input(expenseSchema)
    .mutation(async ({ input }) => {
      try {
        // Append to Google Sheet
        await appendToGoogleSheet({
          date: input.date,
          amount: input.amount,
          categoryCode: input.categoryCode,
          categoryName: input.categoryName,
        });

        return {
          success: true,
          message: "Expense recorded and synced to Google Sheets",
        };
      } catch (error) {
        console.error("[Expenses] Failed to add expense:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to record expense"
        );
      }
    }),

  getExpenses: publicProcedure.query(async () => {
    try {
      const expenses = await fetchExpensesFromSheet();
      return {
        success: true,
        expenses,
        count: expenses.length,
      };
    } catch (error) {
      console.error("[Expenses] Failed to get expenses:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to get expenses"
      );
    }
  }),

  getMonthlySummary: publicProcedure.query(async () => {
    try {
      const expenses = await fetchExpensesFromSheet();
      
      // Get current month/year
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Filter expenses for current month
      const currentMonthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() + 1 === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      });

      // Calculate totals by category
      const categoryTotals: Record<string, { total: number; name: string; code: string }> = {};
      
      currentMonthExpenses.forEach((expense) => {
        if (!categoryTotals[expense.categoryCode]) {
          categoryTotals[expense.categoryCode] = {
            total: 0,
            name: expense.categoryName,
            code: expense.categoryCode,
          };
        }
        categoryTotals[expense.categoryCode].total += expense.amount;
      });

      // Convert to array and sort by total descending
      const summary = Object.values(categoryTotals).sort((a, b) => b.total - a.total);

      const grandTotal = summary.reduce((sum, cat) => sum + cat.total, 0);

      return {
        month: currentMonth,
        year: currentYear,
        categories: summary,
        grandTotal,
        expenseCount: currentMonthExpenses.length,
      };
    } catch (error) {
      console.error("[Expenses] Failed to get monthly summary:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to get monthly summary"
      );
    }
  }),

  getWeeklySummary: publicProcedure.query(async () => {
    try {
      const expenses = await fetchExpensesFromSheet();
      
      // Get current week (based on month start: 1-7, 8-14, 15-21, 22-28, 29-31)
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Calculate which week of the month (0-indexed: 0 = days 1-7, 1 = days 8-14, etc.)
      const weekNumber = Math.floor((currentDay - 1) / 7);
      
      // Calculate week start: first day of month + (weekNumber * 7)
      const weekStartDay = weekNumber * 7 + 1;
      const weekStart = new Date(currentYear, currentMonth, weekStartDay);
      weekStart.setHours(0, 0, 0, 0);
      
      // Calculate week end: weekStart + 6 days, but not exceeding the last day of the month
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const weekEndDay = Math.min(weekStartDay + 6, lastDayOfMonth);
      const weekEnd = new Date(currentYear, currentMonth, weekEndDay);
      weekEnd.setHours(23, 59, 59, 999);

      // Filter expenses for current week
      const currentWeekExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= weekStart && expenseDate <= weekEnd;
      });

      // Calculate totals by category
      const categoryTotals: Record<string, { total: number; name: string; code: string }> = {};
      
      currentWeekExpenses.forEach((expense) => {
        if (!categoryTotals[expense.categoryCode]) {
          categoryTotals[expense.categoryCode] = {
            total: 0,
            name: expense.categoryName,
            code: expense.categoryCode,
          };
        }
        categoryTotals[expense.categoryCode].total += expense.amount;
      });

      // Convert to array and sort by total descending
      const summary = Object.values(categoryTotals).sort((a, b) => b.total - a.total);

      const grandTotal = summary.reduce((sum, cat) => sum + cat.total, 0);

      // Format dates as YYYY-MM-DD using local timezone to avoid UTC conversion issues
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        weekStart: formatDate(weekStart),
        weekEnd: formatDate(weekEnd),
        categories: summary,
        grandTotal,
        expenseCount: currentWeekExpenses.length,
      };
    } catch (error) {
      console.error("[Expenses] Failed to get weekly summary:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to get weekly summary"
      );
    }
  }),

  getMonthlyWeeklySummary: publicProcedure.query(async () => {
    try {
      const expenses = await fetchExpensesFromSheet();

      const now = new Date();
      const currentMonthIndex = now.getMonth();
      const currentMonth = currentMonthIndex + 1;
      const currentYear = now.getFullYear();

      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const buildCategorySummary = (weekExpenses: typeof expenses) => {
        const categoryTotals: Record<
          string,
          { total: number; name: string; code: string }
        > = {};

        weekExpenses.forEach((expense) => {
          if (!categoryTotals[expense.categoryCode]) {
            categoryTotals[expense.categoryCode] = {
              total: 0,
              name: expense.categoryName,
              code: expense.categoryCode,
            };
          }
          categoryTotals[expense.categoryCode].total += expense.amount;
        });

        const categories = Object.values(categoryTotals).sort(
          (a, b) => b.total - a.total
        );
        const grandTotal = categories.reduce((sum, cat) => sum + cat.total, 0);

        return {
          categories,
          grandTotal,
          expenseCount: weekExpenses.length,
        };
      };

      const lastDayOfMonth = new Date(
        currentYear,
        currentMonthIndex + 1,
        0
      ).getDate();

      const weeks = [];
      for (let weekStartDay = 1; weekStartDay <= lastDayOfMonth; weekStartDay += 7) {
        const weekEndDay = Math.min(weekStartDay + 6, lastDayOfMonth);
        const weekStart = new Date(currentYear, currentMonthIndex, weekStartDay);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(currentYear, currentMonthIndex, weekEndDay);
        weekEnd.setHours(23, 59, 59, 999);

        const weekExpenses = expenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= weekStart && expenseDate <= weekEnd;
        });

        const summary = buildCategorySummary(weekExpenses);

        weeks.push({
          weekStart: formatDate(weekStart),
          weekEnd: formatDate(weekEnd),
          ...summary,
        });
      }

      return {
        month: currentMonth,
        year: currentYear,
        weeks,
      };
    } catch (error) {
      console.error("[Expenses] Failed to get monthly weekly summary:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get monthly weekly summary"
      );
    }
  }),
});
