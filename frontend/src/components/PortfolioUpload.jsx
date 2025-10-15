import { useState } from 'react';
import { portfolioApi } from '../services/api';

export default function PortfolioUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

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
