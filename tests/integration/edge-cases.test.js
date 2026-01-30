import { generatePost } from './src/core/generator.js';
import 'dotenv/config';
import chalk from 'chalk';

const testCases = [
  {
    name: 'EDGE CASE 1: Very Short (should be single tweet)',
    thought: 'JavaScript promises are just fancy callbacks with better error handling.',
    expected: 'single tweet'
  },
  {
    name: 'EDGE CASE 2: Borderline (200-280 chars)',
    thought: 'Spent 3 hours debugging a CSS issue. Turned out margin-top was collapsing with the parent. Added overflow:hidden to the container. Fixed. This is why I have trust issues with CSS. Margins are a lie.',
    expected: 'single tweet or very short thread'
  },
  {
    name: 'EDGE CASE 3: Very Long (should be proper thread)',
    thought: `I've been thinking about why most startups fail at developer tools. It's not the tech. The tech is usually fine. It's that they build for the developer they imagine, not the developer that exists.

The imagined developer: reads docs, follows best practices, uses the CLI, loves configuration files.

The real developer: copies from Stack Overflow, ships on Friday afternoon, has 47 browser tabs open, debugs with console.log.

Build for the real one. Make it work out of the box. Make errors obvious. Make the happy path delightful. Everything else is optional.`,
    expected: 'multi-tweet thread (6-8 tweets)'
  },
  {
    name: 'EDGE CASE 4: Code Snippet',
    thought: `Found a neat pattern for error handling in async functions:

const result = await fetch(url).catch(err => ({ error: err }));
if (result.error) return handleError(result.error);

No try/catch blocks. No nested error handling. Just clean, readable code.`,
    expected: 'thread with code formatting'
  },
  {
    name: 'EDGE CASE 5: Quotes and Special Chars',
    thought: `Someone asked me: "What's the difference between a senior and junior dev?"

Junior: "It doesn't work and I don't know why."
Senior: "It works and I don't know why."

Both are debugging. One just has better jokes about it.`,
    expected: 'thread with nested quotes'
  }
];

async function runTest(testCase, index) {
  console.log(chalk.bold.cyan(`\n${'='.repeat(70)}`));
  console.log(chalk.bold.cyan(`TEST ${index + 1}/${testCases.length}: ${testCase.name}`));
  console.log(chalk.gray(`Expected: ${testCase.expected}`));
  console.log(chalk.bold.cyan('='.repeat(70)));
  
  console.log(chalk.yellow('\n📝 INPUT:'));
  console.log(chalk.gray(testCase.thought.substring(0, 200) + (testCase.thought.length > 200 ? '...' : '')));
  console.log(chalk.gray(`[${testCase.thought.length} chars total]`));
  
  try {
    const result = await generatePost(testCase.thought, {
      platforms: ['twitter']
    });
    
    const twitter = result.twitter;
    
    console.log(chalk.green('\n✅ RESULT:'));
    
    if (twitter.isThread) {
      console.log(chalk.blue(`🧵 THREAD - ${twitter.content.length} tweets`));
      
      twitter.content.forEach((tweet, i) => {
        const len = tweet.length;
        const status = len > 280 ? '❌ TOO LONG' : len < 100 && i < twitter.content.length - 1 ? '⚠️  SHORT' : '✅';
        console.log(chalk.gray(`\n  ${i + 1}. [${len} chars] ${status}`));
        console.log(chalk.white(`     ${tweet.substring(0, 80)}${tweet.length > 80 ? '...' : ''}`));
      });
    } else {
      console.log(chalk.blue(`📝 SINGLE TWEET`));
      console.log(chalk.gray(`   [${twitter.content.length} chars]`));
      console.log(chalk.white(`   ${twitter.content.substring(0, 100)}${twitter.content.length > 100 ? '...' : ''}`));
    }
    
    // Analysis
    console.log(chalk.yellow('\n📊 VALIDATION:'));
    console.log(`   Human Score: ${twitter.validation.score}/100 ${twitter.validation.passes ? '✅' : '⚠️'}`);
    
    if (twitter.metadata.optimization) {
      const opt = twitter.metadata.optimization;
      if (opt.modifications && opt.modifications.length > 0) {
        console.log(chalk.yellow('\n🔧 OPTIMIZATIONS:'));
        console.log(`   Applied: ${opt.modifications.join(', ')}`);
        if (opt.originalTweetCount !== opt.tweetCount) {
          console.log(`   Count: ${opt.originalTweetCount} → ${opt.tweetCount}`);
        }
      }
    }
    
    // Verdict
    const totalChars = twitter.isThread 
      ? twitter.content.reduce((sum, t) => sum + t.length, 0)
      : twitter.content.length;
    
    const avgChars = twitter.isThread
      ? Math.round(totalChars / twitter.content.length)
      : totalChars;
    
    console.log(chalk.yellow('\n📈 STATS:'));
    console.log(`   Total chars: ${totalChars}`);
    console.log(`   Avg per tweet: ${avgChars}`);
    console.log(`   Format: ${twitter.isThread ? 'Thread' : 'Single tweet'}`);
    
    const maxLen = twitter.isThread 
      ? Math.max(...twitter.content.map(t => t.length))
      : twitter.content.length;
    
    const minLen = twitter.isThread
      ? Math.min(...twitter.content.map(t => t.length))
      : twitter.content.length;
    
    if (maxLen > 280) {
      console.log(chalk.red('\n   ⚠️  WARNING: Tweet exceeds 280 chars!'));
    }
    
    if (twitter.isThread && minLen < 100 && twitter.content.length > 1) {
      console.log(chalk.yellow('\n   ⚠️  NOTE: Some tweets are quite short'));
    }
    
    return { success: true, testCase, result: twitter };
    
  } catch (error) {
    console.log(chalk.red('\n❌ ERROR:'));
    console.log(chalk.red(`   ${error.message}`));
    return { success: false, testCase, error };
  }
}

async function runAllTests() {
  console.log(chalk.bold.green('\n🧪 RUNNING EDGE CASE TESTS\n'));
  
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const result = await runTest(testCases[i], i);
    results.push(result);
    
    // Small delay between tests to avoid rate limits
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log(chalk.bold.cyan(`\n${'='.repeat(70)}`));
  console.log(chalk.bold.green('📋 TEST SUMMARY'));
  console.log(chalk.bold.cyan('='.repeat(70)));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(chalk.green(`✅ Passed: ${passed}/${testCases.length}`));
  if (failed > 0) {
    console.log(chalk.red(`❌ Failed: ${failed}/${testCases.length}`));
  }
  
  console.log();
}

runAllTests().catch(console.error);
