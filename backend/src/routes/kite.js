import express from 'express';
import { kiteService } from '../services/kiteService.js';
import { db } from '../db/database.js';
import { schedulerService } from '../services/scheduler.js';

const router = express.Router();

// Helper to generate ID
function generateId() {
  return `port_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get Kite login URL
router.get('/login-url', (req, res) => {
  try {
    if (!kiteService.isConfigured()) {
      return res.status(400).json({
        error: 'Kite API Key not configured. Please set KITE_API_KEY in .env'
      });
    }

    const loginUrl = kiteService.getLoginUrl();
    res.json({
      success: true,
      loginUrl,
      message: 'Redirect user to this URL to authorize access'
    });
  } catch (error) {
    console.error('Error getting Kite login URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle OAuth callback and generate session
router.post('/callback', async (req, res) => {
  try {
    const { request_token } = req.body;

    if (!request_token) {
      return res.status(400).json({ error: 'request_token is required' });
    }

    const session = await kiteService.generateSession(request_token);

    res.json({
      success: true,
      message: 'Session generated successfully',
      accessToken: session.access_token,
      note: 'Save this access token in .env as KITE_ACCESS_TOKEN'
    });
  } catch (error) {
    console.error('Error generating Kite session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import portfolio from Kite
router.post('/import', async (req, res) => {
  try {
    if (!kiteService.isConfigured()) {
      return res.status(400).json({
        error: 'Kite Connect not configured. Please set KITE_API_KEY and KITE_ACCESS_TOKEN in .env',
        instructions: [
          '1. Get API credentials from https://developers.kite.trade/',
          '2. Add KITE_API_KEY, KITE_API_SECRET, and KITE_ACCESS_TOKEN to .env',
          '3. Restart the backend server',
          '4. If you don\'t have an access token, use GET /api/kite/login-url to start OAuth flow'
        ]
      });
    }

    console.log('📥 Importing portfolio from Zerodha Kite...');

    // Fetch portfolio from Kite
    const kiteData = await kiteService.getPortfolio();

    if (!kiteData.holdings || kiteData.holdings.length === 0) {
      return res.status(404).json({
        error: 'No holdings found in your Zerodha account',
        positions: kiteData.positions
      });
    }

    // Transform to our portfolio format
    const portfolioData = kiteService.transformToPortfolioFormat(kiteData);

    // Save to database
    const id = generateId();
    const savedPortfolio = {
      id,
      ...portfolioData
    };

    await db.portfolios.insert(savedPortfolio);

    // Trigger immediate analysis in background
    console.log(`📊 Portfolio ${id} imported from Kite. Scheduling analysis...`);
    schedulerService.refreshSinglePortfolio(id).catch(err => {
      console.error('Background analysis error:', err);
    });

    res.status(201).json({
      success: true,
      portfolio: savedPortfolio,
      summary: {
        holdingsCount: portfolioData.holdings.length,
        totalValue: portfolioData.holdings.reduce((sum, h) => sum + h.currentValue, 0),
        totalCost: portfolioData.holdings.reduce((sum, h) => sum + h.costBasis, 0),
        currency: portfolioData.currency
      },
      message: 'Portfolio imported successfully from Zerodha Kite'
    });
  } catch (error) {
    console.error('Error importing from Kite:', error);

    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.message.includes('403')) {
      errorMessage = 'Access token is invalid or expired. Please generate a new session using /api/kite/callback';
    } else if (error.message.includes('401')) {
      errorMessage = 'Invalid API credentials. Please check KITE_API_KEY and KITE_ACCESS_TOKEN in .env';
    }

    res.status(500).json({ error: errorMessage });
  }
});

// Get current Kite configuration status
router.get('/status', (req, res) => {
  const configured = kiteService.isConfigured();

  res.json({
    configured,
    hasApiKey: !!process.env.KITE_API_KEY,
    hasAccessToken: !!process.env.KITE_ACCESS_TOKEN,
    message: configured
      ? 'Kite Connect is ready to use'
      : 'Kite Connect needs configuration. Set KITE_API_KEY and KITE_ACCESS_TOKEN in .env'
  });
});

export default router;
