/**
 * Fetches hottest stories from Lobste.rs
 * Completely open API - no authentication needed
 */
export async function fetchLobsters() {
  try {
    // Fetch hottest stories from Lobste.rs
    const response = await fetch('https://lobste.rs/hottest.json');
    const data = await response.json();

    // Map and filter the top 15 stories
    return data.slice(0, 15).map(story => ({
      title: story.title,
      url: story.url,
      shortUrl: story.short_id_url,
      score: story.score,
      comments: story.comment_count,
      author: story.submitter_user,
      tags: story.tags,
      createdAt: story.created_at,
      description: story.description || '',
      commentsUrl: story.comments_url
    }));
  } catch (error) {
    console.error('Error fetching Lobste.rs stories:', error.message);
    return [];
  }
}