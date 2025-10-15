import { KiteConnect } from 'kiteconnect';

class KiteService {
  constructor() {
    // Don't initialize in constructor - lazy load on first use
    this._initialized = false;
  }

  _initialize() {
    if (this._initialized) return;

    this.apiKey = process.env.KITE_API_KEY;
    this.apiSecret = process.env.KITE_API_SECRET;
    this.accessToken = process.env.KITE_ACCESS_TOKEN;

    if (this.apiKey && this.accessToken) {
      this.kite = new KiteConnect({
        api_key: this.apiKey
      });
      this.kite.setAccessToken(this.accessToken);
      console.log('✅ Kite Connect service initialized');
      this._initialized = true;
    } else {
      console.log('⚠️  Kite Connect credentials not found. Set KITE_API_KEY and KITE_ACCESS_TOKEN in .env');
    }
  }

  isConfigured() {
    this._initialize();
    return !!(this.apiKey && this.accessToken && this.kite);
  }

  async getPortfolio() {
    if (!this.isConfigured()) {
      throw new Error('Kite Connect is not configured. Please set KITE_API_KEY and KITE_ACCESS_TOKEN in .env');
    }

    try {
      console.log('📊 Fetching portfolio from Zerodha Kite...');

      // Get holdings (long-term investments)
      const holdings = await this.kite.getHoldings();

      // Get positions (intraday/short-term)
      const positions = await this.kite.getPositions();

      // Get profile for user info
      const profile = await this.kite.getProfile();

      console.log(`✅ Fetched ${holdings.length} holdings from Kite`);

      return {
        holdings,
        positions,
        profile
      };
    } catch (error) {
      console.error('❌ Error fetching from Kite:', error.message);
      throw error;
    }
  }

  /**
   * Transform Kite holdings to our portfolio format
   */
  transformToPortfolioFormat(kiteData) {
    const { holdings, profile } = kiteData;

    // Map Kite holdings to our format
    const portfolioHoldings = holdings.map(holding => {
      const quantity = holding.quantity;
      const avgPrice = holding.average_price;
      const currentPrice = holding.last_price;
      const costBasis = quantity * avgPrice;
      const currentValue = quantity * currentPrice;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return {
        ticker: holding.tradingsymbol,
        quantity: quantity,
        purchasePrice: avgPrice,
        purchaseDate: null, // Kite doesn't provide purchase date in holdings API
        currentPrice: currentPrice,
        currentValue: currentValue,
        costBasis: costBasis,
        gainLoss: gainLoss,
        gainLossPercent: gainLossPercent,
        exchange: holding.exchange,
        isin: holding.isin,
        instrumentToken: holding.instrument_token
      };
    });

    // Calculate totals
    const totalValue = portfolioHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = portfolioHoldings.reduce((sum, h) => sum + h.costBasis, 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      clientId: profile.user_id || 'KITE_USER',
      portfolioName: `${profile.user_name || 'My'} Zerodha Portfolio`,
      currency: 'INR',
      asOfDate: new Date().toISOString().split('T')[0],
      holdings: portfolioHoldings,
      metadata: {
        source: 'zerodha_kite',
        email: profile.email,
        userName: profile.user_name,
        broker: profile.broker,
        fetchedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get login URL for OAuth flow
   */
  getLoginUrl() {
    if (!this.apiKey) {
      throw new Error('KITE_API_KEY not configured');
    }
    return `https://kite.zerodha.com/connect/login?api_key=${this.apiKey}&v=3`;
  }

  /**
   * Generate session from request token (after OAuth login)
   */
  async generateSession(requestToken) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Kite API credentials not configured');
    }

    const kite = new KiteConnect({
      api_key: this.apiKey
    });

    const session = await kite.generateSession(requestToken, this.apiSecret);
    this.accessToken = session.access_token;
    this.kite = kite;
    this.kite.setAccessToken(this.accessToken);

    return session;
  }
}

export const kiteService = new KiteService();
