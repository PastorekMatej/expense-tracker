# Mobile Expense Tracker - TODO

## Features

- [x] Expense entry form with date, amount, and category code inputs
- [x] Category selector with 3-letter codes (p1, p2, inv, div, don, log, tra, visa, fin, soin, SAL)
- [x] Category validation and display of full category names
- [x] Daily expense history view (recent entries)
- [ ] Submit expense to Google Sheets via API
- [x] Mobile-first responsive design with large, easy-to-tap inputs
- [x] Form validation and error handling
- [x] Success feedback after submission
- [x] Category quick-select buttons or dropdown
- [ ] Expense summary/dashboard view
- [ ] Light/dark theme support

## Google Sheets Integration

- [x] Clarify Google Sheets URL and authentication method with user
- [x] Upgrade project to include backend server capability
- [x] Set up Google Sheets API authentication and credentials
- [x] Implement backend endpoint to append expense data to Google Sheets
- [x] Connect frontend form to backend API for data submission
- [x] Test integration and verify data is being written to Google Sheets

## Bug Fixes

- [x] Fix category code validation to accept 2-4 characters (was strictly 3)
- [x] Improve error messages for invalid category codes
