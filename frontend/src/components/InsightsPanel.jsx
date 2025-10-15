export default function InsightsPanel({ insights }) {
  const severityIcons = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    error: '✕'
  };

  return (
    <div>
      <h3 style={{ color: '#FF6600', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        AI Insights & Alerts
      </h3>
      <div className="insights-list">
        {insights.map((insight, index) => (
          <div key={index} className={`insight ${insight.severity}`}>
            <span style={{ marginRight: '8px', fontSize: '1rem' }}>
              {severityIcons[insight.severity] || 'ℹ'}
            </span>
            {insight.ticker && (
              <strong style={{ color: '#FF6600', marginRight: '5px' }}>
                {insight.ticker}:
              </strong>
            )}
            {insight.message}
          </div>
        ))}
      </div>
    </div>
  );
}
