import dotenv from 'dotenv';
import chalk from 'chalk';
import { generateDigest } from './digest.js';

dotenv.config();

// ASCII art header
console.log(chalk.cyan(`
╔══════════════════════════════════════╗
║     🎯 DAILY VOICE                   ║
║     Transform learning into posts    ║
╚══════════════════════════════════════╝
`));

// Main entry point
async function main() {
  try {
    await generateDigest();
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}

main();