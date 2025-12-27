import ora from 'ora';
import chalk from 'chalk';

// Import all discovery sources
import { fetchDevTo, fetchDevToEducational } from './sources/devto.js';
import { fetchHackerNews } from './sources/hackernews.js';
import { fetchGitHubTrending } from './sources/github.js';
import { fetchLobsters } from './sources/lobsters.js';
import { fetchHashnode } from './sources/hashnode.js';
import { fetchFreeCodeCamp } from './sources/freecodecamp.js';
import { fetchDailyDev } from './sources/dailydev.js';

/**
 * Main discovery function that fetches content from all sources
 */
export async function discoverContent() {
  // Separate sources by type
  const trendingSources = [
    { name: 'Dev.to', fetch: fetchDevTo, emoji: '📝' },
    { name: 'HackerNews', fetch: fetchHackerNews, emoji: '🔥' },
    { name: 'GitHub', fetch: fetchGitHubTrending, emoji: '⭐' },
    { name: 'Lobsters', fetch: fetchLobsters, emoji: '🦞' },
    { name: 'Hashnode', fetch: fetchHashnode, emoji: '#️⃣' }
  ];

  const educationalSources = [
    { name: 'DevTo-Edu', fetch: fetchDevToEducational, emoji: '📚' },
    { name: 'FreeCodeCamp', fetch: fetchFreeCodeCamp, emoji: '🎓' },
    { name: 'DailyDev', fetch: fetchDailyDev, emoji: '📖' }
  ];

  const allSources = [...trendingSources, ...educationalSources];

  console.log(chalk.blue.bold('\n📡 Discovering content from multiple sources...\n'));

  const results = {};
  let successCount = 0;
  let totalItems = 0;
  let educationalCount = 0;
  let trendingCount = 0;

  // Fetch from each source
  for (const source of allSources) {
    const spinner = ora({
      text: `Fetching from ${source.name}...`,
      prefixText: source.emoji
    }).start();

    try {
      const startTime = Date.now();
      const items = await source.fetch();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      results[source.name.toLowerCase()] = items;
      successCount++;
      totalItems += items.length;

      spinner.succeed(
        chalk.green(`${source.name} - ${chalk.bold(items.length)} items (${duration}s)`)
      );
    } catch (error) {
      spinner.fail(
        chalk.red(`${source.name} failed: ${error.message}`)
      );
      results[source.name.toLowerCase()] = [];
    }
  }

  // Summary
  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(
    chalk.blue.bold('📊 Discovery Summary: ') +
    chalk.green(`${successCount}/${allSources.length} sources`) +
    chalk.gray(' | ') +
    chalk.yellow(`${totalItems} total items`)
  );
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  return results;
}

/**
 * Fetches content from a specific source
 */
export async function discoverFromSource(sourceName) {
  const sourceMap = {
    'devto': fetchDevTo,
    'hackernews': fetchHackerNews,
    'github': fetchGitHubTrending,
    'lobsters': fetchLobsters,
    'hashnode': fetchHashnode
  };

  const fetcher = sourceMap[sourceName.toLowerCase()];

  if (!fetcher) {
    throw new Error(`Unknown source: ${sourceName}`);
  }

  const spinner = ora(`Fetching from ${sourceName}...`).start();

  try {
    const items = await fetcher();
    spinner.succeed(`Found ${items.length} items from ${sourceName}`);
    return items;
  } catch (error) {
    spinner.fail(`Failed to fetch from ${sourceName}: ${error.message}`);
    throw error;
  }
}