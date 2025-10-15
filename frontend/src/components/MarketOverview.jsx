export default function MarketOverview({ holdings }) {
  // Calculate sector performance
  const sectorPerformance = {};

  holdings.forEach(holding => {
    const sector = holding.marketData?.sector || 'Unknown';
    if (!sectorPerformance[sector]) {
      sectorPerformance[sector] = {
        totalValue: 0,
        totalGainLoss: 0,
        count: 0
      };
    }
    sectorPerformance[sector].totalValue += holding.currentValue || 0;
    sectorPerformance[sector].totalGainLoss += holding.gainLoss || 0;
    sectorPerformance[sector].count += 1;
  });

  const sectorData = Object.entries(sectorPerformance)
    .map(([sector, data]) => ({
      sector,
      ...data,
      avgGainLossPercent: ((data.totalGainLoss / (data.totalValue - data.totalGainLoss)) * 100) || 0
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  return (
    <div>
      <h3 style={{ color: '#FF6600', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Sector Overview
      </h3>
      <div className="ticker-display">
        {sectorData.map((sector, index) => (
          <div key={index} className="ticker-item">
            <span className="ticker-symbol">{sector.sector}</span>
            <span className="ticker-value">${(sector.totalValue / 1000).toFixed(1)}K</span>
            <span className={`ticker-change ${sector.avgGainLossPercent >= 0 ? 'positive' : 'negative'}`}>
              {sector.avgGainLossPercent >= 0 ? '▲' : '▼'} {Math.abs(sector.avgGainLossPercent).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          {sectorData.map((sector, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                background: '#0F1424',
                borderRadius: '2px',
                borderLeft: `3px solid ${sector.avgGainLossPercent >= 0 ? '#00C853' : '#CC1F2E'}`
              }}
            >
              <div>
                <div style={{ color: '#E8E9ED', fontSize: '0.85rem', fontWeight: 600 }}>
                  {sector.sector}
                </div>
                <div style={{ color: '#8B92A8', fontSize: '0.75rem' }}>
                  {sector.count} holdings
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#E8E9ED', fontSize: '0.9rem', fontFamily: 'Roboto Mono, monospace', fontWeight: 700 }}>
                  ${sector.totalValue.toLocaleString()}
                </div>
                <div style={{
                  color: sector.avgGainLossPercent >= 0 ? '#00C853' : '#CC1F2E',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {sector.avgGainLossPercent >= 0 ? '+' : ''}{sector.avgGainLossPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
