import Datastore from 'nedb-promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize NeDB databases
const dbPath = path.join(__dirname, '../../data');

export const db = {
  portfolios: Datastore.create({
    filename: path.join(dbPath, 'portfolios.db'),
    autoload: true,
    timestampData: true
  }),

  analysis: Datastore.create({
    filename: path.join(dbPath, 'analysis.db'),
    autoload: true,
    timestampData: true
  }),

  news: Datastore.create({
    filename: path.join(dbPath, 'news.db'),
    autoload: true,
    timestampData: true
  })
};

// Create indexes for better query performance
db.portfolios.ensureIndex({ fieldName: 'id', unique: true });
db.analysis.ensureIndex({ fieldName: 'portfolioId', unique: true });
db.news.ensureIndex({ fieldName: 'portfolioId', unique: true });

console.log('📊 NoSQL Database initialized (NeDB)');
console.log(`   - Portfolios: ${path.join(dbPath, 'portfolios.db')}`);
console.log(`   - Analysis: ${path.join(dbPath, 'analysis.db')}`);
console.log(`   - News: ${path.join(dbPath, 'news.db')}`);
