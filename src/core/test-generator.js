/**
 * test-generator.js - Test the AI post generator
 *
 * Tests:
 * 1. Basic generation for both platforms
 * 2. Human feel validation
 * 3. Platform-specific differences
 */

import 'dotenv/config';
import { generatePost, refinePost, quickRefine } from './generator.js';
import chalk from 'chalk';

console.log(chalk.bold.blue('\n🧪 Testing AI Post Generator\n'));

// Test thought
const thought = "React Server Components are overhyped. They only make sense for content-heavy sites.";

console.log(chalk.yellow('Test thought:'));
console.log(`"${thought}"\n`);

try {
  console.log(chalk.cyan('⏳ Generating posts for Twitter and LinkedIn...\n'));

  const results = await generatePost(thought, {
    platforms: ['twitter', 'linkedin']
  });

  // Display Twitter result
  if (results.twitter) {
    console.log(chalk.bold.green('✅ TWITTER POST:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(results.twitter.content);
    console.log(chalk.gray('─'.repeat(60)));

    // Validation
    const twitterVal = results.twitter.validation;
    console.log(chalk.blue(`\nValidation Score: ${twitterVal.score}/100`));
    console.log(chalk.blue(`Passes: ${twitterVal.passes ? '✅' : '❌'}`));
    console.log(chalk.blue(`Feedback: ${twitterVal.feedback.join(', ')}`));
    console.log();
  }

  // Display LinkedIn result
  if (results.linkedin) {
    console.log(chalk.bold.green('✅ LINKEDIN POST:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(results.linkedin.content);
    console.log(chalk.gray('─'.repeat(60)));

    // Validation
    const linkedinVal = results.linkedin.validation;
    console.log(chalk.blue(`\nValidation Score: ${linkedinVal.score}/100`));
    console.log(chalk.blue(`Passes: ${linkedinVal.passes ? '✅' : '❌'}`));
    console.log(chalk.blue(`Feedback: ${linkedinVal.feedback.join(', ')}`));
    console.log();
  }

  // Test refinement
  if (results.twitter && results.twitter.content) {
    console.log(chalk.cyan('\n⏳ Testing refinement: "make it shorter"...\n'));

    const refined = await quickRefine(results.twitter.content, 'shorter', 'twitter');

    console.log(chalk.bold.magenta('✨ REFINED TWITTER POST (SHORTER):'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(refined.content);
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.blue(`\nValidation Score: ${refined.validation.score}/100`));
    console.log();
  }

  // Success summary
  console.log(chalk.bold.green('🎉 Test completed successfully!\n'));

  console.log(chalk.yellow('Summary:'));
  console.log(`✅ Twitter post generated: ${results.twitter ? 'YES' : 'NO'}`);
  console.log(`✅ LinkedIn post generated: ${results.linkedin ? 'YES' : 'NO'}`);
  console.log(`✅ Posts feel human: ${results.twitter?.validation.passes && results.linkedin?.validation.passes ? 'YES' : 'CHECK FEEDBACK'}`);
  console.log(`✅ Refinement works: YES\n`);

} catch (error) {
  console.error(chalk.bold.red('❌ Test failed:'), error.message);

  if (error.message.includes('ANTHROPIC_API_KEY')) {
    console.log(chalk.yellow('\n💡 Tip: Add your Anthropic API key to .env file'));
    console.log(chalk.yellow('   Get it from: https://console.anthropic.com/\n'));
  }

  process.exit(1);
}
