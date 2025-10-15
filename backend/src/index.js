import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mcpManager } from './services/mcpClient.js';
import { schedulerService } from './services/scheduler.js';
import { db } from './db/database.js';
import portfolioRoutes from './routes/portfolio.js';
import insightsRoutes from './routes/insights.js';
import kiteRoutes from './routes/kite.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

// Debug: Check if API key is loaded
console.log('Environment check:');
console.log('- PERPLEXITY_API_KEY loaded:', process.env.PERPLEXITY_API_KEY ? `Yes (${process.env.PERPLEXITY_API_KEY.substring(0, 10)}...)` : 'NO - NOT FOUND');
console.log('- PORT:', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/kite', kiteRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Portfolio Insights API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize MCP servers and start the server
async function startServer() {
  try {
    console.log('Initializing MCP servers...');
    await mcpManager.initializeServers();

    app.listen(PORT, () => {
      console.log(`Portfolio Insights API running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    // Start the scheduler service
    await schedulerService.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  schedulerService.stop();
  await mcpManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  schedulerService.stop();
  await mcpManager.close();
  process.exit(0);
});

startServer();
