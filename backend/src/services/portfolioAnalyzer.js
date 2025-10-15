import { perplexityService } from './perplexity.js';
import { mockMarketDataService } from './mockMarketData.js';

export class PortfolioAnalyzer {
  async analyzePortfolio(portfolio) {
    try {
      // Check if this is a Kite-imported portfolio
      const isKitePortfolio = portfolio.metadata?.source === 'zerodha_kite';

      // Extract unique tickers
      const tickers = [...new Set(portfolio.holdings.map(h => h.ticker))];

      // Use mock data for development/testing, or Perplexity for production
      const useMockData = process.env.USE_MOCK_DATA === 'true';
      console.log(`Using ${useMockData ? 'MOCK' : 'PERPLEXITY'} market data service...`);

      // Always fetch market data for sector/rating info
      // For Kite portfolios, we'll use Kite prices but Perplexity's sector/rating
      let marketData = [];
      if (!useMockData) {
        marketData = await perplexityService.getBatchSecurityData(tickers);
      } else if (!isKitePortfolio) {
        marketData = await mockMarketDataService.getBatchSecurityData(tickers);
      }

      // Enrich holdings with current data
      const enrichedHoldings = this.enrichHoldings(portfolio.holdings, marketData, isKitePortfolio);

      // Calculate portfolio metrics
      const metrics = this.calculateMetrics(enrichedHoldings, portfolio.currency);

      // Generate insights
      const insights = await this.generateInsights(enrichedHoldings, metrics);

      return {
        portfolio: {
          ...portfolio,
          holdings: enrichedHoldings
        },
        metrics,
        insights
      };
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw error;
    }
  }

  enrichHoldings(holdings, marketData, isKitePortfolio = false) {
    const dataMap = new Map(
      marketData
        .filter(d => !d.error)
        .map(d => [d.ticker, d])
    );

    return holdings.map(holding => {
      const data = dataMap.get(holding.ticker);

      // For Kite portfolios, preserve original prices and calculations
      if (isKitePortfolio) {
        console.log(`  Preserving Kite data for ${holding.ticker}: price=${holding.currentPrice}, value=${holding.currentValue}, gain=${holding.gainLoss}`);
        // Already has currentPrice, currentValue, costBasis, gainLoss from Kite
        // But enrich with sector/rating from Perplexity if available
        return {
          ...holding,
          sector: data?.sector || 'Unknown',
          marketData: {
            marketCap: data?.marketCap || null,
            peRatio: data?.peRatio || null,
            eps: data?.eps || null,
            dividendYield: data?.dividendYield || null,
            week52High: data?.week52High || null,
            week52Low: data?.week52Low || null,
            analystRating: data?.analystRating || null,
            sector: data?.sector || 'Unknown'
          }
        };
      }

      // For non-Kite portfolios, fetch and calculate as before
      if (!data) {
        return { ...holding, error: 'Market data not available' };
      }

      const currentPrice = data.lastPrice || 0;
      const currentValue = currentPrice * holding.quantity;
      const costBasis = holding.purchasePrice * holding.quantity;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return {
        ...holding,
        currentPrice,
        currentValue,
        costBasis,
        gainLoss,
        gainLossPercent,
        sector: data.sector || 'Unknown',
        marketData: {
          marketCap: data.marketCap,
          peRatio: data.peRatio,
          eps: data.eps,
          dividendYield: data.dividendYield,
          week52High: data.week52High,
          week52Low: data.week52Low,
          analystRating: data.analystRating,
          sector: data.sector
        }
      };
    });
  }

  calculateMetrics(holdings, currency) {
    const validHoldings = holdings.filter(h => !h.error);

    const totalValue = validHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    const totalCost = validHoldings.reduce((sum, h) => sum + (h.costBasis || 0), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // Sector allocation
    const sectorAllocation = {};
    validHoldings.forEach(h => {
      const sector = h.marketData?.sector || 'Unknown';
      sectorAllocation[sector] = (sectorAllocation[sector] || 0) + (h.currentValue || 0);
    });

    // Convert to percentages
    const sectorAllocationPercent = {};
    Object.entries(sectorAllocation).forEach(([sector, value]) => {
      sectorAllocationPercent[sector] = totalValue > 0 ? (value / totalValue) * 100 : 0;
    });

    return {
      currency,
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      holdingsCount: validHoldings.length,
      sectorAllocation: sectorAllocationPercent,
      topHoldings: validHoldings
        .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
        .slice(0, 5)
        .map(h => ({
          ticker: h.ticker,
          value: h.currentValue,
          percentOfPortfolio: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0
        }))
    };
  }

  async generateInsights(holdings, metrics) {
    const insights = [];

    // Analyst rating analysis
    holdings.forEach(h => {
      if (h.marketData?.analystRating) {
        const rating = h.marketData.analystRating.toLowerCase();
        if (rating.includes('buy') && !rating.includes('sell')) {
          insights.push({
            type: 'buy_rated',
            ticker: h.ticker,
            message: `${h.ticker} has analyst rating: ${h.marketData.analystRating}`,
            severity: 'info'
          });
        } else if (rating.includes('sell')) {
          insights.push({
            type: 'sell_rated',
            ticker: h.ticker,
            message: `${h.ticker} has analyst rating: ${h.marketData.analystRating}`,
            severity: 'warning'
          });
        }
      }

      // 52-week high/low analysis
      if (h.currentPrice && h.marketData?.week52High && h.marketData?.week52Low) {
        const currentPrice = h.currentPrice;
        const range = h.marketData.week52High - h.marketData.week52Low;
        const positionInRange = (currentPrice - h.marketData.week52Low) / range;

        if (positionInRange > 0.9) {
          insights.push({
            type: 'near_high',
            ticker: h.ticker,
            message: `${h.ticker} is trading near its 52-week high`,
            severity: 'info'
          });
        } else if (positionInRange < 0.1) {
          insights.push({
            type: 'near_low',
            ticker: h.ticker,
            message: `${h.ticker} is trading near its 52-week low`,
            severity: 'warning'
          });
        }
      }
    });

    // Concentration risk
    if (metrics.topHoldings.length > 0 && metrics.topHoldings[0].percentOfPortfolio > 30) {
      insights.push({
        type: 'concentration',
        ticker: metrics.topHoldings[0].ticker,
        message: `High concentration in ${metrics.topHoldings[0].ticker} (${metrics.topHoldings[0].percentOfPortfolio.toFixed(1)}% of portfolio)`,
        severity: 'warning'
      });
    }

    // Overall performance
    if (metrics.totalGainLossPercent > 10) {
      insights.push({
        type: 'performance',
        message: `Portfolio showing strong performance (+${metrics.totalGainLossPercent.toFixed(2)}%)`,
        severity: 'success'
      });
    } else if (metrics.totalGainLossPercent < -10) {
      insights.push({
        type: 'performance',
        message: `Portfolio underperforming (${metrics.totalGainLossPercent.toFixed(2)}%)`,
        severity: 'error'
      });
    }

    return insights;
  }
}

export const portfolioAnalyzer = new PortfolioAnalyzer();
