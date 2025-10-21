import { useState, useEffect } from 'react';
import { portfolioApi, kiteApi } from '../services/api';

export default function PortfolioUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [kiteStatus, setKiteStatus] = useState(null);
  const [kiteLoading, setKiteLoading] = useState(false);

  // Check for OAuth callback on component mount
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const kiteAuth = urlParams.get('kite_auth');
      const message = urlParams.get('message');

      if (kiteAuth === 'success') {
        // Authentication successful, clean URL and import portfolio
        window.history.replaceState({}, document.title, window.location.pathname);

        setKiteLoading(true);
        try {
          const result = await kiteApi.importPortfolio();
          if (result.success) {
            onUploadSuccess(result.portfolio);
          }
        } catch (err) {
          setError(err.response?.data?.error || err.message || 'Failed to import portfolio');
        } finally {
          setKiteLoading(false);
        }
      } else if (kiteAuth === 'error') {
        // Authentication failed
        window.history.replaceState({}, document.title, window.location.pathname);
        setError(message || 'Authentication failed');
      }
    };

    handleOAuthCallback();
  }, [onUploadSuccess]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await portfolioApi.uploadFile(file);
      if (result.success) {
        onUploadSuccess(result.portfolio);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleZerodhaConnect = async () => {
    setKiteLoading(true);
    setError(null);

    try {
      // Check if Kite is already configured
      const statusResult = await kiteApi.getStatus();

      if (statusResult.configured) {
        // Kite is configured, directly import portfolio
        const result = await kiteApi.importPortfolio();
        if (result.success) {
          onUploadSuccess(result.portfolio);
        }
      } else {
        // Need to authenticate - get login URL and redirect
        // The backend will redirect back to this page after authentication
        const loginResult = await kiteApi.getLoginUrl();
        if (loginResult.success) {
          // Redirect to Zerodha login page
          // Backend will handle the callback and redirect back with kite_auth parameter
          window.location.href = loginResult.loginUrl;
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to connect to Zerodha';
      setError(errorMessage);

      // If needsAuth is true, show instructions to authenticate
      if (err.response?.data?.needsAuth) {
        setError('Please connect your Zerodha account first by clicking the button above.');
      }
    } finally {
      setKiteLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Upload Portfolio</h2>

      {error && (
        <div className="error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="upload-section">
        <input
          type="file"
          id="portfolio-file"
          accept=".json"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        <label htmlFor="portfolio-file" className="upload-label">
          {uploading ? 'Uploading...' : 'Choose JSON File'}
        </label>
        <p style={{ marginTop: '16px', color: '#7f8c8d' }}>
          Upload your portfolio JSON file to get started
        </p>
      </div>

      <div style={{ margin: '24px 0', textAlign: 'center', color: '#95a5a6' }}>
        <span>OR</span>
      </div>

      <div className="upload-section">
        <button
          onClick={handleZerodhaConnect}
          disabled={kiteLoading || uploading}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: '500',
            color: 'white',
            backgroundColor: '#387ed1',
            border: 'none',
            borderRadius: '6px',
            cursor: kiteLoading ? 'wait' : 'pointer',
            width: '100%',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => !kiteLoading && (e.target.style.backgroundColor = '#2968b8')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#387ed1')}
        >
          {kiteLoading ? 'Connecting...' : 'Connect to Zerodha Kite'}
        </button>
        <p style={{ marginTop: '16px', color: '#7f8c8d', fontSize: '0.9rem' }}>
          Automatically import your portfolio from Zerodha
        </p>
      </div>

      <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '6px' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '8px' }}>Example JSON Format:</h3>
        <pre style={{ fontSize: '0.85rem', color: '#2d3748', overflow: 'auto' }}>
{`{
  "clientId": "CLIENT_001",
  "portfolioName": "My Portfolio",
  "currency": "USD",
  "holdings": [
    {
      "ticker": "AAPL",
      "quantity": 100,
      "purchasePrice": 150.00,
      "purchaseDate": "2024-01-15"
    }
  ]
}`}
        </pre>
      </div>
    </div>
  );
}
