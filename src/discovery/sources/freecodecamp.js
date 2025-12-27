import * as cheerio from 'cheerio';

/**
 * Fetches latest tutorials and educational articles from FreeCodeCamp
 * Scrapes their news page for learning content
 */
export async function fetchFreeCodeCamp() {
  try {
    // FreeCodeCamp's news feed - all tutorials and guides
    const response = await fetch('https://www.freecodecamp.org/news/');
    const html = await response.text();

    const $ = cheerio.load(html);
    const articles = [];

    // Select article elements - updated selector
    $('article').each((i, elem) => {
      if (i >= 15) return; // Limit to 15 articles

      const $elem = $(elem);

      // Try multiple selectors for title
      const title = $elem.find('h2').text().trim() ||
                   $elem.find('h3').text().trim() ||
                   $elem.find('.post-card-title').text().trim();

      // Try multiple selectors for URL
      const url = $elem.find('a').first().attr('href') ||
                 $elem.find('.post-card-content-link').attr('href');

      // Try to get excerpt/description
      const excerpt = $elem.find('p').first().text().trim() ||
                     $elem.find('.post-card-excerpt').text().trim();

      // Try to get author
      const author = $elem.find('.author-name').text().trim() ||
                    $elem.find('.post-card-author').text().trim() ||
                    'FreeCodeCamp';

      if (title && url) {
        articles.push({
          title,
          url: url.startsWith('http') ? url : `https://www.freecodecamp.org${url}`,
          description: excerpt.substring(0, 200),
          author,
          readTime: 10, // Default reading time
          tags: ['tutorial', 'learning', 'programming'],
          source: 'freecodecamp',
          isEducational: true
        });
      }
    });

    return articles;
  } catch (error) {
    console.error('Error fetching FreeCodeCamp articles:', error.message);
    return [];
  }
}