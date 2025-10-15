// Mock market data service for development and testing
// Provides realistic current market data for major stocks and ETFs

export class MockMarketDataService {
  constructor() {
    // Realistic market data as of October 2025
    this.mockData = {
      'AAPL': {
        lastPrice: 235.50,
        marketCap: 3.62e12,
        peRatio: 36.8,
        eps: 6.42,
        sector: 'Technology',
        dividendYield: 0.42,
        week52High: 250.20,
        week52Low: 164.30,
        analystRating: 'buy'
      },
      'MSFT': {
        lastPrice: 425.30,
        marketCap: 3.18e12,
        peRatio: 35.2,
        eps: 12.08,
        sector: 'Technology',
        dividendYield: 0.68,
        week52High: 440.75,
        week52Low: 309.45,
        analystRating: 'buy'
      },
      'GOOGL': {
        lastPrice: 168.90,
        marketCap: 2.12e12,
        peRatio: 28.5,
        eps: 5.93,
        sector: 'Technology',
        dividendYield: 0.00,
        week52High: 175.80,
        week52Low: 121.45,
        analystRating: 'buy'
      },
      'NVDA': {
        lastPrice: 582.40,
        marketCap: 1.45e12,
        peRatio: 68.2,
        eps: 8.54,
        sector: 'Technology',
        dividendYield: 0.03,
        week52High: 612.50,
        week52Low: 362.80,
        analystRating: 'strong buy'
      },
      'TSLA': {
        lastPrice: 268.30,
        marketCap: 852e9,
        peRatio: 72.4,
        eps: 3.71,
        sector: 'Automotive',
        dividendYield: 0.00,
        week52High: 299.50,
        week52Low: 138.80,
        analystRating: 'hold'
      },
      'JPM': {
        lastPrice: 218.75,
        marketCap: 625e9,
        peRatio: 12.8,
        eps: 17.09,
        sector: 'Financial Services',
        dividendYield: 2.15,
        week52High: 225.30,
        week52Low: 153.70,
        analystRating: 'buy'
      },
      'JNJ': {
        lastPrice: 168.50,
        marketCap: 405e9,
        peRatio: 18.3,
        eps: 9.21,
        sector: 'Healthcare',
        dividendYield: 2.95,
        week52High: 172.80,
        week52Low: 143.20,
        analystRating: 'hold'
      },
      'VOO': {
        lastPrice: 508.20,
        marketCap: null, // ETF
        peRatio: null,
        eps: null,
        sector: 'Diversified',
        dividendYield: 1.32,
        week52High: 520.40,
        week52Low: 391.50,
        analystRating: null
      },
      'BND': {
        lastPrice: 69.85,
        marketCap: null, // ETF
        peRatio: null,
        eps: null,
        sector: 'Fixed Income',
        dividendYield: 4.12,
        week52High: 71.20,
        week52Low: 66.30,
        analystRating: null
      },
      'XOM': {
        lastPrice: 121.40,
        marketCap: 485e9,
        peRatio: 14.2,
        eps: 8.55,
        sector: 'Energy',
        dividendYield: 3.18,
        week52High: 128.50,
        week52Low: 98.60,
        analystRating: 'buy'
      },
      'DIS': {
        lastPrice: 106.80,
        marketCap: 195e9,
        peRatio: 52.3,
        eps: 2.04,
        sector: 'Entertainment',
        dividendYield: 0.00,
        week52High: 112.90,
        week52Low: 78.50,
        analystRating: 'hold'
      },
      'VNQ': {
        lastPrice: 89.20,
        marketCap: null, // ETF
        peRatio: null,
        eps: null,
        sector: 'Real Estate',
        dividendYield: 3.85,
        week52High: 94.70,
        week52Low: 72.30,
        analystRating: null
      },
      'AMD': {
        lastPrice: 162.90,
        marketCap: 263e9,
        peRatio: 124.5,
        eps: 1.31,
        sector: 'Technology',
        dividendYield: 0.00,
        week52High: 178.40,
        week52Low: 93.20,
        analystRating: 'buy'
      },
      'PG': {
        lastPrice: 172.30,
        marketCap: 412e9,
        peRatio: 28.7,
        eps: 6.00,
        sector: 'Consumer Staples',
        dividendYield: 2.42,
        week52High: 178.50,
        week52Low: 149.20,
        analystRating: 'hold'
      },
      'GLD': {
        lastPrice: 238.50,
        marketCap: null, // ETF
        peRatio: null,
        eps: null,
        sector: 'Commodities',
        dividendYield: 0.00,
        week52High: 245.80,
        week52Low: 182.30,
        analystRating: null
      },
      'AMZN': {
        lastPrice: 195.80,
        marketCap: 2.03e12,
        peRatio: 45.8,
        eps: 4.27,
        sector: 'Technology',
        dividendYield: 0.00,
        week52High: 208.50,
        week52Low: 118.35,
        analystRating: 'buy'
      }
    };
  }

  async getSecurityData(ticker) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 10));

    const data = this.mockData[ticker];
    if (!data) {
      return {
        ticker,
        error: 'Ticker not found'
      };
    }

    return {
      ticker,
      ...data
    };
  }

  async getBatchSecurityData(tickers) {
    console.log(`Fetching mock data for ${tickers.length} securities...`);
    const promises = tickers.map(ticker => this.getSecurityData(ticker));
    return Promise.all(promises);
  }
}

export const mockMarketDataService = new MockMarketDataService();
