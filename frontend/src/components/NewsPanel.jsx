import { useState, useEffect } from 'react';
import { insightsApi } from '../services/api';

export default function NewsPanel({ portfolioId }) {
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
      <div className="card">
        <h2>Portfolio News & Updates</h2>
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '1.2rem', color: '#8B92A8' }}>
            Loading latest news from Perplexity AI...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Portfolio News & Updates</h2>
        <div className="error" style={{ textAlign: 'center', padding: '20px' }}>
          {error}
        </div>
        <button onClick={loadNews} className="btn btn-primary" style={{ margin: '10px auto', display: 'block' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Portfolio News & Updates</h2>
        <button onClick={loadNews} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          🔄 Refresh
        </button>
      </div>

      {news.length === 0 ? (
        <p style={{ color: '#7f8c8d', textAlign: 'center', padding: '20px' }}>
          No news available
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {news.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #1e2530 0%, #252d3d 100%)',
                borderRadius: '8px',
                border: '1px solid #3a4556',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    padding: '6px 12px',
                    background: '#2c3548',
                    borderRadius: '4px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#E8E9ED'
                  }}
                >
                  {item.ticker}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: getSentimentColor(item.sentiment) + '20',
                    border: `1px solid ${getSentimentColor(item.sentiment)}`,
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    color: getSentimentColor(item.sentiment)
                  }}
                >
                  <span>{getSentimentIcon(item.sentiment)}</span>
                  <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                    {item.sentiment}
                  </span>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6c757d' }}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </div>
              </div>

              <div
                style={{
                  color: '#C1C6D4',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {item.content}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#1a1f2b',
        borderRadius: '6px',
        fontSize: '0.85rem',
        color: '#8B92A8',
        textAlign: 'center'
      }}>
        📰 News powered by Perplexity AI • Updated in real-time
      </div>
    </div>
  );
}
