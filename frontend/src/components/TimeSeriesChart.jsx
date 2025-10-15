import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TimeSeriesChart({ holdings }) {
  // Generate mock time series data based on current holdings
  const generateTimeSeriesData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    const totalCurrentValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (h.purchasePrice * h.quantity), 0);

    return months.slice(0, currentMonth + 1).map((month, index) => {
      const progress = (index + 1) / (currentMonth + 1);
      const volatility = Math.sin(index * 0.5) * 0.05; // Add some volatility

      return {
        month,
        portfolioValue: Math.round(totalCost + (totalCurrentValue - totalCost) * progress + (totalCurrentValue * volatility)),
        costBasis: totalCost,
      };
    });
  };

  const data = generateTimeSeriesData();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#151B35',
          border: '1px solid #FF6600',
          padding: '10px',
          borderRadius: '2px'
        }}>
          <p style={{ color: '#FF6600', fontWeight: 700, marginBottom: '5px' }}>
            {payload[0].payload.month}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '2px 0', fontSize: '0.85rem' }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h3 style={{ color: '#FF6600', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Portfolio Performance
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00C853" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00C853" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B92A8" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#8B92A8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2847" />
          <XAxis dataKey="month" stroke="#8B92A8" style={{ fontSize: '0.75rem' }} />
          <YAxis stroke="#8B92A8" style={{ fontSize: '0.75rem' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#E8E9ED' }} />
          <Area
            type="monotone"
            dataKey="portfolioValue"
            stroke="#00C853"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
            name="Portfolio Value"
          />
          <Area
            type="monotone"
            dataKey="costBasis"
            stroke="#8B92A8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCost)"
            name="Cost Basis"
            strokeDasharray="5 5"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
