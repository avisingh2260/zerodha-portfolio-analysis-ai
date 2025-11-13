import dotenv from 'dotenv';
import { kiteService } from './src/services/kiteService.js';

dotenv.config();

console.log('=== Environment Variables ===');
console.log('KITE_API_KEY:', process.env.KITE_API_KEY || 'NOT SET');
console.log('KITE_API_SECRET:', process.env.KITE_API_SECRET ? 'SET (hidden)' : 'NOT SET');
console.log('KITE_ACCESS_TOKEN:', process.env.KITE_ACCESS_TOKEN || 'NOT SET');

console.log('\n=== Kite Service Status ===');
const configured = await kiteService.isConfigured();
const storedToken = await kiteService.getStoredAccessToken();

console.log('Is Configured:', configured);
console.log('Stored Token:', storedToken || 'NOT SET');
console.log('Access Token in Service:', kiteService.accessToken || 'NOT SET');

if (!configured) {
  console.log('\n❌ Kite is NOT properly configured!');
  console.log('You need to authenticate via the OAuth flow.');
} else {
  console.log('\n✅ Kite is configured. Testing API call...');
  try {
    await kiteService.getPortfolio();
    console.log('✅ API call successful!');
  } catch (error) {
    console.log('❌ API call failed:', error.message);
  }
}

process.exit(0);
