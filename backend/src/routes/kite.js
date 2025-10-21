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
router.get('/login-url', async (req, res) => {
  try {
    const { redirect_url } = req.query;

    if (!process.env.KITE_API_KEY) {
      return res.status(400).json({
        error: 'Kite API Key not configured. Please set KITE_API_KEY in .env'
      });
    }

    // Build login URL with redirect parameter
    let loginUrl = kiteService.getLoginUrl();
    if (redirect_url) {
      loginUrl += `&redirect_params=${encodeURIComponent(JSON.stringify({ redirect_url }))}`;
    }

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
// Kite redirects here with request_token as query param
router.get('/callback', async (req, res) => {
  try {
    const { request_token, status } = req.query;

    // Check if user denied access
    if (status === 'error' || !request_token) {
      const errorMsg = status === 'error' ? 'User denied access' : 'No request token provided';
      // Redirect to frontend with error
      return res.redirect(`http://localhost:3000?kite_auth=error&message=${encodeURIComponent(errorMsg)}`);
    }

    console.log('📥 Received Kite OAuth callback with request_token');

    // Exchange request token for access token
    const session = await kiteService.generateSession(request_token);

    console.log('✅ Kite session generated and saved to database');

    // Redirect to frontend with success
    res.redirect(`http://localhost:3000?kite_auth=success`);
  } catch (error) {
    console.error('❌ Error generating Kite session:', error);
    res.redirect(`http://localhost:3000?kite_auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

// Also support POST for manual testing
router.post('/callback', async (req, res) => {
  try {
    const { request_token } = req.body;

    if (!request_token) {
      return res.status(400).json({ error: 'request_token is required' });
    }

    const session = await kiteService.generateSession(request_token);

    res.json({
      success: true,
      message: 'Session generated successfully and saved to database',
      accessToken: session.access_token
    });
  } catch (error) {
    console.error('Error generating Kite session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import portfolio from Kite
router.post('/import', async (req, res) => {
  try {
    const isConfigured = await kiteService.isConfigured();
    if (!isConfigured) {
      return res.status(400).json({
        error: 'Kite Connect not configured. Please connect your Zerodha account first',
        needsAuth: true
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
router.get('/status', async (req, res) => {
  const configured = await kiteService.isConfigured();
  const hasStoredToken = !!(await kiteService.getStoredAccessToken());

  res.json({
    configured,
    hasApiKey: !!process.env.KITE_API_KEY,
    hasAccessToken: hasStoredToken || !!process.env.KITE_ACCESS_TOKEN,
    isAuthenticated: configured,
    message: configured
      ? 'Kite Connect is ready to use'
      : 'Please connect your Zerodha account'
  });
});

export default router;
