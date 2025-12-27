/**
 * Fetches trending articles from Dev.to
 * No authentication required - uses public API
 */
export async function fetchDevTo() {
  try {
    const url = new URL('https://dev.to/api/articles');
    url.searchParams.append('per_page', '40'); // Increased from 20
    url.searchParams.append('top', '1'); // Get trending articles from last day

    const response = await fetch(url.toString());
    const data = await response.json();

    return data.map(article => ({
      title: article.title,
      url: article.url,
      description: article.description,
      tags: article.tag_list,
      readingTime: article.reading_time_minutes,
      reactions: article.positive_reactions_count,
      comments: article.comments_count,
      author: article.user.username,
      publishedAt: article.published_at,
      coverImage: article.cover_image
    }));
  } catch (error) {
    console.error('Error fetching Dev.to articles:', error.message);
    return [];
  }
}

/**
 * Fetches educational/tutorial articles from Dev.to
 * Focuses on learning content rather than news
 */
export async function fetchDevToEducational() {
  try {
    const educationalTags = [
      'tutorial',
      'beginners',
      'systemdesign',
      'architecture',
      'ai',
      'machinelearning',
      'explainlikeimfive',
      'learning'
    ];

    const allArticles = [];

    // Fetch top articles for each educational tag
    for (const tag of educationalTags.slice(0, 4)) { // Limit to 4 tags to avoid too many requests
      const url = new URL('https://dev.to/api/articles');
      url.searchParams.append('tag', tag);
      url.searchParams.append('per_page', '5');
      url.searchParams.append('top', '7'); // Last week's top educational content

      const response = await fetch(url.toString());
      const articles = await response.json();

      allArticles.push(...articles.map(article => ({
        ...article,
        educationalTag: tag // Mark which educational tag it came from
      })));

      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Remove duplicates and format
    const uniqueArticles = Array.from(
      new Map(allArticles.map(item => [item.id, item])).values()
    );

    return uniqueArticles.map(article => ({
      title: article.title,
      url: article.url,
      description: article.description,
      tags: article.tag_list,
      educationalTag: article.educationalTag,
      readingTime: article.reading_time_minutes,
      reactions: article.positive_reactions_count,
      comments: article.comments_count,
      author: article.user.username,
      publishedAt: article.published_at,
      coverImage: article.cover_image,
      isEducational: true // Flag to identify educational content
    }));
  } catch (error) {
    console.error('Error fetching Dev.to educational articles:', error.message);
    return [];
  }
}