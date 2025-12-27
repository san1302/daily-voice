/**
 * Fetches top stories from HackerNews
 * Uses the official Firebase API - no auth required
 */
export async function fetchHackerNews() {
  try {
    // Get top story IDs
    const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
    const response = await fetch(topStoriesUrl);
    const storyIds = (await response.json()).slice(0, 20); // Get top 20 stories

    // Fetch details for each story
    const storyPromises = storyIds.map(id =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then(res => res.json())
    );

    const stories = await Promise.all(storyPromises);

    // Filter and map stories
    return stories
      .filter(story => story && story.url) // Only include stories with external URLs
      .map(story => ({
        title: story.title,
        url: story.url,
        score: story.score,
        author: story.by,
        comments: story.descendants || 0,
        time: new Date(story.time * 1000).toISOString(),
        type: story.type,
        hnUrl: `https://news.ycombinator.com/item?id=${story.id}`
      }));
  } catch (error) {
    console.error('Error fetching HackerNews stories:', error.message);
    return [];
  }
}