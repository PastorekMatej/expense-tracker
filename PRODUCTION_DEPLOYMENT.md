# Production Deployment Guide - Expense Tracker

## 🚀 Quick Start for Render.com

### Prerequisites
- ✅ GitHub repository with code pushed
- ✅ Google Cloud service account JSON credentials
- ✅ OAuth provider configured (or use MOCK_OAUTH=true for testing)

---

## Step 1: Prepare Your Code

1. **Ensure all changes are committed:**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Verify build works locally:**
   ```bash
   pnpm install
   pnpm build
   pnpm start
   ```
   Test at `http://localhost:3000` to ensure everything works.

---

## Step 2: Deploy on Render

### 2.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub account (if not already connected)
4. Select your repository: `expense-tracker`
5. Render will auto-detect settings from `render.yaml`
6. Click **Create Web Service**

### 2.2 Configure Environment Variables

Go to **Environment** tab and set these variables:

#### Required Variables:

```bash
# OAuth Configuration (if not using mock)
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
VITE_APP_ID=your-app-id

# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important:** For `GOOGLE_SERVICE_ACCOUNT_JSON`:
- Paste the **entire JSON** as a single line
- Remove all line breaks
- Ensure it's valid JSON (use a JSON validator)

#### Optional Variables:

```bash
# Use mock OAuth for testing (set to false for production)
MOCK_OAUTH=false

# Custom app title and logo
VITE_APP_TITLE=My Expense Tracker
VITE_APP_LOGO=https://your-logo-url.com/logo.png
```

### 2.3 Share Google Sheet

1. Open your Google Sheet
2. Click **Share** button
3. Add the service account email (from `GOOGLE_SERVICE_ACCOUNT_JSON` → `client_email`)
4. Give it **Editor** access
5. Click **Send**

**Example service account email format:**
```
sheets-api-service-account@your-project.iam.gserviceaccount.com
```

---

## Step 3: Deploy

1. Click **Manual Deploy** → **Deploy latest commit**
2. Wait for build to complete (usually 2-5 minutes)
3. Check **Logs** tab for any errors
4. Your app will be live at: `https://expense-tracker-xxxx.onrender.com`

---

## Step 4: Verify Deployment

### 4.1 Check Build Logs

Look for:
- ✅ `Server running on http://localhost:10000/`
- ✅ No build errors
- ✅ All dependencies installed

### 4.2 Test the Application

1. **Visit your app URL**
2. **Test sign-in flow:**
   - If `MOCK_OAUTH=true`: Should redirect to mock OAuth portal
   - If `MOCK_OAUTH=false`: Should redirect to your OAuth provider
3. **Test expense recording:**
   - Add a test expense
   - Verify it appears in summaries
   - Check Google Sheet to confirm data was written

### 4.3 Check Google Sheets Integration

1. Open your Google Sheet
2. Verify new expenses appear in the sheet
3. Check that data format is correct (Date, Amount, Category Code, Category Name)

---

## 🔧 Troubleshooting

### Build Fails

**Error: `Cannot find module`**
- Solution: Ensure `pnpm-lock.yaml` is committed to git
- Solution: Check Node.js version in Render settings (should be 18+)

**Error: `Build timeout`**
- Solution: Upgrade to Starter plan ($7/month) for longer build times
- Solution: Optimize dependencies (remove unused packages)

### App Won't Start

**Error: `Port already in use`**
- Solution: Ensure `PORT` env var is set to `10000` (Render's default)

**Error: `JWT_SECRET not set`**
- Solution: Render auto-generates this, but verify it's in Environment tab

### OAuth Not Working

**Error: `Failed to construct URL`**
- Solution: Verify `VITE_OAUTH_PORTAL_URL` is set correctly
- Solution: Check URL format (must include `http://` or `https://`)

**Error: `Redirect URI mismatch`**
- Solution: Ensure OAuth provider has your Render URL in allowed redirect URIs
- Format: `https://your-app.onrender.com/api/oauth/callback`

### Google Sheets Errors

**Error: `Permission denied`**
- Solution: Share sheet with service account email (Editor access)
- Solution: Verify `GOOGLE_SERVICE_ACCOUNT_JSON` is valid JSON

**Error: `Invalid credentials`**
- Solution: Re-check JSON format (no line breaks, valid JSON)
- Solution: Verify service account has Sheets API enabled

### Data Not Persisting

**Expenses disappear after restart:**
- This is expected in mock mode (`MOCK_OAUTH=true`)
- Solution: Set `MOCK_OAUTH=false` and configure real OAuth
- Solution: Ensure `GOOGLE_SERVICE_ACCOUNT_JSON` is set for Google Sheets storage

---

## 📊 Monitoring

### Render Dashboard

- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Request count
- **Events**: Deployments, restarts, errors

### Application Health

- Health check endpoint: `/` (configured in `render.yaml`)
- Check logs for: `Server running on http://localhost:10000/`

---

## 🔄 Updating Production

### Automatic Deployments

Render auto-deploys on every push to `main` branch.

### Manual Deployments

1. Go to Render dashboard
2. Click **Manual Deploy** → **Deploy latest commit**

### Rollback

1. Go to **Events** tab
2. Find previous successful deployment
3. Click **Redeploy**

---

## 💰 Cost

### Free Tier
- ✅ Free forever
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Cold start takes ~30 seconds

### Starter Plan ($7/month)
- ✅ Always-on (no sleeping)
- ✅ Faster cold starts
- ✅ Better performance

**Recommendation:** Start with free tier, upgrade if you need 24/7 uptime.

---

## 🔐 Security Checklist

- [ ] `JWT_SECRET` is auto-generated (secure)
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` is set as secret (not visible in logs)
- [ ] OAuth redirect URIs are properly configured
- [ ] Google Sheet permissions are minimal (Editor only)
- [ ] HTTPS is enabled (automatic on Render)
- [ ] Environment variables are not exposed in client code

---

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | ✅ | Environment mode | `production` |
| `PORT` | ✅ | Server port | `10000` |
| `JWT_SECRET` | ✅ | Session signing key | Auto-generated |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ✅ | Google Sheets credentials | Full JSON object |
| `OAUTH_SERVER_URL` | ⚠️ | OAuth backend URL | `https://auth.example.com` |
| `VITE_OAUTH_PORTAL_URL` | ⚠️ | OAuth portal URL | `https://portal.example.com` |
| `VITE_APP_ID` | ⚠️ | App identifier | `your-app-id` |
| `MOCK_OAUTH` | ❌ | Use mock OAuth | `false` |
| `VITE_APP_TITLE` | ❌ | App title | `Expense Tracker` |
| `VITE_APP_LOGO` | ❌ | App logo URL | `https://...` |

⚠️ = Required if `MOCK_OAUTH=false`

---

## ✅ Production Checklist

Before going live:

- [ ] Code pushed to GitHub
- [ ] Build succeeds locally (`pnpm build`)
- [ ] All environment variables set in Render
- [ ] Google Sheet shared with service account
- [ ] OAuth provider configured (if not using mock)
- [ ] Test sign-in flow works
- [ ] Test expense recording works
- [ ] Verify data persists in Google Sheets
- [ ] Check application logs for errors
- [ ] Test on mobile device (PWA)
- [ ] Verify HTTPS is working
- [ ] Set up monitoring/alerts (optional)

---

## 🆘 Support

If you encounter issues:

1. Check **Render Logs** tab for errors
2. Verify all environment variables are set correctly
3. Test locally with production build (`pnpm build && pnpm start`)
4. Check Google Sheets permissions
5. Review this guide's troubleshooting section

For Render-specific issues: [Render Support](https://render.com/docs/support)

---

**Your app is now live! 🎉**

Visit: `https://expense-tracker-xxxx.onrender.com`


