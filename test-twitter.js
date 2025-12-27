/**
 * Quick test script to verify Twitter API credentials
 */

import { publishToTwitter } from './src/adapters/publishers/twitter.js';

async function test() {
  try {
    console.log('Testing Twitter API...\n');

    const testTweet = 'Test tweet from Daily Voice CLI - testing API integration 🚀';

    console.log(`Posting: "${testTweet}"\n`);

    const result = await publishToTwitter(testTweet);

    console.log('✅ SUCCESS!');
    console.log('\nResult:', JSON.stringify(result, null, 2));
    console.log(`\n🐦 View tweet at: ${result.data.tweetUrl}`);
    console.log('\nYou can now delete this test tweet from Twitter.');

  } catch (error) {
    console.error('❌ FAILED!');
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

test();
