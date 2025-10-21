# Zerodha Portfolio Analysis AI

AI-powered portfolio analysis tool with real-time insights using Perplexity Finance. Analyze your Zerodha Kite portfolio, get market insights, and chat with an AI assistant about your investments.

![Portfolio Analysis Dashboard](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

🤖 **AI Chat Assistant** - Ask questions about your portfolio using Perplexity Finance
- Natural language portfolio queries
- Real-time market data and insights
- Conversational context with multi-turn support

📊 **Portfolio Analytics**
- Real-time portfolio valuation
- Gain/loss tracking with percentage changes
- Sector allocation analysis
- Holdings breakdown with current prices

📈 **Market Data Integration**
- Zerodha Kite live data integration
- Perplexity Finance API for market insights
- Analyst ratings and P/E ratios
- 52-week high/low tracking

📰 **News & Insights**
- Portfolio-specific news ticker
- AI-generated insights and recommendations
- Sector-wise performance analysis

🎨 **Bloomberg-Style UI**
- Professional dark theme terminal interface
- Interactive charts (Recharts)
- Real-time data updates
- Responsive grid layout

## Tech Stack

### Backend
- **Node.js** with Express
- **NeDB** for local data storage
- **Perplexity AI** for financial insights
- **Zerodha Kite Connect** for portfolio data
- **Axios** for API calls
- **Node-cron** for scheduled updates

### Frontend
- **React 18** with Vite
- **Recharts** for data visualization
- **Axios** for API integration
- **TypeScript** for type safety

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/avisingh2260/zerodha-portfolio-analysis-ai.git
cd zerodha-portfolio-analysis-ai
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Server Configuration
PORT=3001

# Perplexity AI API Key (Required for AI chat and market insights)
# Get your API key from: https://www.perplexity.ai/settings/api
PERPLEXITY_API_KEY=pplx-your-api-key-here

# Zerodha Kite Connect (Optional - for live portfolio sync)
KITE_API_KEY=your-kite-api-key
KITE_API_SECRET=your-kite-api-secret

# Optional: Use mock data for testing
USE_MOCK_DATA=false
```

### Getting API Keys

#### Perplexity AI API Key (Required)
1. Visit [Perplexity AI API Settings](https://www.perplexity.ai/settings/api)
2. Sign up or log in
3. Generate a new API key
4. Copy and paste into your `.env` file

#### Zerodha Kite API (Optional)
1. Visit [Kite Connect](https://developers.kite.trade/)
2. Sign up for a developer account
3. Create a new app
4. Set the **Redirect URL** to: `http://localhost:3001/api/kite/callback`
5. Copy API Key and API Secret to your `.env` file
6. You can now authenticate via the UI by clicking "Connect to Zerodha Kite"

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### Start Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### 1. Upload Portfolio

You can upload your portfolio in two ways:

#### Option A: Upload JSON File
Create a JSON file with your portfolio data:

```json
{
  "clientId": "CLIENT_001",
  "portfolioName": "My Investment Portfolio",
  "currency": "USD",
  "asOfDate": "2025-10-15",
  "holdings": [
    {
      "ticker": "AAPL",
      "quantity": 100,
      "purchasePrice": 150.00,
      "purchaseDate": "2024-01-15"
    },
    {
      "ticker": "MSFT",
      "quantity": 50,
      "purchasePrice": 350.00,
      "purchaseDate": "2024-03-20"
    }
  ]
}
```

Click "Upload Portfolio" and select your JSON file.

#### Option B: Zerodha Kite Integration (Coming Soon)
Sync your portfolio directly from Zerodha Kite using OAuth.

### 2. View Dashboard

Once uploaded, you'll see:
- **Key Metrics**: Total value, gain/loss, holdings count
- **Time Series Chart**: Price trends over time
- **Holdings Table**: Detailed view of all positions
- **Sector Allocation**: Pie chart of sector distribution
- **Market Overview**: Real-time market metrics
- **News Ticker**: Latest news for your holdings

### 3. Chat with AI Assistant

Click on the **Portfolio Assistant** panel to ask questions like:
- "What's the overall performance of my portfolio?"
- "Which sectors am I most exposed to?"
- "What are the biggest winners and losers?"
- "Should I rebalance my portfolio?"
- "What's the latest news affecting my holdings?"

The AI will provide personalized insights based on your actual portfolio data and current market conditions.

## Project Structure

```
zerodha-portfolio-analysis-ai/
├── backend/
│   ├── src/
│   │   ├── db/              # Database configuration
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   │   ├── chat.js      # Chat endpoints
│   │   │   ├── portfolio.js # Portfolio management
│   │   │   ├── insights.js  # Analytics endpoints
│   │   │   └── kite.js      # Kite integration
│   │   ├── services/
│   │   │   ├── chat.js              # Chat service
│   │   │   ├── perplexity.js        # Perplexity API
│   │   │   ├── portfolioAnalyzer.js # Portfolio analytics
│   │   │   ├── kiteService.js       # Kite integration
│   │   │   └── scheduler.js         # Background jobs
│   │   └── index.js         # Server entry point
│   ├── data/                # NeDB database files
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatPanel.jsx        # AI chat interface
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── HoldingsTable.jsx    # Holdings table
│   │   │   ├── PerformanceChart.jsx # Charts
│   │   │   ├── NewsTicker.jsx       # News feed
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.ts       # API client
│   │   ├── types/           # TypeScript types
│   │   ├── App.jsx          # Root component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── sample-portfolio.json    # Example portfolio data
└── README.md
```

## API Endpoints

### Portfolio Management
- `GET /api/portfolio` - Get all portfolios
- `POST /api/portfolio/upload` - Upload new portfolio
- `DELETE /api/portfolio/:id` - Delete portfolio

### Analytics
- `GET /api/insights/portfolio/:id` - Get portfolio analysis
- `GET /api/insights/news/:id` - Get portfolio news
- `POST /api/insights/portfolio/:id/refresh` - Force refresh

### AI Chat
- `POST /api/chat/portfolio/:id` - Send chat message
- `DELETE /api/chat/conversation/:conversationId` - Clear conversation

### Health Check
- `GET /health` - Check server status

## Features in Detail

### Chat Assistant
The AI chat assistant uses Perplexity Finance to provide:
- Real-time market insights
- Portfolio-specific advice
- Sector analysis
- Risk assessment
- News summaries

Context includes:
- Portfolio metrics (value, gain/loss, holdings)
- Sector allocations
- Individual holding details
- Analyst ratings and P/E ratios
- Historical performance

### Portfolio Analytics
Automatic analysis includes:
- Total portfolio valuation
- Gain/loss calculations
- Sector allocation breakdown
- Top holdings by value
- Concentration risk alerts
- 52-week high/low positions

### Scheduled Updates
Background jobs run automatically:
- Portfolio analysis refresh: Every 30 minutes
- News updates: Every 15 minutes
- Market data sync: Real-time via Kite

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check if port 3001 is available
- Verify `.env` file exists with valid API keys
- Run `npm install` in backend directory

**Frontend won't connect:**
- Ensure backend is running on port 3001
- Check browser console for errors
- Verify API base URL in `frontend/src/services/api.ts`

**Chat not working:**
- Verify `PERPLEXITY_API_KEY` is set in `.env`
- Check backend logs for API errors
- Ensure you have an active Perplexity API subscription

**401 Unauthorized from Perplexity:**
- API key is invalid or expired
- Get a new API key from https://www.perplexity.ai/settings/api
- Update `.env` and restart backend

### Debug Mode

Enable detailed logging:

```bash
# Backend
DEBUG=* npm run dev

# Frontend
npm run dev
```

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Frontend build
cd frontend
npm run build

# The build output will be in frontend/dist/
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Perplexity AI](https://www.perplexity.ai/) for financial insights API
- [Zerodha Kite](https://kite.trade/) for portfolio data integration
- [Recharts](https://recharts.org/) for data visualization
- [React](https://react.dev/) and [Vite](https://vitejs.dev/) for the frontend framework

## Support

For issues, questions, or contributions:
- 📧 Email: avisingh2260@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/avisingh2260/zerodha-portfolio-analysis-ai/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/avisingh2260/zerodha-portfolio-analysis-ai/discussions)

## Roadmap

- [ ] Add support for multiple portfolios
- [ ] Real-time notifications for significant price movements
- [ ] Advanced charting with technical indicators
- [ ] Export portfolio reports (PDF/Excel)
- [ ] Mobile-responsive design improvements
- [ ] Integration with more brokers
- [ ] Machine learning-based predictions
- [ ] Social features (share insights)

---

**Built with ❤️ by Avi Singh**

🤖 *Powered by Perplexity Finance & Claude Code*
