import { parseCSV } from './src/utils/csvParser.js';
import fs from 'fs';

const csvContent = fs.readFileSync('../examples/zerodha-portfolio-template.csv', 'utf-8');

console.log('CSV Content:');
console.log(csvContent);
console.log('\n=== Parsing CSV ===\n');

const result = parseCSV(csvContent);

if (result.success) {
  console.log('✅ CSV parsed successfully!');
  console.log('Format detected:', result.format);
  console.log('Holdings count:', result.holdings.length);
  console.log('\nFirst holding:');
  console.log(JSON.stringify(result.holdings[0], null, 2));
} else {
  console.log('❌ CSV parsing failed:');
  console.log(result.error);
}
