import { useState, useEffect } from 'react';
import { portfolioApi } from './services/api';
import PortfolioUpload from './components/PortfolioUpload';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const result = await portfolioApi.getAll();
      setPortfolios(result.portfolios || []);
    } catch (error) {
      console.error('Error loading portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (portfolio) => {
    setPortfolios([...portfolios, portfolio]);
    setSelectedPortfolio(portfolio);
  };

  const handleDeletePortfolio = async (id) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

    try {
      await portfolioApi.delete(id);
      setPortfolios(portfolios.filter(p => p.id !== id));
      if (selectedPortfolio?.id === id) {
        setSelectedPortfolio(null);
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      alert('Failed to delete portfolio');
    }
  };

  if (selectedPortfolio) {
    return (
      <div className="app">
        <div className="container">
          <Dashboard
            portfolio={selectedPortfolio}
            onBack={() => setSelectedPortfolio(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Portfolio Insights</h1>
          <p>AI-powered portfolio analysis using Morningstar and financial data</p>
        </div>

        <PortfolioUpload onUploadSuccess={handleUploadSuccess} />

        <div className="card">
          <h2>Your Portfolios</h2>
          {loading ? (
            <div className="loading">Loading portfolios...</div>
          ) : portfolios.length === 0 ? (
            <p style={{ color: '#7f8c8d', textAlign: 'center', padding: '20px' }}>
              No portfolios yet. Upload a JSON file to get started.
            </p>
          ) : (
            <div className="portfolio-list">
              {portfolios.map((portfolio) => (
                <div key={portfolio.id} className="portfolio-item">
                  <div
                    className="portfolio-info"
                    onClick={() => setSelectedPortfolio(portfolio)}
                    style={{ flex: 1, cursor: 'pointer' }}
                  >
                    <h3>{portfolio.portfolioName}</h3>
                    <p>
                      Client: {portfolio.clientId} • {portfolio.holdings?.length || 0} holdings
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePortfolio(portfolio.id);
                    }}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
