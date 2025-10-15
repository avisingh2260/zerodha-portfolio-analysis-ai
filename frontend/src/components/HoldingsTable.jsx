export default function HoldingsTable({ holdings, formatCurrency, formatPercent }) {
  return (
    <div>
      <h3 style={{ color: '#FF6600', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Holdings Details
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="holdings-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Qty</th>
              <th>Purchase Price</th>
              <th>Current Price</th>
              <th>Current Value</th>
              <th>Gain/Loss</th>
              <th>%</th>
              <th>Sector</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => (
              <tr key={index}>
                <td><strong style={{ color: '#FF6600' }}>{holding.ticker}</strong></td>
                <td>{holding.quantity}</td>
                <td>{formatCurrency(holding.purchasePrice)}</td>
                <td>{holding.currentPrice ? formatCurrency(holding.currentPrice) : '-'}</td>
                <td style={{ fontWeight: 700 }}>{holding.currentValue ? formatCurrency(holding.currentValue) : '-'}</td>
                <td className={holding.gainLoss >= 0 ? 'positive' : 'negative'}>
                  {holding.gainLoss ? formatCurrency(holding.gainLoss) : '-'}
                </td>
                <td className={holding.gainLossPercent >= 0 ? 'positive' : 'negative'}>
                  {holding.gainLossPercent ? formatPercent(holding.gainLossPercent) : '-'}
                </td>
                <td style={{ color: '#8B92A8' }}>{holding.marketData?.sector || '-'}</td>
                <td style={{ color: '#4A90E2' }}>{holding.marketData?.analystRating || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
