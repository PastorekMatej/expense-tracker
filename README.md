# 💰 Expense Tracker

A modern, mobile-first expense tracking application with Google Sheets integration. Built with React, TypeScript, and tRPC.

## ✨ Features

- 📱 **Mobile-First Design** - Optimized for smartphone use
- 📊 **Google Sheets Integration** - Auto-sync expenses to spreadsheet
- 🔐 **OAuth Authentication** - Secure user authentication
- 💾 **Real-time Sync** - Expenses saved instantly to Google Sheets
- 🎨 **Modern UI** - Built with Tailwind CSS and Radix UI
- ⚡ **Fast & Lightweight** - Optimized for performance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (or npm)
- Google Cloud account (for Sheets API)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/expense-tracker.git
cd expense-tracker
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env` file:
```env
NODE_ENV=development
PORT=3000

# OAuth (use mock for local dev)
MOCK_OAUTH=true
MOCK_OAUTH_PORT=4000
OAUTH_SERVER_URL=http://localhost:4000
JWT_SECRET=your-secret-key

# App Configuration
VITE_APP_ID=your-app-id
VITE_APP_TITLE=Expense Tracker
VITE_OAUTH_PORTAL_URL=http://localhost:4000

# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

4. **Run development server**
```bash
pnpm dev
```

Visit http://localhost:3000

## 🌐 Deployment

Deploy to Render.com in 5 minutes:

1. Push code to GitHub
2. Go to [Render.com](https://render.com) → New Web Service
3. Connect your repository
4. Add environment variables
5. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📚 Tech Stack

**Frontend:**
- React 19
- TypeScript
- TailwindCSS
- tRPC for type-safe APIs
- Radix UI components

**Backend:**
- Node.js + Express
- tRPC server
- Google Sheets API
- JWT authentication

## 🔧 Configuration

### Google Sheets Setup

1. Create a service account in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Sheets API
3. Download JSON credentials
4. Share your spreadsheet with the service account email
5. Add credentials to `GOOGLE_SERVICE_ACCOUNT_JSON` env var

### Expense Categories

Configured in `client/src/pages/Home.tsx`:
- `p1` - Food Expenses
- `p2` - Entertainment
- `inv` - Investments
- `div` - Other Expenses
- `don` - Gifts
- `log` - Accommodation
- `tra` - Commuting
- `visa` - Travel
- `fin` - Finance Expenses
- `soin` - Health Expenses
- `SAL` - Salary

## 📝 API Endpoints

### Authentication
- `GET /api/trpc/auth.me` - Get current user
- `POST /api/trpc/auth.logout` - Logout user

### Expenses
- `POST /api/trpc/expenses.addExpense` - Add new expense

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🐛 Troubleshooting

**OAuth not working?**
- For local dev, use `MOCK_OAUTH=true`
- For production, configure real OAuth provider

**Google Sheets errors?**
- Verify service account has Editor access
- Check JSON credentials are valid
- Ensure Sheet ID in `googleSheets.ts` matches your sheet

**Build fails?**
- Clear `node_modules` and reinstall: `pnpm install`
- Check Node.js version: `node -v` (needs 18+)

## 📞 Support

For issues and questions, please open a GitHub issue.

---

Made with ❤️ by [Your Name]

