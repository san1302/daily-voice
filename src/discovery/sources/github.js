import * as cheerio from 'cheerio';

/**
 * Scrapes trending repositories from GitHub
 * No API key needed - uses public trending page
 */
export async function fetchGitHubTrending() {
  try {
    // Fetch the trending page HTML
    const url = 'https://github.com/trending?spoken_language_code=en';
    const response = await fetch(url);
    const data = await response.text();

    const $ = cheerio.load(data);
    const repos = [];

    // Parse each repository article
    $('article.Box-row').each((i, elem) => {
      if (i >= 15) return; // Limit to top 15 repos

      const $elem = $(elem);

      // Extract repo name and URL
      const repoLink = $elem.find('h2 a').first();
      const repoPath = repoLink.attr('href');
      const repoName = repoLink.text().replace(/\s+/g, ' ').trim();

      // Extract description
      const description = $elem.find('p.color-fg-muted').text().trim();

      // Extract language
      const language = $elem.find('[itemprop="programmingLanguage"]').text().trim();

      // Extract stars gained today
      const starsToday = $elem.find('.d-inline-block.float-sm-right')
        .text()
        .trim()
        .replace(/,/g, '')
        .match(/\d+/);

      // Extract total stars
      const totalStars = $elem.find('svg.octicon-star')
        .parent()
        .text()
        .trim()
        .replace(/,/g, '');

      if (repoName) {
        repos.push({
          name: repoName,
          url: `https://github.com${repoPath}`,
          description: description || 'No description available',
          language: language || 'Unknown',
          starsToday: starsToday ? parseInt(starsToday[0]) : 0,
          totalStars: totalStars || '0',
          author: repoPath ? repoPath.split('/')[1] : 'Unknown'
        });
      }
    });

    return repos;
  } catch (error) {
    console.error('Error fetching GitHub trending:', error.message);
    return [];
  }
}