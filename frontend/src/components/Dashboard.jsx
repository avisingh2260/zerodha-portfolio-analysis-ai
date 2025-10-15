import { useState, useEffect } from 'react';
import { insightsApi, chatApi } from '../services/api';
import HoldingsTable from './HoldingsTable';
import PerformanceChart from './PerformanceChart';
import InsightsPanel from './InsightsPanel';
import TimeSeriesChart from './TimeSeriesChart';
import HoldingsBarChart from './HoldingsBarChart';
import MarketOverview from './MarketOverview';
import NewsTicker from './NewsTicker';
import ChatPanel from './ChatPanel';

export default function Dashboard({ portfolio, onBack }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalysis();
  }, [portfolio.id]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await insightsApi.analyzePortfolio(portfolio.id);
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to analyze portfolio');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>Analyzing portfolio...</h2>
        <p>Fetching data from Morningstar and other sources</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">{error}</div>
        <button onClick={onBack} className="btn btn-primary">Back</button>
      </div>
    );
  }

  if (!analysis) return null;

  const { metrics, insights } = analysis;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: metrics.currency
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div>
      {/* Header Bar */}
      <div className="card" style={{ marginBottom: '10px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button onClick={onBack} className="btn btn-primary" style={{ marginRight: '20px' }}>
              ← Back
            </button>
            <span style={{ color: '#E8E9ED', fontSize: '1.2rem', fontWeight: 700 }}>
              {portfolio.portfolioName}
            </span>
            <span style={{ color: '#8B92A8', fontSize: '0.85rem', marginLeft: '15px' }}>
              Client: {portfolio.clientId}
            </span>
          </div>
          <div style={{ color: '#8B92A8', fontSize: '0.75rem', fontFamily: 'Roboto Mono, monospace' }}>
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Value</h3>
          <div className="value">{formatCurrency(metrics.totalValue)}</div>
        </div>
        <div className={`metric-card ${metrics.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
          <h3>Gain/Loss</h3>
          <div className="value">{formatCurrency(metrics.totalGainLoss)}</div>
          <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{formatPercent(metrics.totalGainLossPercent)}</div>
        </div>
        <div className="metric-card">
          <h3>Total Cost</h3>
          <div className="value">{formatCurrency(metrics.totalCost)}</div>
        </div>
        <div className="metric-card">
          <h3>Holdings</h3>
          <div className="value">{metrics.holdingsCount}</div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="dashboard-grid">
        {/* Time Series Chart - Span 8 columns */}
        <div className="grid-item span-8">
          <TimeSeriesChart holdings={analysis.portfolio.holdings} />
        </div>

        {/* Market Overview - Span 4 columns */}
        <div className="grid-item span-4">
          <MarketOverview holdings={analysis.portfolio.holdings} />
        </div>

        {/* Bar Chart - Span 6 columns */}
        <div className="grid-item span-6">
          <HoldingsBarChart holdings={analysis.portfolio.holdings} />
        </div>

        {/* Allocation Charts - Span 6 columns */}
        <div className="grid-item span-6">
          <PerformanceChart
            holdings={analysis.portfolio.holdings}
            sectorAllocation={metrics.sectorAllocation}
          />
        </div>

        {/* AI Insights - Span 12 columns */}
        {insights && insights.length > 0 && (
          <div className="grid-item span-12">
            <InsightsPanel insights={insights} />
          </div>
        )}

        {/* Portfolio News Ticker - Span 12 columns */}
        <div className="grid-item span-12">
          <NewsTicker portfolioId={portfolio.id} />
        </div>

        {/* Chat Panel - Span 12 columns */}
        <div className="grid-item span-12">
          <ChatPanel portfolioId={portfolio.id} chatApi={chatApi} />
        </div>

        {/* Holdings Table - Span 12 columns */}
        <div className="grid-item span-12">
          <HoldingsTable
            holdings={analysis.portfolio.holdings}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </div>
      </div>
    </div>
  );
}
