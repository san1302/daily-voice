import { format } from 'date-fns';

/**
 * Normalizes scores from different sources to 0-100 scale
 */
function normalizeScore(source, item) {
  switch(source) {
    case 'devto':
      // Dev.to: Based on reactions count
      // Educational content gets a bonus
      const devtoScore = Math.min(100, Math.round(item.reactions / 10));
      return item.isEducational ? Math.min(100, devtoScore + 10) : devtoScore;

    case 'devto-edu':
      // Educational Dev.to content gets higher base score
      return Math.min(100, Math.round(item.reactions / 8) + 15);

    case 'hackernews':
      // HackerNews: Based on score
      return Math.min(100, Math.round(item.score / 5));

    case 'github':
      // GitHub: Based on stars gained today
      const stars = item.starsToday || 0;
      return Math.min(100, Math.round(stars / 3));

    case 'lobsters':
      // Lobste.rs: Based on score
      return Math.min(100, Math.round(item.score * 5));

    case 'hashnode':
      // Hashnode: Based on reactions
      return Math.min(100, Math.round(item.reactions / 5));

    case 'freecodecamp':
      // FreeCodeCamp tutorials get high base score (educational content)
      return 75; // High default for quality educational content

    case 'dailydev':
      // Daily.dev curated content
      return item.isEducational ? 70 : 60;

    default:
      return 50; // Default middle score
  }
}

/**
 * Generates a unique ID for each item
 */
function generateId(source, index) {
  return `${source}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extracts tags/topics from different sources
 */
function extractTags(source, item) {
  switch(source) {
    case 'devto':
    case 'devto-edu':
      return item.tags || [];
    case 'hackernews':
      return ['tech', 'news']; // HN doesn't have tags
    case 'github':
      return item.language ? [item.language.toLowerCase()] : ['code'];
    case 'lobsters':
      return item.tags || [];
    case 'hashnode':
      return item.tags || [];
    case 'freecodecamp':
      return item.tags || ['tutorial', 'learning'];
    case 'dailydev':
      return item.tags || ['curated'];
    default:
      return [];
  }
}

/**
 * Normalizes all data from different sources into a unified format
 */
export function normalizeAll(rawData) {
  const normalized = [];
  let globalIndex = 0;

  for (const [source, items] of Object.entries(rawData)) {
    if (!Array.isArray(items)) continue;

    items.forEach((item, index) => {
      // Skip invalid items
      if (!item || (!item.title && !item.name)) return;

      const normalizedItem = {
        id: generateId(source, globalIndex++),
        title: item.title || item.name || 'Untitled',
        url: item.url || item.hnUrl || '',
        source: source.toLowerCase(),
        score: normalizeScore(source.toLowerCase(), item),
        tags: extractTags(source.toLowerCase(), item),
        timestamp: new Date().toISOString(),

        // Common metadata
        author: item.author || item.user || item.submitter_user || 'Unknown',
        description: item.description || item.brief || '',

        // Educational flag for categorization
        isEducational: item.isEducational || false,

        // Source-specific metadata preserved
        metadata: {
          ...item,
          sourceName: source
        }
      };

      // Add engagement metrics
      if (item.comments !== undefined) {
        normalizedItem.engagement = {
          comments: item.comments
        };
      }
      if (item.reactions !== undefined) {
        normalizedItem.engagement = {
          ...normalizedItem.engagement,
          reactions: item.reactions
        };
      }

      normalized.push(normalizedItem);
    });
  }

  // Sort by score (highest first)
  return normalized.sort((a, b) => b.score - a.score);
}

/**
 * Groups normalized items by source
 */
export function groupBySource(normalizedItems) {
  const grouped = {};

  normalizedItems.forEach(item => {
    if (!grouped[item.source]) {
      grouped[item.source] = [];
    }
    grouped[item.source].push(item);
  });

  return grouped;
}

/**
 * Filters items by minimum score
 */
export function filterByScore(normalizedItems, minScore = 30) {
  return normalizedItems.filter(item => item.score >= minScore);
}

/**
 * Get top N items from normalized data
 */
export function getTopItems(normalizedItems, count = 20) {
  return normalizedItems.slice(0, count);
}

/**
 * Separates content into educational and trending categories
 */
export function categorizeContent(normalizedItems) {
  const educational = [];
  const trending = [];

  normalizedItems.forEach(item => {
    if (item.isEducational) {
      educational.push(item);
    } else {
      trending.push(item);
    }
  });

  return {
    educational: educational.sort((a, b) => b.score - a.score),
    trending: trending.sort((a, b) => b.score - a.score)
  };
}

/**
 * Get a balanced mix of educational and trending content
 */
export function getBalancedContent(normalizedItems, totalCount = 30) {
  const { educational, trending } = categorizeContent(normalizedItems);

  // Aim for 40% educational, 60% trending
  const eduCount = Math.floor(totalCount * 0.4);
  const trendCount = totalCount - eduCount;

  const selectedEdu = educational.slice(0, eduCount);
  const selectedTrend = trending.slice(0, trendCount);

  // Merge and sort by score
  return [...selectedEdu, ...selectedTrend].sort((a, b) => b.score - a.score);
}