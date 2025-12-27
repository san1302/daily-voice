/**
 * Fetches featured articles from Hashnode using GraphQL
 * No authentication required for public queries
 */
export async function fetchHashnode() {
  try {
    // GraphQL query to fetch featured articles
    const query = `
      query GetFeaturedArticles {
        feed(first: 15, filter: {type: FEATURED}) {
          edges {
            node {
              id
              title
              brief
              url
              slug
              author {
                username
                name
              }
              tags {
                name
                slug
              }
              reactionCount
              responseCount
              readTimeInMinutes
              coverImage {
                url
              }
              publishedAt
            }
          }
        }
      }
    `;

    // Make GraphQL request
    const response = await fetch('https://gql.hashnode.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    // Extract and map articles
    const articles = data.data.feed.edges.map(edge => edge.node);

    return articles.map(article => ({
      title: article.title,
      url: article.url,
      brief: article.brief,
      author: article.author.name || article.author.username,
      tags: article.tags.map(tag => tag.name),
      reactions: article.reactionCount,
      comments: article.responseCount,
      readTime: article.readTimeInMinutes,
      coverImage: article.coverImage?.url || null,
      publishedAt: article.publishedAt
    }));
  } catch (error) {
    console.error('Error fetching Hashnode articles:', error.message);
    return [];
  }
}