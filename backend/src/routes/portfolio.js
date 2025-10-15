import express from 'express';
import multer from 'multer';
import { db } from '../db/database.js';
import { parsePortfolioJSON } from '../utils/jsonParser.js';
import { schedulerService } from '../services/scheduler.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to generate ID
function generateId() {
  return `port_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Upload portfolio JSON
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let portfolioData;

    if (req.file) {
      // Handle file upload
      const fileContent = req.file.buffer.toString('utf-8');
      const parseResult = parsePortfolioJSON(fileContent);

      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error });
      }

      portfolioData = parseResult.data;
    } else if (req.body) {
      // Handle JSON body
      const validation = parsePortfolioJSON(JSON.stringify(req.body));

      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      portfolioData = validation.data;
    } else {
      return res.status(400).json({ error: 'No portfolio data provided' });
    }

    // Save portfolio to database
    const id = generateId();
    const savedPortfolio = {
      id,
      ...portfolioData
    };

    await db.portfolios.insert(savedPortfolio);

    // Trigger immediate analysis in background
    console.log(`📊 Portfolio ${id} uploaded. Scheduling analysis...`);
    schedulerService.refreshSinglePortfolio(id).catch(err => {
      console.error('Background analysis error:', err);
    });

    res.status(201).json({
      success: true,
      portfolio: savedPortfolio
    });
  } catch (error) {
    console.error('Error uploading portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all portfolios
router.get('/', async (req, res) => {
  try {
    const portfolios = await db.portfolios.find({});
    res.json({ success: true, portfolios });
  } catch (error) {
    console.error('Error getting portfolios:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get portfolio by ID
router.get('/:id', async (req, res) => {
  try {
    const portfolio = await db.portfolios.findOne({ id: req.params.id });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({ success: true, portfolio });
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete portfolio
router.delete('/:id', async (req, res) => {
  try {
    const numRemoved = await db.portfolios.remove({ id: req.params.id });

    if (numRemoved === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Also delete associated analysis and news
    await db.analysis.remove({ portfolioId: req.params.id });
    await db.news.remove({ portfolioId: req.params.id });

    res.json({ success: true, message: 'Portfolio deleted' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
