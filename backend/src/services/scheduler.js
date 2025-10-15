import cron from 'node-cron';
import { db } from '../db/database.js';
import { portfolioAnalyzer } from './portfolioAnalyzer.js';
import { perplexityService } from './perplexity.js';

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  async start() {
    console.log('🕐 Starting scheduler service...');

    // Run analysis every 30 minutes for all portfolios
    const analysisJob = cron.schedule('*/30 * * * *', async () => {
      console.log('\n⏰ Running scheduled analysis refresh...');
      await this.refreshAllAnalysis();
    });

    // Run news update every 15 minutes
    const newsJob = cron.schedule('*/15 * * * *', async () => {
      console.log('\n📰 Running scheduled news refresh...');
      await this.refreshAllNews();
    });

    this.jobs.set('analysis', analysisJob);
    this.jobs.set('news', newsJob);

    console.log('✅ Scheduler started successfully');
    console.log('   - Analysis refresh: Every 30 minutes');
    console.log('   - News refresh: Every 15 minutes');

    // Run initial refresh for all portfolios
    setTimeout(() => {
      console.log('\n🚀 Running initial data refresh...');
      this.refreshAllAnalysis();
      this.refreshAllNews();
    }, 5000); // Wait 5 seconds after startup
  }

  async refreshAllAnalysis() {
    try {
      const portfolios = await db.portfolios.find({});
      console.log(`📊 Refreshing analysis for ${portfolios.length} portfolios...`);

      for (const portfolio of portfolios) {
        try {
          console.log(`   Analyzing ${portfolio.portfolioName} (${portfolio.id})...`);

          const analysis = await portfolioAnalyzer.analyzePortfolio(portfolio);

          await db.analysis.update(
            { portfolioId: portfolio.id },
            {
              portfolioId: portfolio.id,
              analysis,
              lastUpdated: new Date().toISOString(),
              status: 'completed'
            },
            { upsert: true }
          );

          console.log(`   ✓ Analysis completed for ${portfolio.id}`);
        } catch (error) {
          console.error(`   ✗ Error analyzing ${portfolio.id}:`, error.message);

          await db.analysis.update(
            { portfolioId: portfolio.id },
            {
              portfolioId: portfolio.id,
              lastUpdated: new Date().toISOString(),
              status: 'error',
              error: error.message
            },
            { upsert: true }
          );
        }
      }

      console.log('✅ Analysis refresh completed');
    } catch (error) {
      console.error('❌ Error in scheduled analysis:', error);
    }
  }

  async refreshAllNews() {
    try {
      const portfolios = await db.portfolios.find({});
      console.log(`📰 Refreshing news for ${portfolios.length} portfolios...`);

      for (const portfolio of portfolios) {
        try {
          console.log(`   Fetching news for ${portfolio.portfolioName} (${portfolio.id})...`);

          const tickers = [...new Set(portfolio.holdings.map(h => h.ticker))];
          const news = await perplexityService.getPortfolioNews(tickers);

          await db.news.update(
            { portfolioId: portfolio.id },
            {
              portfolioId: portfolio.id,
              news,
              lastUpdated: new Date().toISOString()
            },
            { upsert: true }
          );

          console.log(`   ✓ News updated for ${portfolio.id}`);
        } catch (error) {
          console.error(`   ✗ Error fetching news for ${portfolio.id}:`, error.message);
        }
      }

      console.log('✅ News refresh completed');
    } catch (error) {
      console.error('❌ Error in scheduled news refresh:', error);
    }
  }

  async refreshSinglePortfolio(portfolioId) {
    console.log(`🔄 Manually refreshing portfolio ${portfolioId}...`);

    const portfolio = await db.portfolios.findOne({ id: portfolioId });
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Refresh analysis
    const analysis = await portfolioAnalyzer.analyzePortfolio(portfolio);
    await db.analysis.update(
      { portfolioId },
      {
        portfolioId,
        analysis,
        lastUpdated: new Date().toISOString(),
        status: 'completed'
      },
      { upsert: true }
    );

    // Refresh news
    const tickers = [...new Set(portfolio.holdings.map(h => h.ticker))];
    const news = await perplexityService.getPortfolioNews(tickers);
    await db.news.update(
      { portfolioId },
      {
        portfolioId,
        news,
        lastUpdated: new Date().toISOString()
      },
      { upsert: true }
    );

    console.log(`✅ Portfolio ${portfolioId} refreshed`);
  }

  stop() {
    console.log('🛑 Stopping scheduler...');
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`   Stopped ${name} job`);
    }
    this.jobs.clear();
  }
}

export const schedulerService = new SchedulerService();
