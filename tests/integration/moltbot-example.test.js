import { generatePost } from './src/core/generator.js';
import 'dotenv/config';
import chalk from 'chalk';

const thought = `Been trying MoltBot for content automation. The promise is good - AI-powered social posting. But the execution feels half-baked. 

The posts it generates read like they were written by someone who learned English from LinkedIn inspirational quotes. Too polished, zero personality.

I wanted a tool that amplifies my voice, not replaces it with corporate speak. Maybe it works for brand accounts that don't care about authenticity. For personal stuff? Hard pass.`;

console.log(chalk.cyan('📝 INPUT TO DAILY-VOICE:'));
console.log(chalk.gray('─'.repeat(70)));
console.log(thought);
console.log(chalk.gray('─'.repeat(70)));
console.log();

console.log(chalk.yellow('⚙️  Generating Twitter thread...\n'));

try {
  const result = await generatePost(thought, {
    platforms: ['twitter']
  });

  console.log(chalk.green('✅ GENERATION COMPLETE\n'));
  console.log(chalk.gray('═'.repeat(70)));
  
  if (result.twitter.isThread) {
    console.log(chalk.bold.blue(`🧵 TWITTER THREAD (${result.twitter.content.length} tweets)`));
    console.log(chalk.gray('─'.repeat(70)));
    
    result.twitter.content.forEach((tweet, i) => {
      const charCount = tweet.length;
      const statusColor = charCount > 280 ? 'red' : charCount < 100 ? 'yellow' : 'green';
      
      console.log(chalk[statusColor](`\n${i + 1}. [${charCount} chars]`));
      console.log(chalk.white(tweet));
    });
  } else {
    console.log(chalk.bold.blue('📝 SINGLE TWEET'));
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.white(result.twitter.content));
    console.log(chalk.gray(`\n[${result.twitter.content.length} chars]`));
  }
  
  console.log(chalk.gray('\n' + '─'.repeat(70)));
  console.log(chalk.bold('\n📊 ANALYSIS:'));
  console.log(`  Human Score: ${result.twitter.validation.score}/100`);
  console.log(`  Passes: ${result.twitter.validation.passes ? '✅' : '❌'}`);
  if (result.twitter.validation.feedback.length > 0) {
    console.log(`  Feedback: ${result.twitter.validation.feedback.join(', ')}`);
  }
  
  if (result.twitter.metadata.optimization) {
    console.log(chalk.bold('\n🔧 OPTIMIZATIONS APPLIED:'));
    const opt = result.twitter.metadata.optimization;
    console.log(`  Original format: ${opt.originalFormat}`);
    if (opt.modifications && opt.modifications.length > 0) {
      console.log(`  Fixes: ${opt.modifications.join(', ')}`);
    }
    if (opt.originalTweetCount !== opt.tweetCount) {
      console.log(`  Tweet count: ${opt.originalTweetCount} → ${opt.tweetCount}`);
    }
  }
  
  console.log(chalk.gray('\n' + '═'.repeat(70)));
  
} catch (error) {
  console.error(chalk.red('\n❌ Error:'), error.message);
  process.exit(1);
}
