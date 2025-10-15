import axios from 'axios';

export class PerplexityService {
  constructor() {
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
  }

  getApiKey() {
    // Read API key lazily to ensure it's loaded after dotenv.config()
    return process.env.PERPLEXITY_API_KEY;
  }

  async query(prompt) {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        throw new Error('PERPLEXITY_API_KEY is not configured in environment variables');
      }

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a financial data assistant. Provide accurate, up-to-date financial information in a structured format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Perplexity API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSecurityData(ticker) {
    try {
      // Query Perplexity for comprehensive stock data with structured format
      const query = `What is the current market data for ${ticker}? Please provide:
1. Current stock price (in USD)
2. Market capitalization (specify trillion, billion, or million)
3. P/E ratio
4. EPS (Earnings Per Share)
5. 52-week high price
6. 52-week low price
7. Sector/Industry
8. Dividend yield (%)
9. Analyst rating

Provide specific numerical values for each field. Be concise.`;

      const result = await this.query(query);
      console.log(`\n=== ${ticker} RESPONSE ===`);
      console.log(result.substring(0, 500) + '...');
      console.log('=== END ===');

      return this.extractFinancialData(result, ticker);
    } catch (error) {
      console.error(`Error fetching data for ${ticker}:`, error);
      throw error;
    }
  }

  async getMarketAnalysis(tickers) {
    try {
      const tickerList = tickers.join(', ');
      const query = `For each of these stocks: ${tickerList}, provide the following current market data:
- Current stock price (in USD)
- Market capitalization
- P/E ratio
- EPS (earnings per share)
- 52-week high price
- 52-week low price
- Sector/industry
- Dividend yield (if applicable)
- Current analyst rating (buy/hold/sell)

Be specific with numerical values. Provide data for each ticker separately.`;

      const result = await this.query(query);
      console.log('\n=== PERPLEXITY RESPONSE ===');
      console.log(result);
      console.log('=== END RESPONSE ===\n');

      return {
        rawResponse: result,
        analysis: result
      };
    } catch (error) {
      console.error(`Error fetching market analysis:`, error);
      throw error;
    }
  }

  async getResearchArticles(query) {
    try {
      const searchQuery = `${query} stock market analysis investment research latest news`;
      const result = await this.query(searchQuery);

      return {
        summary: result,
        sources: []
      };
    } catch (error) {
      console.error(`Error fetching articles for ${query}:`, error);
      throw error;
    }
  }

  async getPortfolioNews(tickers) {
    try {
      // Query all tickers
      const tickerList = tickers.join(', ');

      const query = `Provide a brief news summary for each of these stocks: ${tickerList}
For each stock, provide in 1-2 sentences:
- Latest headline or development (last 7 days)
- Current sentiment (bullish/bearish/neutral) based on recent news

Format: Ticker: Brief news summary. Sentiment: [bullish/bearish/neutral]`;

      console.log(`Fetching portfolio news for ${tickers.length} stocks: ${tickerList}...`);
      const result = await this.query(query);

      return this.parsePortfolioNews(result, tickers);
    } catch (error) {
      console.error('Error fetching portfolio news:', error);
      throw error;
    }
  }

  parsePortfolioNews(text, tickers) {
    const newsItems = [];

    // Split by lines and paragraphs, more flexible pattern for Indian tickers
    const lines = text.split('\n');
    let currentTicker = null;
    let currentContent = [];

    for (const line of lines) {
      // Check if line contains a ticker (more flexible pattern for Indian stocks)
      let tickerFound = null;

      // Try exact ticker match first
      for (const ticker of tickers) {
        const tickerPattern = new RegExp(`\\b${ticker}\\b|\\*\\*${ticker}\\*\\*|^${ticker}:|\\d+\\.\\s*${ticker}`, 'i');
        if (tickerPattern.test(line)) {
          tickerFound = ticker;
          break;
        }
      }

      if (tickerFound) {
        // Save previous ticker's content
        if (currentTicker && currentContent.length > 0) {
          const content = currentContent.join(' ').trim();
          newsItems.push({
            ticker: currentTicker,
            content: content,
            sentiment: this.extractSentimentFromText(content),
            timestamp: new Date().toISOString()
          });
        }

        // Start new ticker section
        currentTicker = tickerFound;
        currentContent = [line.replace(/^\d+\.\s*|\*\*/g, '').trim()];
      } else if (currentTicker && line.trim()) {
        // Accumulate content for current ticker
        currentContent.push(line.trim());
      }
    }

    // Add the last ticker's content
    if (currentTicker && currentContent.length > 0) {
      const content = currentContent.join(' ').trim();
      newsItems.push({
        ticker: currentTicker,
        content: content,
        sentiment: this.extractSentimentFromText(content),
        timestamp: new Date().toISOString()
      });
    }

    // If we couldn't parse by ticker, split into chunks
    if (newsItems.length === 0) {
      const chunks = text.split(/\n\n+/);
      for (const chunk of chunks) {
        if (chunk.trim()) {
          newsItems.push({
            ticker: 'MARKET',
            content: chunk.trim(),
            sentiment: this.extractSentimentFromText(chunk),
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return newsItems;
  }

  extractSentimentFromText(text) {
    const lowerText = text.toLowerCase();

    // Bullish indicators
    const bullishWords = ['bullish', 'positive', 'surge', 'gain', 'rally', 'up', 'increase', 'growth', 'strong', 'buy', 'outperform'];
    const bearishWords = ['bearish', 'negative', 'decline', 'fall', 'drop', 'down', 'decrease', 'weak', 'sell', 'underperform'];

    let bullishScore = 0;
    let bearishScore = 0;

    for (const word of bullishWords) {
      if (lowerText.includes(word)) bullishScore++;
    }

    for (const word of bearishWords) {
      if (lowerText.includes(word)) bearishScore++;
    }

    if (bullishScore > bearishScore) return 'bullish';
    if (bearishScore > bullishScore) return 'bearish';
    return 'neutral';
  }

  extractFinancialData(text, ticker) {
    // Extract financial data from Perplexity's natural language response
    console.log(`\nExtracting data for ${ticker}...`);

    const data = {
      ticker,
      lastPrice: this.extractNumber(text, ['Current Stock Price', 'current price', 'trading at', 'stock price', 'price']),
      marketCap: this.extractMarketCap(text),
      peRatio: this.extractNumber(text, ['P/E Ratio', 'PE Ratio', 'P/E ratio', 'PE ratio', 'price-to-earnings']),
      eps: this.extractNumber(text, ['EPS \\(Earnings Per Share\\)', 'EPS', 'earnings per share', 'Earnings Per Share']),
      sector: this.extractSector(text),
      dividendYield: this.extractNumber(text, ['Dividend Yield', 'dividend yield', 'dividend']),
      week52High: this.extractNumber(text, ['52-Week High', '52-week high', '52 week high']),
      week52Low: this.extractNumber(text, ['52-Week Low', '52-week low', '52 week low']),
      analystRating: this.extractRating(text),
      rawResponse: text
    };

    console.log(`Extracted: price=${data.lastPrice}, P/E=${data.peRatio}, EPS=${data.eps}, sector=${data.sector}`);
    return data;
  }

  extractNumber(text, keywords) {
    for (const keyword of keywords) {
      // Try multiple patterns, handling markdown bold ** and numbered lists
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patterns = [
        // **1. Keyword:** $123.45 format
        new RegExp(`\\*\\*\\d+\\.?\\s*${escapedKeyword}\\*\\*[:\\s]+\\$?([0-9,]+\\.?[0-9]*)`, 'i'),
        // **Keyword:** $123.45 format
        new RegExp(`\\*\\*${escapedKeyword}\\*\\*[:\\s]+\\$?([0-9,]+\\.?[0-9]*)`, 'i'),
        // 1. **Keyword**: $123.45 format
        new RegExp(`\\d+\\.?\\s*\\*\\*${escapedKeyword}.*?\\*\\*[:\\s]+\\$?([0-9,]+\\.?[0-9]*)`, 'i'),
        // Simple Keyword: $123.45
        new RegExp(`${escapedKeyword}[:\\s]+\\$?([0-9,]+\\.?[0-9]*)`, 'i'),
        // Keyword is $123.45
        new RegExp(`${escapedKeyword}[:\\s]*is[:\\s]+\\$?([0-9,]+\\.?[0-9]*)`, 'i'),
        // $123.45 USD (looking for price with currency)
        new RegExp(`\\$([0-9,]+\\.?[0-9]*)\\s*USD`, 'i')
      ];

      for (const regex of patterns) {
        const match = text.match(regex);
        if (match && match[1]) {
          const value = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(value) && value > 0) {
            console.log(`  ✓ Extracted ${keyword}: ${value}`);
            return value;
          }
        }
      }
    }
    return null;
  }

  extractMarketCap(text) {
    const patterns = [
      /\*\*Market Capitalization\*\*[:\s]+\$?([0-9.]+)\s*(trillion|billion|million)/i,
      /market cap(?:italization)?[:\s]+\$?([0-9.]+)\s*(trillion|billion|million)/i,
      /\$([0-9.]+)\s*(trillion|billion|million).*market cap/i
    ];

    for (const regex of patterns) {
      const match = text.match(regex);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const multipliers = {
          trillion: 1e12,
          billion: 1e9,
          million: 1e6
        };
        const result = value * (multipliers[unit] || 1);
        console.log(`  ✓ Extracted Market Cap: $${value} ${unit} = ${result}`);
        return result;
      }
    }
    return null;
  }

  extractSector(text) {
    const sectors = [
      'Technology', 'Healthcare', 'Financial', 'Consumer', 'Industrial',
      'Energy', 'Materials', 'Real Estate', 'Utilities', 'Communication'
    ];

    for (const sector of sectors) {
      if (text.toLowerCase().includes(sector.toLowerCase())) {
        return sector;
      }
    }
    return 'Unknown';
  }

  extractRating(text) {
    const ratings = ['strong buy', 'buy', 'hold', 'sell', 'strong sell'];
    const lowerText = text.toLowerCase();

    for (const rating of ratings) {
      if (lowerText.includes(rating)) {
        return rating;
      }
    }
    return null;
  }

  async getBatchSecurityData(tickers) {
    // Query stocks individually for more reliable results
    // Perplexity works better with individual queries than batch
    console.log(`Querying ${tickers.length} securities individually from Perplexity...`);

    const results = [];

    for (const ticker of tickers) {
      try {
        console.log(`\nFetching data for ${ticker}...`);
        const data = await this.getSecurityData(ticker);
        results.push(data);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error fetching ${ticker}:`, error.message);
        results.push({
          ticker,
          error: error.message
        });
      }
    }

    console.log(`\nCompleted fetching data for ${results.length} securities`);
    return results;
  }
}

export const perplexityService = new PerplexityService();
