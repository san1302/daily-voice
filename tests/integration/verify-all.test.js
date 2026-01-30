import { generatePost } from './src/core/generator.js';
import 'dotenv/config';
import chalk from 'chalk';

const cases = [
  { name: 'Very Short', input: 'JavaScript promises are just fancy callbacks with better error handling.', len: 72 },
  { name: 'Short-Medium', input: 'Spent 3 hours debugging a CSS issue. Turned out margin-top was collapsing with the parent. Added overflow:hidden to the container. Fixed. This is why I have trust issues with CSS. Margins are a lie.', len: 198 },
  { name: 'Medium', input: 'Been trying MoltBot for content automation. The promise is good - AI-powered social posting. But the execution feels half-baked. The posts it generates read like they were written by someone who learned English from LinkedIn inspirational quotes. Too polished, zero personality. I wanted a tool that amplifies my voice, not replaces it with corporate speak.', len: 361 }
];

console.log(chalk.bold.green('🧪 FINAL VALIDATION\n'));

for (const tc of cases) {
  console.log(chalk.cyan(`\n${tc.name} (${tc.len} chars):`));
  
  const result = await generatePost(tc.input, { platforms: ['twitter'] });
  const tw = result.twitter;
  const outChars = tw.isThread ? tw.content.reduce((s,t) => s+t.length, 0) : tw.content.length;
  const expansion = (outChars / tc.len).toFixed(1);
  
  console.log(`  Output: ${outChars} chars (${expansion}x expansion)`);
  console.log(`  Format: ${tw.isThread ? `${tw.content.length} tweets` : 'Single tweet'}`);
  
  const verdict = expansion <= 4.0 ? chalk.green('✅ Good') : chalk.red('❌ Over-expanded');
  console.log(`  ${verdict}`);
  
  await new Promise(r => setTimeout(r, 2000));
}

console.log(chalk.bold.green('\n✅ DONE\n'));
