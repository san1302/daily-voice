import { optimizeThread } from './src/core/thread-optimizer.js';

// Simulate what Claude returns
const claudeResponse = `["I've been using Claude Code for a week. It's not the \\"AI writes all my code\\" hype everyone's selling. It's more like having a junior dev who actually reads the codebase before touching anything.", "Here's what surprised me: it doesn't hallucinate file paths. Cursor does this constantly and it makes me want to throw my laptop. \\"Oh let me edit src/utils/helper.ts\\" — that file doesn't exist, man. You made it up.", "Claude Code just... reads the actual files. Makes precise edits. Doesn't invent functions that don't exist. Sounds basic but apparently it's revolutionary in 2024.", "Where it shines: boring refactors. Renaming variables across 12 files. Adding error handling to 30 API calls. The stuff I'd procrastinate on for days — done in minutes while I focus on actual architecture decisions.", "Still not perfect. Sometimes it overthinks a 3-line fix and writes a 40-line abstraction nobody asked for. But 80% of the time? Faster than doing it myself.", "Anyone else made the switch? Curious what's working (or not) for you."]`;

console.log('Testing thread optimizer...\n');
console.log('Input length:', claudeResponse.length);
console.log('Starts with [:', claudeResponse.startsWith('['));
console.log('Ends with ]:', claudeResponse.endsWith(']'));
console.log('\n' + '='.repeat(70) + '\n');

const optimized = optimizeThread(claudeResponse);

console.log('Result:');
console.log('isThread:', optimized.isThread);
console.log('Metadata:', JSON.stringify(optimized.metadata, null, 2));
console.log('\n' + '='.repeat(70) + '\n');

if (Array.isArray(optimized.content)) {
  console.log('📊 THREAD:');
  optimized.content.forEach((tweet, i) => {
    console.log(`${i + 1}. [${tweet.length} chars]`);
    console.log(`   ${tweet.substring(0, 80)}...`);
  });
} else {
  console.log('📝 SINGLE TWEET:');
  console.log(`Length: ${optimized.content.length}`);
  console.log(optimized.content.substring(0, 200));
}
