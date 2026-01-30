import { generatePost } from './src/core/generator.js';
import 'dotenv/config';
import chalk from 'chalk';

const testCases = [
  {
    name: 'SHORT: 72 chars (should stay ~150-280 chars)',
    thought: 'JavaScript promises are just fancy callbacks with better error handling.',
    inputLen: 72
  },
  {
    name: 'BORDERLINE: 198 chars (should be 2-3 tweets max)',
    thought: 'Spent 3 hours debugging a CSS issue. Turned out margin-top was collapsing with the parent. Added overflow:hidden to the container. Fixed. This is why I have trust issues with CSS. Margins are a lie.',
    inputLen: 198
  }
];

async function testCase(tc) {
  console.log(chalk.bold.cyan('\n' + '='.repeat(70)));
  console.log(chalk.bold.cyan(tc.name));
  console.log(chalk.gray(`Input: ${tc.inputLen} chars`));
  console.log(chalk.bold.cyan('='.repeat(70)));
  
  const result = await generatePost(tc.thought, { platforms: ['twitter'] });
  const twitter = result.twitter;
  
  const outputChars = twitter.isThread 
    ? twitter.content.reduce((sum, t) => sum + t.length, 0)
    : twitter.content.length;
  
  const expansion = (outputChars / tc.inputLen).toFixed(1);
  
  console.log(chalk.yellow('\n📊 RESULTS:'));
  console.log(`Input:  ${tc.inputLen} chars`);
  console.log(`Output: ${outputChars} chars`);
  console.log(`Expansion: ${expansion}x`);
  console.log(`Format: ${twitter.isThread ? `Thread (${twitter.content.length} tweets)` : 'Single tweet'}`);
  
  if (twitter.isThread) {
    console.log(chalk.gray('\nTweets:'));
    twitter.content.forEach((t, i) => {
      console.log(chalk.gray(`  ${i+1}. [${t.length} chars] ${t.substring(0, 60)}...`));
    });
  } else {
    console.log(chalk.gray(`\nContent: ${twitter.content.substring(0, 100)}...`));
  }
  
  // Verdict
  let verdict = '';
  if (tc.inputLen < 150) {
    // Should be single tweet, max 2x expansion
    if (!twitter.isThread && expansion <= 3.0) {
      verdict = chalk.green('✅ GOOD - Stayed concise');
    } else if (twitter.isThread && twitter.content.length <= 2 && expansion <= 3.5) {
      verdict = chalk.yellow('⚠️  OK - Slight expansion but acceptable');
    } else {
      verdict = chalk.red('❌ BAD - Over-expanded');
    }
  } else if (tc.inputLen < 300) {
    // Should be 2-3 tweets, max 4x expansion
    if (twitter.isThread && twitter.content.length <= 3 && expansion <= 4.0) {
      verdict = chalk.green('✅ GOOD - Appropriate length');
    } else {
      verdict = chalk.red('❌ BAD - Over-expanded');
    }
  }
  
  console.log(chalk.bold(`\n${verdict}\n`));
}

console.log(chalk.bold.green('\n🧪 TESTING EXPANSION CONTROL\n'));

for (const tc of testCases) {
  await testCase(tc);
  await new Promise(r => setTimeout(r, 2000));
}

console.log(chalk.bold.green('\n✅ TESTS COMPLETE\n'));
