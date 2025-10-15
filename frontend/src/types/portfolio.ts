export interface Holding {
  ticker: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate?: string;
  currentPrice?: number;
  currentValue?: number;
  costBasis?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  marketData?: {
    marketCap?: number;
    starRating?: number;
    fairValueEstimate?: number;
    fairValueRatio?: number;
    economicMoat?: string;
    totalReturn1Year?: number;
    totalReturn3Year?: number;
    eps?: number;
    peRatio?: number;
    sector?: string;
  };
}

export interface Portfolio {
  id?: string;
  clientId: string;
  portfolioName: string;
  currency: string;
  asOfDate?: string;
  holdings: Holding[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioMetrics {
  currency: string;
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdingsCount: number;
  sectorAllocation: Record<string, number>;
  topHoldings: {
    ticker: string;
    value: number;
    percentOfPortfolio: number;
  }[];
}

export interface Insight {
  type: string;
  ticker?: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

export interface PortfolioAnalysis {
  portfolio: Portfolio;
  metrics: PortfolioMetrics;
  insights: Insight[];
}
