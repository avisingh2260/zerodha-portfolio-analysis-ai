import { useState, useEffect } from 'react';
import { insightsApi } from '../services/api';
import './NewsTicker.css';

export default function NewsTicker({ portfolioId }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNews();
  }, [portfolioId]);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await insightsApi.getPortfolioNews(portfolioId);
      setNews(result.news || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'bullish':
        return '#27ae60';
      case 'bearish':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'bullish':
        return '📈';
      case 'bearish':
        return '📉';
      default:
        return '📊';
    }
  };

  if (loading) {
    return (
      <div className="news-ticker-container">
        <div className="ticker-header">
          <span className="ticker-label">📰 PORTFOLIO NEWS</span>
          <span className="ticker-status">Loading from Perplexity AI...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-ticker-container">
        <div className="ticker-header">
          <span className="ticker-label">📰 PORTFOLIO NEWS</span>
          <span className="ticker-status error">{error}</span>
          <button onClick={loadNews} className="ticker-refresh-btn">🔄</button>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="news-ticker-container">
        <div className="ticker-header">
          <span className="ticker-label">📰 PORTFOLIO NEWS</span>
          <span className="ticker-status">No news available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="news-ticker-container">
      <div className="ticker-header">
        <span className="ticker-label">📰 MARKET NEWS WIRE</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="ticker-status">
            {news.length} updates • {new Date().toLocaleTimeString()}
          </span>
          <button onClick={loadNews} className="ticker-refresh-btn" title="Refresh news">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="wire-feed">
        {news.map((item, index) => (
          <div key={index} className="wire-item">
            <div className="wire-item-header">
              <div className="wire-time">
                {new Date(item.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </div>

              <div className="wire-ticker-badge" style={{
                background: getSentimentColor(item.sentiment) + '20',
                color: getSentimentColor(item.sentiment),
                border: `1px solid ${getSentimentColor(item.sentiment)}`
              }}>
                {item.ticker}
              </div>

              <div className="wire-sentiment-badge" style={{
                background: getSentimentColor(item.sentiment) + '15',
                color: getSentimentColor(item.sentiment)
              }}>
                {getSentimentIcon(item.sentiment)} {item.sentiment.toUpperCase()}
              </div>
            </div>

            <div className="wire-content">
              {item.content.replace(/\*\*/g, '').replace(/\n+/g, ' ').trim()}
            </div>

            {index < news.length - 1 && <div className="wire-divider"></div>}
          </div>
        ))}
      </div>

      <div className="ticker-footer">
        ⚡ Live updates powered by Perplexity AI • Real-time market intelligence
      </div>
    </div>
  );
}
