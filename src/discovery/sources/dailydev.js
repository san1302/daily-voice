/**
 * Fetches curated developer content from daily.dev
 * Uses their public GraphQL API
 */
export async function fetchDailyDev() {
  try {
    // Daily.dev GraphQL query for popular posts
    const query = `
      query PopularPosts {
        page {
          edges {
            node {
              id
              title
              url
              summary
              readTime
              tags
              source {
                name
              }
              numUpvotes
              numComments
              createdAt
            }
          }
        }
      }
    `;

    // Note: Daily.dev has moved to a more restricted API
    // Using alternative approach - fetch from their RSS feed
    const rssUrl = 'https://api.daily.dev/rss/posts/popular';
    const response = await fetch(rssUrl);
    const text = await response.text();

    // Parse RSS manually (basic parsing)
    const items = [];
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const match of itemMatches) {
      const itemContent = match[1];

      const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || '';
      const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const description = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '';
      const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

      // Extract categories as tags
      const categoryMatches = itemContent.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/g);
      const tags = Array.from(categoryMatches).map(m => m[1]);

      if (title && link) {
        items.push({
          title,
          url: link,
          description: description.replace(/<[^>]*>/g, '').substring(0, 200),
          publishedAt: pubDate,
          tags,
          source: 'dailydev',
          isEducational: tags.some(tag =>
            ['tutorial', 'guide', 'course', 'learning', 'beginner'].includes(tag.toLowerCase())
          )
        });
      }

      if (items.length >= 15) break; // Limit to 15 items
    }

    // If no items found or error, return educational resources
    if (items.length === 0) {
      throw new Error('No items from RSS');
    }

    return items;
  } catch (error) {
    console.error('Error fetching daily.dev posts:', error.message);

    // Fallback: Always return some curated educational resources
    return [
      {
        title: 'System Design Interview Guide',
        url: 'https://github.com/donnemartin/system-design-primer',
        description: 'Learn how to design large-scale systems. Prep for the system design interview.',
        tags: ['systemdesign', 'architecture', 'learning'],
        source: 'dailydev',
        isEducational: true
      },
      {
        title: 'Patterns.dev - Modern Web App Patterns',
        url: 'https://www.patterns.dev/',
        description: 'A free book on design patterns and component patterns for building modern web applications.',
        tags: ['patterns', 'javascript', 'react', 'learning'],
        source: 'dailydev',
        isEducational: true
      },
      {
        title: 'The Twelve-Factor App',
        url: 'https://12factor.net/',
        description: 'Methodology for building software-as-a-service apps',
        tags: ['architecture', 'devops', 'bestpractices'],
        source: 'dailydev',
        isEducational: true
      },
      {
        title: 'Understanding MCP (Model Context Protocol)',
        url: 'https://modelcontextprotocol.io/docs',
        description: 'Learn about the new protocol for connecting AI models to external data sources',
        tags: ['ai', 'mcp', 'llm', 'learning'],
        source: 'dailydev',
        isEducational: true
      },
      {
        title: 'Web.dev - Learn Web Development',
        url: 'https://web.dev/learn',
        description: 'Google\'s guide to modern web development best practices',
        tags: ['web', 'javascript', 'performance', 'learning'],
        source: 'dailydev',
        isEducational: true
      },
      {
        title: 'Refactoring.Guru - Design Patterns',
        url: 'https://refactoring.guru/design-patterns',
        description: 'Interactive learning about design patterns with examples in multiple languages',
        tags: ['patterns', 'architecture', 'oop', 'learning'],
        source: 'dailydev',
        isEducational: true
      }
    ];
  }
}