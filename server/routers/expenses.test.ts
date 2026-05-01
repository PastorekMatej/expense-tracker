import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Google Sheets module BEFORE importing the router so the router
// picks up the mocked `fetchExpensesFromSheet` during evaluation.
vi.mock("../_core/googleSheets", () => ({
  fetchExpensesFromSheet: vi.fn(),
  appendToGoogleSheet: vi.fn(),
}));

import { fetchExpensesFromSheet } from "../_core/googleSheets";
import { expensesRouter } from "./expenses";

const mockedFetch = vi.mocked(fetchExpensesFromSheet);

// `publicProcedure` only requires { req, res, user } in the context; the
// fields are not read by these endpoints so a minimal stub is sufficient.
const caller = expensesRouter.createCaller({
  req: {} as any,
  res: {} as any,
  user: null,
});

// Fixed "now" used by tests: May 15, 2026.
// Months covered for various N-back queries:
//   offset 0 -> May 2026   (current)
//   offset 1 -> April 2026
//   offset 2 -> March 2026
//   offset 3 -> February 2026
const FIXED_NOW = new Date(2026, 4, 15, 12, 0, 0); // month is 0-indexed

const SAMPLE_EXPENSES = [
  // May 2026 (current month)
  { id: 1, date: "2026-05-01", amount: 25.5, categoryCode: "p1", categoryName: "Food Expenses", comment: "" },
  { id: 2, date: "2026-05-10", amount: 10, categoryCode: "p1", categoryName: "Food Expenses", comment: "lunch" },
  { id: 3, date: "2026-05-12", amount: 40, categoryCode: "tra", categoryName: "Commuting", comment: "" },
  // April 2026 (previous month)
  { id: 4, date: "2026-04-05", amount: 100, categoryCode: "p1", categoryName: "Food Expenses", comment: "" },
  { id: 5, date: "2026-04-20", amount: 50, categoryCode: "p2", categoryName: "Entertainment", comment: "" },
  // March 2026
  { id: 6, date: "2026-03-15", amount: 200, categoryCode: "log", categoryName: "Accommodation", comment: "" },
  // February 2026
  { id: 7, date: "2026-02-10", amount: 30, categoryCode: "p1", categoryName: "Food Expenses", comment: "" },
  // Old expense, way outside the last-N-months windows we use here.
  { id: 8, date: "2024-01-15", amount: 999, categoryCode: "div", categoryName: "Other Expenses", comment: "old" },
];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
  mockedFetch.mockReset();
  mockedFetch.mockResolvedValue(SAMPLE_EXPENSES);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("expensesRouter.getLastMonthsSummaries", () => {
  it("returns the requested number of months ordered from most recent to oldest", async () => {
    const result = await caller.getLastMonthsSummaries({ count: 4 });

    expect(result.months).toHaveLength(4);
    expect(result.months.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2026-5",
      "2026-4",
      "2026-3",
      "2026-2",
    ]);
  });

  it("aggregates totals correctly per category for the current month", async () => {
    const result = await caller.getLastMonthsSummaries({ count: 4 });
    const may = result.months[0];

    expect(may.expenseCount).toBe(3);
    expect(may.grandTotal).toBeCloseTo(75.5, 5);

    const food = may.categories.find((c) => c.code === "p1");
    const commuting = may.categories.find((c) => c.code === "tra");
    expect(food?.total).toBeCloseTo(35.5, 5);
    expect(commuting?.total).toBe(40);

    // Categories must be sorted by total descending.
    expect(may.categories[0].code).toBe("tra");
    expect(may.categories[1].code).toBe("p1");
  });

  it("computes correct totals for previous months and ignores expenses outside the window", async () => {
    const result = await caller.getLastMonthsSummaries({ count: 4 });
    const [, april, march, february] = result.months;

    expect(april.grandTotal).toBe(150);
    expect(april.expenseCount).toBe(2);

    expect(march.grandTotal).toBe(200);
    expect(march.expenseCount).toBe(1);

    expect(february.grandTotal).toBe(30);
    expect(february.expenseCount).toBe(1);

    // The 2024 expense must not leak into any of the four returned months.
    const totalAcrossMonths = result.months.reduce(
      (sum, m) => sum + m.grandTotal,
      0
    );
    expect(totalAcrossMonths).toBe(75.5 + 150 + 200 + 30);
  });

  it("defaults to 2 months when no input is provided", async () => {
    const result = await caller.getLastMonthsSummaries();
    expect(result.months).toHaveLength(2);
    expect(result.months.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2026-5",
      "2026-4",
    ]);
  });

  it("handles year rollover when stepping back across January", async () => {
    // Pretend "now" is February 10, 2026; stepping back 3 months should land
    // on November 2025 without overflow bugs.
    vi.setSystemTime(new Date(2026, 1, 10, 12, 0, 0));

    const result = await caller.getLastMonthsSummaries({ count: 4 });
    expect(result.months.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2026-2",
      "2026-1",
      "2025-12",
      "2025-11",
    ]);
  });
});

describe("expensesRouter.getRecentEntries", () => {
  it("returns entries from the last 2 months by default, sorted by date desc", async () => {
    const result = await caller.getRecentEntries();

    // Only May + April 2026 entries should be present (ids 1..5).
    expect(result.count).toBe(5);
    expect(result.entries.map((e) => e.id)).toEqual([3, 2, 1, 5, 4]);
    expect(result.monthsBack).toBe(2);
  });

  it("respects a custom monthsBack window", async () => {
    const result = await caller.getRecentEntries({ monthsBack: 4 });

    // Should include Feb..May 2026 (ids 1..7) but not the 2024 one.
    expect(result.count).toBe(7);
    expect(result.entries.every((e) => e.id !== 8)).toBe(true);
    expect(result.entries[0].id).toBe(3); // May 12 is the most recent
    expect(result.entries[result.entries.length - 1].id).toBe(7); // Feb 10
  });

  it("breaks ties on identical dates using the entry id (desc)", async () => {
    mockedFetch.mockResolvedValueOnce([
      { id: 10, date: "2026-05-10", amount: 5, categoryCode: "p1", categoryName: "Food Expenses", comment: "" },
      { id: 11, date: "2026-05-10", amount: 7, categoryCode: "p1", categoryName: "Food Expenses", comment: "" },
      { id: 12, date: "2026-05-10", amount: 9, categoryCode: "p1", categoryName: "Food Expenses", comment: "" },
    ]);

    const result = await caller.getRecentEntries({ monthsBack: 1 });
    expect(result.entries.map((e) => e.id)).toEqual([12, 11, 10]);
  });
});
