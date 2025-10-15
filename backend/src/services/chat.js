import axios from 'axios';
import { perplexityService } from './perplexity.js';
import { db } from '../db/database.js';

export class ChatService {
  constructor() {
    this.conversationHistory = new Map();
  }

  async chat(portfolioId, message, conversationId = null) {
    try {
      // Get portfolio data
      const portfolio = await db.portfolios.findOne({ id: portfolioId });
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Get portfolio analysis for context
      const analysis = await db.analysis.findOne({ portfolioId });

      // Build context about the portfolio
      const portfolioContext = this.buildPortfolioContext(portfolio, analysis);

      // Get or create conversation history
      const convId = conversationId || this.generateConversationId();
      const history = this.conversationHistory.get(convId) || [];

      // Create the prompt with portfolio context
      const systemPrompt = `You are a financial advisor assistant with access to the user's portfolio. Here's the portfolio context:

${portfolioContext}

Answer questions about this portfolio using current market data and financial insights. Be specific, accurate, and cite recent market trends when relevant. Use the portfolio data provided above to give personalized advice.`;

      // Build messages array with history
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...history,
        {
          role: 'user',
          content: message
        }
      ];

      // Call Perplexity API
      const apiKey = perplexityService.getApiKey();
      if (!apiKey) {
        throw new Error('PERPLEXITY_API_KEY is not configured');
      }

      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar',
          messages
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const assistantMessage = response.data.choices[0].message.content;

      // Update conversation history
      history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: assistantMessage }
      );

      // Keep only last 10 messages to prevent context from getting too large
      if (history.length > 10) {
        history.splice(0, history.length - 10);
      }

      this.conversationHistory.set(convId, history);

      return {
        conversationId: convId,
        message: assistantMessage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  }

  buildPortfolioContext(portfolio, analysis) {
    const holdings = portfolio.holdings || [];
    const metrics = analysis?.analysis?.metrics;

    let context = `Portfolio Name: ${portfolio.portfolioName}\n`;
    context += `Client ID: ${portfolio.clientId}\n`;
    context += `Currency: ${portfolio.currency}\n`;
    context += `As of Date: ${portfolio.asOfDate}\n\n`;

    if (metrics) {
      context += `Portfolio Metrics:\n`;
      context += `- Total Value: ${metrics.currency} ${metrics.totalValue.toLocaleString()}\n`;
      context += `- Total Cost: ${metrics.currency} ${metrics.totalCost.toLocaleString()}\n`;
      context += `- Total Gain/Loss: ${metrics.currency} ${metrics.totalGainLoss.toLocaleString()} (${metrics.totalGainLossPercent.toFixed(2)}%)\n`;
      context += `- Number of Holdings: ${metrics.holdingsCount}\n\n`;

      if (metrics.sectorAllocation && Object.keys(metrics.sectorAllocation).length > 0) {
        context += `Sector Allocation:\n`;
        Object.entries(metrics.sectorAllocation)
          .sort((a, b) => b[1] - a[1])
          .forEach(([sector, percentage]) => {
            context += `- ${sector}: ${percentage.toFixed(2)}%\n`;
          });
        context += '\n';
      }
    }

    context += `Holdings (${holdings.length} total):\n`;
    holdings.forEach(holding => {
      context += `- ${holding.ticker}: ${holding.quantity} shares`;
      if (holding.currentPrice) {
        context += ` @ ${portfolio.currency} ${holding.currentPrice.toFixed(2)}`;
      }
      if (holding.purchasePrice) {
        context += `, purchased @ ${portfolio.currency} ${holding.purchasePrice.toFixed(2)}`;
      }
      if (holding.gainLoss && holding.gainLossPercent) {
        const sign = holding.gainLoss >= 0 ? '+' : '';
        context += `, ${sign}${portfolio.currency} ${holding.gainLoss.toFixed(2)} (${sign}${holding.gainLossPercent.toFixed(2)}%)`;
      }
      if (holding.sector && holding.sector !== 'Unknown') {
        context += `, Sector: ${holding.sector}`;
      }
      if (holding.marketData?.analystRating) {
        context += `, Rating: ${holding.marketData.analystRating}`;
      }
      if (holding.marketData?.peRatio) {
        context += `, P/E: ${holding.marketData.peRatio.toFixed(2)}`;
      }
      context += '\n';
    });

    return context;
  }

  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearConversation(conversationId) {
    this.conversationHistory.delete(conversationId);
  }

  clearAllConversations() {
    this.conversationHistory.clear();
  }
}

export const chatService = new ChatService();
