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
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [entries, setEntries] = useState<
    Array<{ date: string; amount: string; categoryCode: string; categoryName: string }>
  >([]);

  const addExpenseMutation = trpc.expenses.addExpense.useMutation();

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

    try {
      // Send to backend which will write to Google Sheets
      await addExpenseMutation.mutateAsync({
        date,
        amount: numAmount,
        categoryCode,
        categoryName,
      });

      // Add entry to local list
      setEntries([
        { date, amount, categoryCode, categoryName },
        ...entries,
      ]);

      // Reset form
      setDate(new Date().toISOString().split("T")[0]);
      setAmount("");
      setCategoryCode("");
      setSubmitted(true);

      // Clear success message after 2 seconds
      setTimeout(() => setSubmitted(false), 2000);
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

        {/* Recent Entries */}
        {entries.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-800">Recent Entries</h2>
            {entries.map((entry, idx) => (
              <Card key={idx} className="p-4 bg-white shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{entry.categoryName}</p>
                    <p className="text-sm text-gray-600">{entry.date}</p>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">${entry.amount}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
