import { mcpManager } from './mcpClient.js';

export class MorningstarService {
  async getSecurityData(ticker) {
    try {
      const datapoints = [
        'lastPrice',
        'marketCap',
        'starRating',
        'fairValueEstimate',
        'fairValueRatio',
        'economicMoat',
        'totalReturn1Year',
        'totalReturn3Year',
        'eps',
        'peRatio',
        'sector'
      ];

      const result = await mcpManager.callTool('morningstar', 'datapoint', {
        ticker,
        datapoints: datapoints.join(',')
      });

      return this.parseDatapointResult(result);
    } catch (error) {
      console.error(`Error fetching data for ${ticker}:`, error);
      throw error;
    }
  }

  async getResearchArticles(query) {
    try {
      const result = await mcpManager.callTool('morningstar', 'articles', {
        query
      });

      return this.parseArticlesResult(result);
    } catch (error) {
      console.error(`Error fetching articles for ${query}:`, error);
      throw error;
    }
  }

  parseDatapointResult(result) {
    // Parse the MCP result and extract datapoint values
    if (result.content && result.content.length > 0) {
      const content = result.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
    }
    return null;
  }

  parseArticlesResult(result) {
    // Parse the MCP result and extract articles
    if (result.content && result.content.length > 0) {
      const content = result.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
    }
    return null;
  }

  async getBatchSecurityData(tickers) {
    const promises = tickers.map(ticker =>
      this.getSecurityData(ticker).catch(error => ({
        ticker,
        error: error.message
      }))
    );

    return Promise.all(promises);
  }
}

export const morningstarService = new MorningstarService();
