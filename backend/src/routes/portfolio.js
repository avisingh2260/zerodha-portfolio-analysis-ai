import express from 'express';
import multer from 'multer';
import { db } from '../db/database.js';
import { parsePortfolioJSON } from '../utils/jsonParser.js';
import { parseCSV } from '../utils/csvParser.js';
import { schedulerService } from '../services/scheduler.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to generate ID
function generateId() {
  return `port_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Upload portfolio (JSON or CSV)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let portfolioData;
    let fileFormat = 'unknown';

    if (req.file) {
      // Handle file upload
      const fileContent = req.file.buffer.toString('utf-8');
      const fileName = req.file.originalname.toLowerCase();

      // Detect file type
      if (fileName.endsWith('.csv')) {
        // Parse CSV
        const parseResult = parseCSV(fileContent);

        if (!parseResult.success) {
          return res.status(400).json({ error: parseResult.error });
        }

        fileFormat = parseResult.format;

        // Build portfolio data from CSV
        portfolioData = {
          clientId: req.body.clientId || 'CSV_IMPORT',
          portfolioName: req.body.portfolioName || `Imported Portfolio - ${new Date().toLocaleDateString()}`,
          currency: req.body.currency || 'INR',
          asOfDate: new Date().toISOString().split('T')[0],
          holdings: parseResult.holdings,
          metadata: {
            source: 'csv_upload',
            format: parseResult.format,
            uploadedAt: new Date().toISOString()
          }
        };
      } else if (fileName.endsWith('.json')) {
        // Parse JSON
        const parseResult = parsePortfolioJSON(fileContent);

        if (!parseResult.success) {
          return res.status(400).json({ error: parseResult.error });
        }

        fileFormat = 'json';
        portfolioData = parseResult.data;
      } else {
        return res.status(400).json({
          error: 'Unsupported file format. Please upload .json or .csv file'
        });
      }
    } else if (req.body) {
      // Handle JSON body
      const validation = parsePortfolioJSON(JSON.stringify(req.body));

      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      fileFormat = 'json';
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
      portfolio: savedPortfolio,
      format: fileFormat,
      summary: {
        holdingsCount: portfolioData.holdings.length,
        totalValue: portfolioData.holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0),
        totalCost: portfolioData.holdings.reduce((sum, h) => sum + (h.costBasis || 0), 0)
      }
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

// Create portfolio manually (no file upload)
router.post('/create', async (req, res) => {
  try {
    const { clientId, portfolioName, currency, holdings } = req.body;

    // Validate required fields
    if (!clientId || !portfolioName || !holdings || !Array.isArray(holdings)) {
      return res.status(400).json({
        error: 'Missing required fields: clientId, portfolioName, and holdings array'
      });
    }

    if (holdings.length === 0) {
      return res.status(400).json({
        error: 'Holdings array cannot be empty'
      });
    }

    // Validate and process holdings
    const processedHoldings = holdings.map((holding, index) => {
      const { ticker, quantity, purchasePrice, currentPrice, purchaseDate } = holding;

      if (!ticker || !quantity || !purchasePrice) {
        throw new Error(`Holding ${index + 1}: Missing required fields (ticker, quantity, purchasePrice)`);
      }

      const qty = parseFloat(quantity);
      const pPrice = parseFloat(purchasePrice);
      const cPrice = parseFloat(currentPrice || purchasePrice);

      if (qty <= 0 || pPrice <= 0) {
        throw new Error(`Holding ${index + 1}: Invalid quantity or price`);
      }

      const costBasis = qty * pPrice;
      const currentValue = qty * cPrice;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return {
        ticker,
        quantity: qty,
        purchasePrice: pPrice,
        purchaseDate: purchaseDate || null,
        currentPrice: cPrice,
        currentValue,
        costBasis,
        gainLoss,
        gainLossPercent
      };
    });

    // Create portfolio
    const id = generateId();
    const portfolioData = {
      id,
      clientId,
      portfolioName,
      currency: currency || 'INR',
      asOfDate: new Date().toISOString().split('T')[0],
      holdings: processedHoldings,
      metadata: {
        source: 'manual_entry',
        createdAt: new Date().toISOString()
      }
    };

    await db.portfolios.insert(portfolioData);

    // Trigger analysis
    console.log(`📊 Portfolio ${id} created manually. Scheduling analysis...`);
    schedulerService.refreshSinglePortfolio(id).catch(err => {
      console.error('Background analysis error:', err);
    });

    res.status(201).json({
      success: true,
      portfolio: portfolioData,
      summary: {
        holdingsCount: processedHoldings.length,
        totalValue: processedHoldings.reduce((sum, h) => sum + h.currentValue, 0),
        totalCost: processedHoldings.reduce((sum, h) => sum + h.costBasis, 0)
      }
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
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
