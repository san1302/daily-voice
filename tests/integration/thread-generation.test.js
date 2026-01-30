import { generatePost } from './src/core/generator.js';
import 'dotenv/config';

// Test thought (medium complexity - should be ~3-4 tweets)
const testThought = `I've been using Claude Code for a week now and it's genuinely replaced my workflow. 
Not the "AI writes all my code" hype - more like "AI handles the boring refactors while I focus on architecture".

The best part? It doesn't hallucinate file paths. Cursor does this constantly and it drives me insane. 
Claude Code just... works. Reads the actual files, makes precise edits, doesn't invent functions that don't exist.

Still not perfect - sometimes overthinks simple tasks. But 80% of the time, it's faster than doing it myself.`;

console.log('🧪 Testing thread generation...\n');
console.log('INPUT THOUGHT:');
console.log(testThought);
console.log('\n' + '='.repeat(70) + '\n');

try {
  const result = await generatePost(testThought, {
    platforms: ['twitter']
  });

  console.log('OUTPUT:');
  console.log(JSON.stringify(result.twitter, null, 2));
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  if (result.twitter.isThread && Array.isArray(result.twitter.content)) {
    console.log('📊 THREAD ANALYSIS:');
    console.log(`Total tweets: ${result.twitter.content.length}`);
    console.log(`Tweet count: ${result.twitter.metadata.tweetCount}\n`);
    
    result.twitter.content.forEach((tweet, i) => {
      const charCount = tweet.length;
      const flag = charCount < 100 ? '⚠️  TOO SHORT' : charCount > 280 ? '❌ TOO LONG' : '✅';
      console.log(`${i + 1}. [${charCount} chars] ${flag}`);
      console.log(`   "${tweet}"`);
      console.log();
    });
  } else {
    console.log('📝 SINGLE TWEET:');
    console.log(`Length: ${result.twitter.content.length} chars`);
    console.log(`Content: "${result.twitter.content}"`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
