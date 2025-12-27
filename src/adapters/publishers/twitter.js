/**
 * twitter.js - Twitter Publishing Adapter
 *
 * Handles posting to Twitter (single tweets and threads).
 * Part of the platform-agnostic publisher architecture.
 *
 * Key features:
 * - OAuth 1.0a authentication
 * - Single tweet posting
 * - Thread posting (automatic reply chaining)
 * - Error handling (auth, rate limits, network)
 * - No rollback on partial thread failures
 */

import { TwitterApi } from 'twitter-api-v2';
import 'dotenv/config';

/**
 * Initialize Twitter API client with credentials from .env
 * @returns {TwitterApi} - Authenticated Twitter client
 * @throws {Error} if credentials are missing
 */
function initializeClient() {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  // Validate credentials
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error(
      'Twitter credentials missing. Please set TWITTER_API_KEY, TWITTER_API_SECRET, ' +
      'TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_SECRET in your .env file.\n\n' +
      'Get credentials at: https://developer.twitter.com/en/portal/dashboard'
    );
  }

  // Create authenticated client
  const client = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });

  return client;
}

/**
 * Post a single tweet
 * @param {string} content - Tweet text (max 280 characters)
 * @returns {Promise<object>} - { id, url, text }
 * @throws {Error} on API errors
 */
async function postTweet(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Tweet content must be a non-empty string');
  }

  if (content.length > 280) {
    throw new Error(`Tweet too long (${content.length} chars). Max 280 characters.`);
  }

  const client = initializeClient();

  try {
    // Post tweet using v2 API
    const tweet = await client.v2.tweet(content);

    // Get username for URL construction
    const me = await client.v2.me();

    return {
      id: tweet.data.id,
      url: `https://twitter.com/${me.data.username}/status/${tweet.data.id}`,
      text: content
    };
  } catch (error) {
    // Handle specific Twitter API errors
    if (error.code === 401 || error.code === 403) {
      throw new Error(
        'Authentication failed. Check your Twitter credentials in .env file.\n' +
        'Make sure your app has "Read and Write" permissions.'
      );
    }

    if (error.code === 429) {
      throw new Error(
        'Rate limit exceeded. Twitter free tier allows 1,500 tweets/month.\n' +
        'Try again later or check your usage at: https://developer.twitter.com/en/portal/dashboard'
      );
    }

    if (error.data?.detail) {
      throw new Error(`Twitter API error: ${error.data.detail}`);
    }

    throw new Error(`Failed to post tweet: ${error.message}`);
  }
}

/**
 * Post a Twitter thread (multiple tweets as replies)
 * @param {Array<string>} tweets - Array of tweet texts
 * @returns {Promise<object>} - { tweets: [{ id, url, text }], threadUrl }
 * @throws {Error} on API errors or if thread fails mid-way
 */
async function postThread(tweets) {
  if (!Array.isArray(tweets) || tweets.length === 0) {
    throw new Error('Thread must be a non-empty array of tweets');
  }

  if (tweets.length === 1) {
    // Single tweet, use postTweet instead
    const result = await postTweet(tweets[0]);
    return {
      tweets: [result],
      threadUrl: result.url
    };
  }

  // Validate all tweets before posting
  tweets.forEach((tweet, index) => {
    if (!tweet || typeof tweet !== 'string') {
      throw new Error(`Tweet ${index + 1} is invalid (must be a non-empty string)`);
    }
    if (tweet.length > 280) {
      throw new Error(`Tweet ${index + 1} is too long (${tweet.length} chars). Max 280 characters.`);
    }
  });

  const client = initializeClient();
  const postedTweets = [];
  let lastTweetId = null;

  try {
    // Get username once for URL construction
    const me = await client.v2.me();
    const username = me.data.username;

    // Post each tweet in sequence
    for (let i = 0; i < tweets.length; i++) {
      const tweetContent = tweets[i];

      try {
        // Post tweet (first tweet has no reply_to, subsequent tweets reply to previous)
        const tweetOptions = lastTweetId
          ? { reply: { in_reply_to_tweet_id: lastTweetId } }
          : {};

        const tweet = await client.v2.tweet(tweetContent, tweetOptions);

        const tweetData = {
          id: tweet.data.id,
          url: `https://twitter.com/${username}/status/${tweet.data.id}`,
          text: tweetContent,
          position: i + 1
        };

        postedTweets.push(tweetData);
        lastTweetId = tweet.data.id;

      } catch (error) {
        // Thread failed mid-way - DON'T rollback (as per user requirement)
        const partialError = new Error(
          `Thread failed at tweet ${i + 1} of ${tweets.length}.\n` +
          `Successfully posted: ${postedTweets.length} tweet(s).\n` +
          `Error: ${error.message}\n\n` +
          `The ${postedTweets.length} published tweet(s) will remain on Twitter. ` +
          `You can manually delete them or continue the thread.`
        );

        // Attach partial results to error for caller to handle
        partialError.partial = true;
        partialError.postedTweets = postedTweets;
        partialError.failedAt = i + 1;
        partialError.totalTweets = tweets.length;

        throw partialError;
      }
    }

    // Success - all tweets posted
    return {
      tweets: postedTweets,
      threadUrl: postedTweets[0].url // First tweet URL
    };

  } catch (error) {
    // If error already has partial data, re-throw as-is
    if (error.partial) {
      throw error;
    }

    // Handle authentication/rate limit errors before any tweets posted
    if (error.code === 401 || error.code === 403) {
      throw new Error(
        'Authentication failed. Check your Twitter credentials in .env file.\n' +
        'Make sure your app has "Read and Write" permissions.'
      );
    }

    if (error.code === 429) {
      throw new Error(
        'Rate limit exceeded. Twitter free tier allows 1,500 tweets/month.\n' +
        'Try again later or check your usage at: https://developer.twitter.com/en/portal/dashboard'
      );
    }

    throw new Error(`Failed to post thread: ${error.message}`);
  }
}

/**
 * Auto-split long text into tweet-sized chunks for threads
 * @param {string} text - Long text to split
 * @returns {Array<string>} - Array of tweets (each ≤280 chars)
 */
function autoSplitIntoTweets(text) {
  const MAX_TWEET_LENGTH = 280;
  const tweets = [];

  // Split by paragraphs (double newlines)
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    // If paragraph fits in one tweet, add it
    if (trimmed.length <= MAX_TWEET_LENGTH) {
      tweets.push(trimmed);
      continue;
    }

    // Paragraph is too long - split by sentences
    const sentences = trimmed.split(/(?<=[.!?])\s+/);
    let currentTweet = '';

    for (const sentence of sentences) {
      // If adding this sentence exceeds limit, save current tweet and start new one
      if (currentTweet.length + sentence.length + 1 > MAX_TWEET_LENGTH) {
        if (currentTweet.length > 0) {
          tweets.push(currentTweet.trim());
          currentTweet = '';
        }

        // If single sentence is still too long, hard-split it
        if (sentence.length > MAX_TWEET_LENGTH) {
          const words = sentence.split(' ');
          let chunk = '';
          for (const word of words) {
            if (chunk.length + word.length + 1 > MAX_TWEET_LENGTH) {
              tweets.push(chunk.trim());
              chunk = word;
            } else {
              chunk += (chunk.length > 0 ? ' ' : '') + word;
            }
          }
          if (chunk.length > 0) {
            currentTweet = chunk;
          }
        } else {
          currentTweet = sentence;
        }
      } else {
        currentTweet += (currentTweet.length > 0 ? ' ' : '') + sentence;
      }
    }

    // Add remaining text
    if (currentTweet.length > 0) {
      tweets.push(currentTweet.trim());
    }
  }

  return tweets;
}

/**
 * Main publish function - handles both single tweets and threads
 * @param {string|Array<string>} content - Tweet text or array of tweets
 * @returns {Promise<object>} - Publishing result with metadata
 *
 * Return structure:
 * {
 *   success: true,
 *   platform: 'twitter',
 *   type: 'single' | 'thread',
 *   data: {
 *     tweetId: '123...',      // For single tweets
 *     tweetUrl: '...',        // For single tweets
 *     tweets: [...],          // For threads
 *     threadUrl: '...'        // For threads
 *   },
 *   publishedAt: '2025-12-24T...'
 * }
 */
export async function publishToTwitter(content) {
  try {
    // Determine if single tweet or thread
    const isThread = Array.isArray(content);
    const isSingleTweet = typeof content === 'string';

    if (!isThread && !isSingleTweet) {
      throw new Error('Content must be a string (single tweet) or array (thread)');
    }

    // Auto-split long strings into threads
    let processedContent = content;
    if (isSingleTweet && content.length > 280) {
      processedContent = autoSplitIntoTweets(content);
    }

    let result;

    // Re-check if we now have a thread after auto-split
    const isNowThread = Array.isArray(processedContent);

    if (isNowThread) {
      // Post thread
      const threadResult = await postThread(processedContent);
      result = {
        success: true,
        platform: 'twitter',
        type: 'thread',
        data: {
          tweets: threadResult.tweets,
          threadUrl: threadResult.threadUrl
        },
        publishedAt: new Date().toISOString()
      };
    } else {
      // Post single tweet
      const tweetResult = await postTweet(processedContent);
      result = {
        success: true,
        platform: 'twitter',
        type: 'single',
        data: {
          tweetId: tweetResult.id,
          tweetUrl: tweetResult.url
        },
        publishedAt: new Date().toISOString()
      };
    }

    return result;

  } catch (error) {
    // Handle partial thread failures
    if (error.partial) {
      return {
        success: false,
        partial: true,
        platform: 'twitter',
        type: 'thread',
        data: {
          tweets: error.postedTweets,
          threadUrl: error.postedTweets[0]?.url
        },
        error: error.message,
        failedAt: error.failedAt,
        totalTweets: error.totalTweets,
        publishedAt: new Date().toISOString()
      };
    }

    // Complete failure
    throw error;
  }
}
