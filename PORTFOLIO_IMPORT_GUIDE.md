# Portfolio Import Guide

This guide explains all the ways you can import your portfolio data into Portfolio Insights.

## Overview

Portfolio Insights supports **4 different import methods**:

1. ✅ **CSV Upload** (Recommended for Zerodha users)
2. ✅ **JSON Upload**
3. ✅ **Manual Entry via API**
4. ✅ **Zerodha Kite API** (requires daily authentication)

---

## Method 1: CSV Upload (Recommended)

Perfect for Zerodha Console users or Excel/Google Sheets users.

### How to Export from Zerodha Console:

1. Log in to [Zerodha Console](https://console.zerodha.com/)
2. Go to **Holdings**
3. Click **Export to CSV** button
4. Save the file

### How to Import:

```bash
curl -X POST http://localhost:3001/api/portfolio/upload \
  -F "file=@holdings.csv" \
  -F "portfolioName=My Zerodha Portfolio" \
  -F "clientId=YOUR_CLIENT_ID"
```

Or via frontend file upload interface.

### Supported CSV Formats:

#### Zerodha Format (Auto-detected)
```csv
Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
RELIANCE,50,2450.00,2580.00,129000.00,6500.00,+2.65%,+1.2%
TCS,30,3200.00,3450.00,103500.00,7500.00,+7.81%,+0.8%
```

#### Generic Format (Auto-detected)
```csv
ticker,quantity,purchasePrice,currentPrice,purchaseDate
RELIANCE,50,2450.00,2580.00,2024-01-15
TCS,30,3200.00,3450.00,2024-02-20
```

**Template Files**: See `examples/` folder for templates.

---

## Method 2: JSON Upload

Perfect for programmatic imports or if you have portfolio data in JSON format.

### Example JSON Format:

```json
{
  "clientId": "YOUR_CLIENT_ID",
  "portfolioName": "My Stock Portfolio",
  "currency": "INR",
  "asOfDate": "2024-10-24",
  "holdings": [
    {
      "ticker": "RELIANCE",
      "quantity": 50,
      "purchasePrice": 2450.00,
      "currentPrice": 2580.00,
      "purchaseDate": "2024-01-15"
    }
  ]
}
```

### How to Import:

```bash
curl -X POST http://localhost:3001/api/portfolio/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@portfolio.json"
```

**Template**: See `examples/portfolio-template.json`

---

## Method 3: Manual Entry via API

Perfect for building custom frontends or programmatic bulk imports.

### API Endpoint:

```
POST /api/portfolio/create
Content-Type: application/json
```

### Request Body:

```json
{
  "clientId": "MY_CLIENT_ID",
  "portfolioName": "My Portfolio",
  "currency": "INR",
  "holdings": [
    {
      "ticker": "RELIANCE",
      "quantity": 50,
      "purchasePrice": 2450.00,
      "currentPrice": 2580.00,
      "purchaseDate": "2024-01-15"
    },
    {
      "ticker": "TCS",
      "quantity": 30,
      "purchasePrice": 3200.00,
      "currentPrice": 3450.00
    }
  ]
}
```

### Example:

```bash
curl -X POST http://localhost:3001/api/portfolio/create \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "CLIENT001",
    "portfolioName": "My Portfolio",
    "currency": "INR",
    "holdings": [
      {
        "ticker": "RELIANCE",
        "quantity": 50,
        "purchasePrice": 2450.00,
        "currentPrice": 2580.00
      }
    ]
  }'
```

### Required Fields:

- `ticker` (string): Stock symbol
- `quantity` (number): Number of shares
- `purchasePrice` (number): Average purchase price per share

### Optional Fields:

- `currentPrice` (number): Current market price (defaults to purchasePrice)
- `purchaseDate` (string): Purchase date in YYYY-MM-DD format

---

## Method 4: Zerodha Kite API

Direct integration with Zerodha Kite Connect API.

### Setup:

1. Create app at https://developers.kite.trade/
2. Set Redirect URL to: `http://localhost:3001/api/kite/callback`
3. Add credentials to `.env`:
   ```env
   KITE_API_KEY=your_api_key
   KITE_API_SECRET=your_api_secret
   ```

### Authentication (Required Daily):

1. Get login URL:
   ```bash
   curl http://localhost:3001/api/kite/login-url
   ```

2. Open the `loginUrl` in browser and authorize

3. You'll be redirected back and token will be saved

### Import Portfolio:

```bash
curl -X POST http://localhost:3001/api/kite/import
```

### Why Daily Authentication?

Zerodha access tokens expire every day at 6 AM for security reasons. This is a Zerodha limitation, not a bug in the app.

### Alternative: Use CSV Export Instead

Since tokens expire daily, we recommend using **Method 1 (CSV Upload)** which doesn't require daily authentication.

---

## Comparison Table

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| CSV Upload | Zerodha users | Simple, no auth needed | Manual export daily |
| JSON Upload | Advanced users | Flexible, programmatic | Need to prepare JSON |
| Manual API | Custom integrations | Full control | More complex |
| Kite API | Real-time sync | Automatic data | Daily auth required |

---

## Recommended Workflow for Zerodha Users

1. **Daily**: Export CSV from Zerodha Console (2 clicks)
2. **Upload**: Drag & drop CSV into Portfolio Insights
3. **Analyze**: Get AI-powered insights instantly

No authentication hassles! 🎉

---

## Testing the Import

After importing, verify your portfolio:

```bash
# Get all portfolios
curl http://localhost:3001/api/portfolio

# Get specific portfolio
curl http://localhost:3001/api/portfolio/{portfolio_id}
```

---

## Troubleshooting

### CSV Upload Fails

- Ensure CSV has headers in first row
- Check that numbers don't have currency symbols
- Try the generic CSV template if Zerodha format doesn't work

### JSON Upload Fails

- Validate JSON syntax at https://jsonlint.com
- Ensure all required fields are present
- Check that numbers are not quoted

### Kite API Errors

- "Incorrect api_key or access_token": Token expired, re-authenticate
- "Not configured": Check `.env` has `KITE_API_KEY` and `KITE_API_SECRET`

### General Issues

- Restart backend after `.env` changes
- Check backend logs for detailed error messages
- Ensure file encoding is UTF-8

---

## Need Help?

- Check example files in `examples/` folder
- Review API responses for detailed error messages
- File an issue on GitHub

