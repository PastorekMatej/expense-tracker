import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

const CATEGORIES = [
  { code: "p1", name: "Food Expenses" },
  { code: "p2", name: "Entertainment" },
  { code: "inv", name: "Investments" },
  { code: "div", name: "Other Expenses" },
  { code: "don", name: "Gifts" },
  { code: "log", name: "Accommodation" },
  { code: "tra", name: "Commuting" },
  { code: "visa", name: "Travel" },
  { code: "fin", name: "Finance Expenses" },
  { code: "soin", name: "Health Expenses" },
  { code: "SAL", name: "Salary" },
];

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const addExpenseMutation = trpc.expenses.addExpense.useMutation();
  const {
    data: lastMonthsSummaries,
    refetch: refetchLastMonthsSummaries,
  } = trpc.expenses.getLastMonthsSummaries.useQuery(
    { count: 13 },
    { enabled: isAuthenticated }
  );
  const { data: monthlyWeeklySummary, refetch: refetchMonthlyWeeklySummary } =
    trpc.expenses.getMonthlyWeeklySummary.useQuery(undefined, {
      enabled: isAuthenticated,
    });
  const { data: recentEntriesData, refetch: refetchRecentEntries } =
    trpc.expenses.getRecentEntries.useQuery(
      { monthsBack: 2 },
      { enabled: isAuthenticated }
    );

  const getCategoryName = (code: string) => {
    return CATEGORIES.find((cat) => cat.code === code)?.name || "Invalid Code";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!date || !amount || !categoryCode) {
      setFormError("Please fill in all fields");
      return;
    }

    const categoryName = getCategoryName(categoryCode);
    if (categoryName === "Invalid Code") {
      setFormError(`Invalid category code. Use: p1, p2, inv, div, don, log, tra, visa, fin, soin, or SAL`);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid amount");
      return;
    }

    const trimmedComment = comment.trim();

    try {
      // Send to backend which will write to Google Sheets
      await addExpenseMutation.mutateAsync({
        date,
        amount: numAmount,
        categoryCode,
        categoryName,
        comment: trimmedComment || undefined,
      });

      // Reset form
      setDate(new Date().toISOString().split("T")[0]);
      setAmount("");
      setCategoryCode("");
      setComment("");
      setSubmitted(true);

      // Clear success message after 2 seconds
      setTimeout(() => setSubmitted(false), 2000);

      // Refetch summaries and recent entries (2 derniers mois)
      refetchLastMonthsSummaries();
      refetchMonthlyWeeklySummary();
      refetchRecentEntries();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to record expense");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-8 shadow-lg max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-indigo-600 mb-4">{APP_TITLE}</h1>
          <p className="text-gray-600 mb-6">Sign in to track your expenses and sync with Google Sheets.</p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">{APP_TITLE}</h1>
            <p className="text-sm text-gray-600">Track your daily expenses</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col">
        {/* Success Message */}
        {submitted && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">Expense recorded and synced to Google Sheets!</p>
          </div>
        )}

        {/* Error Message */}
        {formError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{formError}</p>
          </div>
        )}

        {/* Input Form */}
        <Card className="p-6 shadow-lg mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date Input */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-base font-semibold text-gray-700">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold text-gray-700">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            {/* Category Code Input */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-base font-semibold text-gray-700">
                Category Code
              </Label>
              <Input
                id="category"
                type="text"
                placeholder="e.g., p1, p2, tra"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value.toLowerCase())}
                maxLength={3}
                className="h-12 text-base uppercase"
              />
              {categoryCode && (
                <p className="text-sm text-gray-600 mt-2">
                  {getCategoryName(categoryCode)}
                </p>
              )}
            </div>

            {/* Category Quick Select */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Quick Select:</p>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.slice(0, 9).map((cat) => (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => setCategoryCode(cat.code)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                      categoryCode === cat.code
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Input */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-base font-semibold text-gray-700">
                Commentaire <span className="text-sm font-normal text-gray-500">(optionnel)</span>
              </Label>
              <textarea
                id="comment"
                placeholder="Ajouter une note sur cette dépense..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              {comment.length > 0 && (
                <p className="text-xs text-gray-500 text-right">{comment.length}/500</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={addExpenseMutation.isPending}
              className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg mt-6 disabled:opacity-50"
            >
              {addExpenseMutation.isPending ? "Saving..." : "Record Expense"}
            </Button>
          </form>
        </Card>

        {/* Spending Recap by Category */}
        {(monthlyWeeklySummary !== undefined || lastMonthsSummaries !== undefined) && (
          <Card className="p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Spending Recap by Category</h2>
            
            {/* Weekly Summary (All Weeks in Current Month) */}
            {monthlyWeeklySummary && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Weekly Breakdown
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(monthlyWeeklySummary.year, monthlyWeeklySummary.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {monthlyWeeklySummary.weeks.map((week, index) => (
                  <div key={`week-${week.weekStart}-${week.weekEnd}`} className="rounded-lg border border-blue-100 bg-white">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Week {index + 1}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-700">${week.grandTotal.toFixed(2)}</p>
                    </div>

                    {week.categories.length > 0 ? (
                      <div className="space-y-2 p-4">
                        {week.categories.map((category) => (
                          <div key={`week-${week.weekStart}-${category.code}`} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{category.name}</p>
                              <p className="text-xs text-gray-600 uppercase">{category.code}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-bold text-blue-600">${category.total.toFixed(2)}</p>
                              {week.grandTotal > 0 && (
                                <p className="text-xs text-gray-600">
                                  {((category.total / week.grandTotal) * 100).toFixed(1)}% of total
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No expenses recorded for this week.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Monthly Summary - Current month with details + 3 previous months (totals only) */}
            {lastMonthsSummaries && lastMonthsSummaries.months.length > 0 && (
              <div className="space-y-6">
                {lastMonthsSummaries.months.map((monthSummary, idx) => {
                  const monthLabel = new Date(
                    monthSummary.year,
                    monthSummary.month - 1
                  ).toLocaleString('default', { month: 'long', year: 'numeric' });

                  // Mois courant : affichage détaillé par catégorie + total
                  if (idx === 0) {
                    return (
                      <div key={`month-${monthSummary.year}-${monthSummary.month}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-700">Current Month</h3>
                          <p className="text-sm text-gray-500">{monthLabel}</p>
                        </div>

                        <div className="space-y-2 mb-4">
                          {CATEGORIES.map((cat) => {
                            const categoryData = monthSummary.categories.find(c => c.code === cat.code);
                            const total = categoryData?.total || 0;
                            return (
                              <div key={`month-${monthSummary.year}-${monthSummary.month}-${cat.code}`} className={`flex items-center justify-between p-3 rounded-lg border ${
                                total > 0
                                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
                                  : 'bg-gray-50 border-gray-200 opacity-60'
                              }`}>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800">{cat.name}</p>
                                  <p className="text-xs text-gray-600 uppercase">{cat.code}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-xl font-bold ${total > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    ${total.toFixed(2)}
                                  </p>
                                  {monthSummary.grandTotal > 0 && total > 0 && (
                                    <p className="text-xs text-gray-600">
                                      {((total / monthSummary.grandTotal) * 100).toFixed(1)}% of total
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="border-t border-indigo-200 pt-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-gray-600">Month Total</p>
                              <p className="text-xs text-gray-500">{monthSummary.expenseCount} transactions</p>
                            </div>
                            <p className="text-2xl font-bold text-indigo-700">${monthSummary.grandTotal.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Mois précédents : on affiche uniquement la somme totale.
                  // On regroupe les 3 mois précédents sous un même sous-titre lors du premier
                  // mois précédent (idx === 1) pour aérer visuellement la liste.
                  return (
                    <div key={`month-${monthSummary.year}-${monthSummary.month}`}>
                      {idx === 1 && (
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Previous Months</h3>
                      )}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                        <div>
                          <p className="font-semibold text-gray-800">{monthLabel}</p>
                          <p className="text-xs text-gray-500">{monthSummary.expenseCount} transactions</p>
                        </div>
                        <p className="text-xl font-bold text-indigo-700">${monthSummary.grandTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </Card>
        )}

        {/* Recent Entries (last 2 months) */}
        {recentEntriesData && recentEntriesData.entries.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Recent Entries</h2>
              <p className="text-xs text-gray-500">Last 2 months · {recentEntriesData.count} entries</p>
            </div>
            {recentEntriesData.entries.map((entry) => (
              <Card key={`entry-${entry.id}-${entry.date}`} className="p-4 bg-white shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{entry.categoryName}</p>
                    <p className="text-sm text-gray-600">{entry.date}</p>
                    {entry.comment && (
                      <p className="text-sm text-gray-500 italic mt-1 break-words">{entry.comment}</p>
                    )}
                  </div>
                  <p className="text-lg font-bold text-indigo-600">${entry.amount.toFixed(2)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
