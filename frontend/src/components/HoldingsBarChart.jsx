import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function HoldingsBarChart({ holdings }) {
  // Get top 10 holdings by value
  const topHoldings = holdings
    .filter(h => h.currentValue)
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 10)
    .map(h => ({
      ticker: h.ticker,
      value: h.currentValue,
      gainLoss: h.gainLoss || 0,
      gainLossPercent: h.gainLossPercent || 0
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: '#151B35',
          border: '1px solid #FF6600',
          padding: '10px',
          borderRadius: '2px'
        }}>
          <p style={{ color: '#FF6600', fontWeight: 700, marginBottom: '5px' }}>
            {data.ticker}
          </p>
          <p style={{ color: '#E8E9ED', margin: '2px 0', fontSize: '0.85rem' }}>
            Value: ${data.value.toLocaleString()}
          </p>
          <p style={{ color: data.gainLoss >= 0 ? '#00C853' : '#CC1F2E', margin: '2px 0', fontSize: '0.85rem' }}>
            P/L: ${data.gainLoss.toLocaleString()} ({data.gainLossPercent >= 0 ? '+' : ''}{data.gainLossPercent.toFixed(2)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h3 style={{ color: '#FF6600', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Top 10 Holdings by Value
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topHoldings} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2847" />
          <XAxis
            dataKey="ticker"
            stroke="#8B92A8"
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis
            stroke="#8B92A8"
            style={{ fontSize: '0.75rem' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]}>
            {topHoldings.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.gainLoss >= 0 ? '#00C853' : '#CC1F2E'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
