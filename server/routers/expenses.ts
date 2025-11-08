import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { appendToGoogleSheet } from "../_core/googleSheets";

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
});
