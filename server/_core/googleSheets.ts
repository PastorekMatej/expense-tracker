import { google } from "googleapis";
import { ENV } from "./env";

// Parse Service Account credentials from environment
let sheetsClient: any = null;

function getSheets() {
  if (!sheetsClient) {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    sheetsClient = google.sheets({ version: "v4", auth });
  }

  return sheetsClient;
}

export interface ExpenseData {
  date: string;
  amount: number;
  categoryCode: string;
  categoryName: string;
}

export interface ExpenseRecord {
  id: number;
  date: string;
  amount: number;
  categoryCode: string;
  categoryName: string;
}

// In-memory store for mock mode
let mockExpensesStore: ExpenseRecord[] = [];

/**
 * Initialize mock expenses store with sample data
 */
function initializeMockStore() {
  if (mockExpensesStore.length === 0) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    
    mockExpensesStore = [
      { id: 1, date: `${currentYear}-${currentMonth}-01`, amount: 25.50, categoryCode: "p1", categoryName: "Food Expenses" },
      { id: 2, date: `${currentYear}-${currentMonth}-05`, amount: 15.00, categoryCode: "p2", categoryName: "Entertainment" },
      { id: 3, date: `${currentYear}-${currentMonth}-08`, amount: 42.75, categoryCode: "tra", categoryName: "Commuting" },
    ];
  }
}

/**
 * Append expense data to Google Sheet
 * Sheet ID: 1KOpJRrbnvVA4aFqjBUZ44RnuJpXb6K-9aY4jIHj0CZc
 * Range: Sheet1!A:D (Date, Amount, Category Code, Category Name)
 */
export async function appendToGoogleSheet(data: ExpenseData): Promise<void> {
  // Mock mode for local development without Google Sheets credentials
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    initializeMockStore();
    const newExpense: ExpenseRecord = {
      id: mockExpensesStore.length > 0 
        ? Math.max(...mockExpensesStore.map(e => e.id)) + 1 
        : 1,
      date: data.date,
      amount: data.amount,
      categoryCode: data.categoryCode,
      categoryName: data.categoryName,
    };
    mockExpensesStore.push(newExpense);
    console.log(
      `[Google Sheets MOCK] Appended: ${data.categoryName} - $${data.amount} on ${data.date} (${data.categoryCode})`
    );
    return;
  }

  try {
    const sheets = getSheets();
    const spreadsheetId = "1KOpJRrbnvVA4aFqjBUZ44RnuJpXb6K-9aY4jIHj0CZc";
    const range = "Sheet1!A:D"; // Append to columns A-D

    const values = [[data.date, data.amount, data.categoryCode, data.categoryName]];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.log(
      `[Google Sheets] Appended expense: ${data.categoryName} - $${data.amount} on ${data.date}`
    );
    console.log(`[Google Sheets] Updated range: ${response.data.updates?.updatedRange}`);
  } catch (error) {
    console.error("[Google Sheets] Error appending data:", error);
    throw error;
  }
}

/**
 * Fetch all expenses from Google Sheet
 */
export async function fetchExpensesFromSheet(): Promise<ExpenseRecord[]> {
  // Mock mode - return expenses from in-memory store
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    initializeMockStore();
    console.log(`[Google Sheets MOCK] Returning ${mockExpensesStore.length} expenses from mock store`);
    return [...mockExpensesStore]; // Return a copy to prevent mutations
  }

  try {
    const sheets = getSheets();
    const spreadsheetId = "1KOpJRrbnvVA4aFqjBUZ44RnuJpXb6K-9aY4jIHj0CZc";
    const range = "Sheet1!A:D"; // Read columns A-D

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Skip header row if exists, map to ExpenseRecord
    const expenses: ExpenseRecord[] = rows
      .slice(1) // Skip header
      .map((row: any[], index: number) => ({
        id: index + 1,
        date: row[0] || "",
        amount: parseFloat(row[1]) || 0,
        categoryCode: row[2] || "",
        categoryName: row[3] || "",
      }))
      .filter((exp: ExpenseRecord) => exp.date && exp.amount > 0); // Filter valid entries

    console.log(`[Google Sheets] Fetched ${expenses.length} expenses`);
    return expenses;
  } catch (error) {
    console.error("[Google Sheets] Error fetching data:", error);
    throw error;
  }
}
