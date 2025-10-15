import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#FF6600', '#00C853', '#4A90E2', '#FFA726', '#E040FB', '#26C6DA', '#FFEB3B'];

export default function PerformanceChart({ holdings, sectorAllocation }) {
  const sectorData = Object.entries(sectorAllocation).map(([sector, percentage]) => ({
    name: sector,
    value: parseFloat(percentage.toFixed(2))
  }));

  const topHoldings = holdings
    .filter(h => h.currentValue)
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5)
    .map(h => ({
      name: h.ticker,
      value: h.currentValue
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#151B35',
          border: '1px solid #FF6600',
          padding: '10px',
          borderRadius: '2px',
          color: '#E8E9ED'
        }}>
          <p style={{ fontWeight: 700, marginBottom: '5px' }}>{payload[0].name}</p>
          <p style={{ fontSize: '0.85rem' }}>{payload[0].value.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipValue = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#151B35',
          border: '1px solid #FF6600',
          padding: '10px',
          borderRadius: '2px',
          color: '#E8E9ED'
        }}>
          <p style={{ fontWeight: 700, marginBottom: '5px' }}>{payload[0].name}</p>
          <p style={{ fontSize: '0.85rem' }}>${payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div>
        <h3 style={{ color: '#FF6600', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Sector Allocation
        </h3>
        {sectorData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name.substring(0, 3)}: ${value}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ textAlign: 'center', color: '#8B92A8' }}>No sector data available</p>
        )}
      </div>

      <div>
        <h3 style={{ color: '#FF6600', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Top 5 Holdings
        </h3>
        {topHoldings.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={topHoldings}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name }) => name}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {topHoldings.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltipValue />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ textAlign: 'center', color: '#8B92A8' }}>No holdings data available</p>
        )}
      </div>
    </div>
  );
}
