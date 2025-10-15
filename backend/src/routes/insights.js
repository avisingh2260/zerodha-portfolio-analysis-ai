import express from 'express';
import { db } from '../db/database.js';
import { schedulerService } from '../services/scheduler.js';
import { perplexityService } from '../services/perplexity.js';

const router = express.Router();

// Get portfolio analysis from database
router.get('/portfolio/:id', async (req, res) => {
  try {
    const portfolio = await db.portfolios.findOne({ id: req.params.id });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Get cached analysis from database
    const cached = await db.analysis.findOne({ portfolioId: req.params.id });

    if (!cached || cached.status === 'error') {
      // No cached data or error, trigger refresh and return message
      if (!cached) {
        console.log(`📊 No cached analysis for ${req.params.id}, starting analysis...`);
        schedulerService.refreshSinglePortfolio(req.params.id).catch(err => {
          console.error('Background analysis error:', err);
        });
      }

      return res.json({
        success: true,
        status: 'processing',
        message: 'Analysis is being processed. Please refresh in a moment.',
        lastUpdated: cached?.lastUpdated || null,
        error: cached?.error || null
      });
    }

    res.json({
      success: true,
      status: 'completed',
      analysis: cached.analysis,
      lastUpdated: cached.lastUpdated
    });
  } catch (error) {
    console.error('Error getting portfolio analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get security data for a specific ticker
router.get('/security/:ticker', async (req, res) => {
  try {
    const data = await perplexityService.getSecurityData(req.params.ticker);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching security data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get research articles
router.post('/research', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const articles = await perplexityService.getResearchArticles(query);

    res.json({
      success: true,
      articles
    });
  } catch (error) {
    console.error('Error fetching research:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get news for portfolio from database
router.get('/news/:id', async (req, res) => {
  try {
    const portfolio = await db.portfolios.findOne({ id: req.params.id });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Get cached news from database
    const cached = await db.news.findOne({ portfolioId: req.params.id });

    if (!cached) {
      // No cached news, trigger refresh
      console.log(`📰 No cached news for ${req.params.id}, fetching...`);

      const tickers = [...new Set(portfolio.holdings.map(h => h.ticker))];
      const news = await perplexityService.getPortfolioNews(tickers);

      await db.news.insert({
        portfolioId: req.params.id,
        news,
        lastUpdated: new Date().toISOString()
      });

      return res.json({
        success: true,
        news,
        lastUpdated: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      news: cached.news,
      lastUpdated: cached.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching portfolio news:', error);
    res.status(500).json({ error: error.message });
  }
});

// Force refresh portfolio analysis (for testing)
router.post('/portfolio/:id/refresh', async (req, res) => {
  try {
    const portfolio = await db.portfolios.findOne({ id: req.params.id });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    console.log(`🔄 Force refreshing portfolio ${req.params.id}...`);

    // Delete cached analysis
    await db.analysis.remove({ portfolioId: req.params.id }, {});

    // Trigger refresh
    await schedulerService.refreshSinglePortfolio(req.params.id);

    res.json({
      success: true,
      message: 'Portfolio analysis refreshed'
    });
  } catch (error) {
    console.error('Error refreshing portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
