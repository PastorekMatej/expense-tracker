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

/**
 * Append expense data to Google Sheet
 * Sheet ID: 1KOpJRrbnvVA4aFqjBUZ44RnuJpXb6K-9aY4jIHj0CZc
 * Range: Sheet1!A:D (Date, Amount, Category Code, Category Name)
 */
export async function appendToGoogleSheet(data: ExpenseData): Promise<void> {
  // Mock mode for local development without Google Sheets credentials
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log(
      `[Google Sheets MOCK] Would append: ${data.categoryName} - $${data.amount} on ${data.date} (${data.categoryCode})`
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
