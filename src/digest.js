import inquirer from 'inquirer';
import open from 'open';
import fs from 'fs/promises';
import chalk from 'chalk';
import { format } from 'date-fns';
import { discoverContent } from './discovery/index.js';
import { normalizeAll, getTopItems, categorizeContent } from './discovery/normalizer.js';

/**
 * Formats an item for display in the selection list
 */
function formatItemForDisplay(item, index) {
  const sourceEmoji = {
    'devto': '📝',
    'hackernews': '🔥',
    'github': '⭐',
    'lobsters': '🦞',
    'hashnode': '#️⃣'
  };

  const emoji = sourceEmoji[item.source] || '📄';
  const scoreBar = '▓'.repeat(Math.floor(item.score / 10)) +
                    '░'.repeat(10 - Math.floor(item.score / 10));

  return `${String(index + 1).padStart(2)}. ${emoji} [${scoreBar}] ${item.title.substring(0, 80)}${item.title.length > 80 ? '...' : ''}`;
}

/**
 * Saves data to a JSON file
 */
async function saveToFile(filename, data) {
  try {
    await fs.mkdir('data', { recursive: true });
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(chalk.red(`Error saving file: ${error.message}`));
    return false;
  }
}

/**
 * Main digest generation and interaction function
 */
export async function generateDigest() {
  try {
    // Fetch from all sources
    const rawData = await discoverContent();

    // Normalize and rank the data
    const normalized = normalizeAll(rawData);

    if (normalized.length === 0) {
      console.log(chalk.yellow('⚠️  No content found. Please check your internet connection.'));
      return;
    }

    // Categorize content
    const { educational, trending } = categorizeContent(normalized);

    // Get top items from each category
    // Prioritize educational content (25 items) over trending (15 items)
    const topEducational = educational.slice(0, 25);
    const topTrending = trending.slice(0, 15);
    const topItems = [...topEducational, ...topTrending];

    // Save full digest to file
    const date = format(new Date(), 'yyyy-MM-dd');
    const digestFile = `data/digest-${date}.json`;
    await saveToFile(digestFile, {
      date,
      totalItems: normalized.length,
      educationalCount: educational.length,
      trendingCount: trending.length,
      items: normalized
    });

    console.log(chalk.green(`💾 Full digest saved to ${digestFile}`));
    console.log(chalk.gray(`   📚 ${educational.length} educational items | 🔥 ${trending.length} trending items\n`));

    // Show interactive selection
    console.log(chalk.blue.bold('✨ Your Daily Digest is ready!\n'));
    console.log(chalk.gray('Use arrow keys to navigate, space to select, enter to confirm.\n'));

    // Create choices with sections
    const enhancedChoices = [];
    let itemIndex = 0;

    // Add educational section
    if (topEducational.length > 0) {
      enhancedChoices.push(new inquirer.Separator(
        chalk.green.bold('\n━━━━━ 📚 LEARN TODAY ━━━━━')
      ));

      topEducational.forEach(item => {
        enhancedChoices.push({
          name: formatItemForDisplay(item, itemIndex++),
          value: item,
          short: item.title.substring(0, 50)
        });
      });
    }

    // Add trending section
    if (topTrending.length > 0) {
      enhancedChoices.push(new inquirer.Separator(
        chalk.yellow.bold('\n━━━━━ 🔥 TRENDING NOW ━━━━━')
      ));

      topTrending.forEach(item => {
        enhancedChoices.push({
          name: formatItemForDisplay(item, itemIndex++),
          value: item,
          short: item.title.substring(0, 50)
        });
      });
    }

    // Interactive multi-select
    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select topics to explore:',
        choices: enhancedChoices,
        pageSize: 15,
        loop: false
      }
    ]);

    if (selected.length === 0) {
      console.log(chalk.yellow('\n No items selected. Exiting...'));
      return;
    }

    // Ask what to do with selected items
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🌐 Open all in browser', value: 'open' },
          { name: '💾 Save for later', value: 'save' },
          { name: '🌐 + 💾 Open and save', value: 'both' }
        ]
      }
    ]);

    // Save selections
    if (action === 'save' || action === 'both') {
      const selectionsFile = `data/selections-${date}.json`;
      await saveToFile(selectionsFile, {
        date,
        timestamp: new Date().toISOString(),
        count: selected.length,
        items: selected
      });
      console.log(chalk.green(`\n💾 Selections saved to ${selectionsFile}`));
    }

    // Open in browser
    if (action === 'open' || action === 'both') {
      console.log(chalk.blue('\n🌐 Opening selected items in browser...\n'));

      for (const item of selected) {
        console.log(chalk.gray(`  Opening: ${item.title.substring(0, 60)}...`));
        await open(item.url);
        // Small delay to prevent browser overwhelm
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Show next steps
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.blue.bold('💡 Next Steps:'));
    console.log(chalk.gray('1. Explore the selected content'));
    console.log(chalk.gray('2. Take notes on what you learned'));
    console.log(chalk.gray('3. Run ') + chalk.yellow('npm run create-post') + chalk.gray(' to generate a social media post'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error generating digest:'), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDigest();
}