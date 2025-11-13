# Testing CSV Import

## Step 1: Restart Backend Server

**Important**: Stop your current backend server and restart it to load the new CSV import code.

```bash
cd backend
npm run dev
```

## Step 2: Test with Example File

### Option A: Using curl

```bash
curl -X POST http://localhost:3001/api/portfolio/upload \
  -F "file=@examples/zerodha-portfolio-template.csv" \
  -F "portfolioName=My Test Portfolio" \
  -F "clientId=TEST001"
```

### Option B: Using Postman

1. Create new POST request to: `http://localhost:3001/api/portfolio/upload`
2. Select "Body" → "form-data"
3. Add fields:
   - `file` (type: File) → Select `examples/zerodha-portfolio-template.csv`
   - `portfolioName` (type: Text) → "My Test Portfolio"
   - `clientId` (type: Text) → "TEST001"
4. Click Send

### Option C: Using Your Own Zerodha CSV

1. Go to https://console.zerodha.com/
2. Click on "Holdings"
3. Click "Export" button → Download CSV
4. Upload that CSV file using either method above

## Step 3: Verify Import

```bash
curl http://localhost:3001/api/portfolio
```

You should see your imported portfolio with all holdings!

## Expected Response

```json
{
  "success": true,
  "portfolio": {
    "id": "port_...",
    "clientId": "TEST001",
    "portfolioName": "My Test Portfolio",
    "currency": "INR",
    "holdings": [...]
  },
  "format": "zerodha",
  "summary": {
    "holdingsCount": 5,
    "totalValue": 347300,
    "totalCost": 341000
  }
}
```

## Supported CSV Formats

✅ **Zerodha Console Export** (auto-detected)
✅ **Generic CSV** with columns: ticker, quantity, purchasePrice, currentPrice

See `examples/` folder for template files.
