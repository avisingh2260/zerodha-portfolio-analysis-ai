// In-memory portfolio storage (replace with database in production)
class PortfolioStore {
  constructor() {
    this.portfolios = new Map();
  }

  create(portfolio) {
    const id = this.generateId();
    const timestamp = new Date().toISOString();

    const newPortfolio = {
      id,
      ...portfolio,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.portfolios.set(id, newPortfolio);
    return newPortfolio;
  }

  get(id) {
    return this.portfolios.get(id);
  }

  getAll() {
    return Array.from(this.portfolios.values());
  }

  update(id, updates) {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) {
      return null;
    }

    const updatedPortfolio = {
      ...portfolio,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date().toISOString()
    };

    this.portfolios.set(id, updatedPortfolio);
    return updatedPortfolio;
  }

  delete(id) {
    return this.portfolios.delete(id);
  }

  generateId() {
    return `port_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const portfolioStore = new PortfolioStore();
