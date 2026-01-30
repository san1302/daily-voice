/**
 * thread-optimizer.js - Smart Thread Processing & Validation
 *
 * Fixes issues with thread generation:
 * 1. Robust JSON parsing (handles markdown, malformed JSON)
 * 2. Post-generation validation (length checks, merging, splitting)
 * 3. Smart compression (avoid unnecessary threads)
 */

/**
 * Extract JSON from Claude's response
 * Handles markdown code blocks, extra text, etc.
 * @param {string} response - Raw response from Claude
 * @returns {string|null} - Extracted JSON string or null
 */
function extractJSON(response) {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  
  // Strip ```json and ``` markers
  cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
  
  // Find the actual JSON array
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }
  
  return null;
}

/**
 * Safely parse thread JSON with multiple strategies
 * @param {string} rawContent - Raw content from Claude
 * @returns {object} - { success: boolean, content: string|array, isThread: boolean }
 */
export function parseThreadJSON(rawContent) {
  // Strategy 1: Direct parse (already valid JSON)
  if (rawContent.startsWith('[') && rawContent.endsWith(']')) {
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed) && parsed.every(t => typeof t === 'string')) {
        return {
          success: true,
          content: parsed,
          isThread: true
        };
      }
    } catch (error) {
      // Fall through to next strategy
    }
  }

  // Strategy 2: Extract from markdown/extra text
  const extracted = extractJSON(rawContent);
  if (extracted) {
    try {
      const parsed = JSON.parse(extracted);
      if (Array.isArray(parsed) && parsed.every(t => typeof t === 'string')) {
        return {
          success: true,
          content: parsed,
          isThread: true
        };
      }
    } catch (error) {
      // Fall through
    }
  }

  // Strategy 3: Manual parsing when JSON.parse fails due to quote issues
  // This handles cases where Claude uses smart quotes or doesn't escape properly
  if (rawContent.startsWith('[') && rawContent.endsWith(']')) {
    try {
      const tweets = manualJSONParse(rawContent);
      if (tweets && tweets.length > 0) {
        return {
          success: true,
          content: tweets,
          isThread: true
        };
      }
    } catch (error) {
      // Fall through
    }
  }

  // Failed - treat as single tweet
  return {
    success: false,
    content: rawContent,
    isThread: false
  };
}

/**
 * Manual JSON array parser for when JSON.parse fails
 * Handles smart quotes and escaping issues
 * @param {string} jsonString - JSON array string
 * @returns {string[]|null} - Array of tweets or null if parse fails
 */
function manualJSONParse(jsonString) {
  // Strategy: Split by the delimiter pattern ", "
  // Then clean up the outer brackets and quotes
  
  // Remove outer brackets
  let content = jsonString.trim();
  if (content.startsWith('[')) content = content.slice(1);
  if (content.endsWith(']')) content = content.slice(0, -1);
  content = content.trim();
  
  // Split by ", " (the standard JSON array delimiter)
  const parts = content.split('", "');
  
  const tweets = parts.map((part, index) => {
    let cleaned = part;
    
    // Remove leading quote from first item
    if (index === 0 && cleaned.startsWith('"')) {
      cleaned = cleaned.slice(1);
    }
    
    // Remove trailing quote from last item
    if (index === parts.length - 1 && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(0, -1);
    }
    
    // Unescape quotes that were escaped in the JSON
    cleaned = cleaned.replace(/\\"/g, '"');
    
    return cleaned.trim();
  });
  
  // Filter out empty strings
  const filtered = tweets.filter(t => t.length > 0);
  
  return filtered.length > 0 ? filtered : null;
}

/**
 * Validate and fix individual tweet lengths
 * @param {string[]} tweets - Array of tweet strings
 * @returns {object} - { valid: boolean, tweets: string[], issues: string[] }
 */
export function validateTweetLengths(tweets) {
  const issues = [];
  const MAX_LENGTH = 280;
  const MIN_RECOMMENDED = 100;
  
  const analysis = tweets.map((tweet, index) => {
    const length = tweet.length;
    const warnings = [];
    
    if (length > MAX_LENGTH) {
      warnings.push(`Tweet ${index + 1} is ${length} chars (>${MAX_LENGTH})`);
    }
    
    if (length < MIN_RECOMMENDED && index < tweets.length - 1) {
      // Last tweet can be short (CTA), others should be meatier
      warnings.push(`Tweet ${index + 1} is ${length} chars (<${MIN_RECOMMENDED})`);
    }
    
    return {
      index,
      tweet,
      length,
      warnings
    };
  });
  
  const hasIssues = analysis.some(a => a.warnings.length > 0);
  
  return {
    valid: !hasIssues,
    tweets,
    analysis,
    issues: analysis.flatMap(a => a.warnings)
  };
}

/**
 * Merge short tweets into adjacent ones
 * @param {string[]} tweets - Array of tweets
 * @param {number} minLength - Minimum length threshold (default: 100)
 * @returns {string[]} - Optimized tweets
 */
export function mergeShortTweets(tweets, minLength = 100) {
  if (tweets.length === 1) return tweets;
  
  const merged = [];
  let i = 0;
  
  while (i < tweets.length) {
    let current = tweets[i];
    
    // Check if current tweet is too short (and not the last one)
    if (current.length < minLength && i < tweets.length - 1) {
      // Try to merge with next tweet
      const next = tweets[i + 1];
      const combined = current + ' ' + next;
      
      if (combined.length <= 280) {
        // Merge successful
        merged.push(combined);
        i += 2; // Skip both tweets
        continue;
      }
    }
    
    // Can't merge or shouldn't merge - keep as is
    merged.push(current);
    i++;
  }
  
  return merged;
}

/**
 * Split tweets that are too long
 * @param {string[]} tweets - Array of tweets
 * @returns {string[]} - Fixed tweets
 */
export function splitLongTweets(tweets) {
  const MAX_LENGTH = 280;
  const result = [];
  
  for (const tweet of tweets) {
    if (tweet.length <= MAX_LENGTH) {
      result.push(tweet);
      continue;
    }
    
    // Tweet is too long - split at natural break points
    const parts = smartSplit(tweet, MAX_LENGTH);
    result.push(...parts);
  }
  
  return result;
}

/**
 * Split text at natural break points (sentence boundaries, periods, etc.)
 * @param {string} text - Text to split
 * @param {number} maxLength - Max length per chunk
 * @returns {string[]} - Array of chunks
 */
function smartSplit(text, maxLength) {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks = [];
  let remaining = text;
  
  while (remaining.length > maxLength) {
    // Find last sentence boundary before maxLength
    let splitIndex = maxLength;
    
    // Try to split at period
    const lastPeriod = remaining.lastIndexOf('. ', maxLength);
    if (lastPeriod > maxLength * 0.6) {
      splitIndex = lastPeriod + 1;
    } else {
      // Try comma
      const lastComma = remaining.lastIndexOf(', ', maxLength);
      if (lastComma > maxLength * 0.6) {
        splitIndex = lastComma + 1;
      } else {
        // Last resort: split at space
        const lastSpace = remaining.lastIndexOf(' ', maxLength);
        if (lastSpace > 0) {
          splitIndex = lastSpace;
        }
      }
    }
    
    chunks.push(remaining.substring(0, splitIndex).trim());
    remaining = remaining.substring(splitIndex).trim();
  }
  
  if (remaining.length > 0) {
    chunks.push(remaining);
  }
  
  return chunks;
}

/**
 * Determine if content should be a thread or compressed into single tweet
 * @param {string[]} tweets - Array of tweets
 * @returns {object} - { shouldBeThread: boolean, reason: string, alternativeSingle?: string }
 */
export function shouldBeThread(tweets) {
  const totalChars = tweets.join(' ').length;
  const tweetCount = tweets.length;
  
  // Single tweet already
  if (tweetCount === 1) {
    return {
      shouldBeThread: false,
      reason: 'Already a single tweet'
    };
  }
  
  // Very short total content - could be single tweet
  if (totalChars <= 240) {
    const combined = tweets.join(' ');
    return {
      shouldBeThread: false,
      reason: `Total content is ${totalChars} chars - can fit in single tweet`,
      alternativeSingle: combined
    };
  }
  
  // 2 tweets with low density - might be better as single
  if (tweetCount === 2 && totalChars <= 260) {
    const combined = tweets.join(' ');
    return {
      shouldBeThread: false,
      reason: '2 tweets with low density - better as single tweet',
      alternativeSingle: combined
    };
  }
  
  // Legitimate thread
  return {
    shouldBeThread: true,
    reason: `${tweetCount} tweets, ${totalChars} total chars - thread is appropriate`
  };
}

/**
 * Main optimizer - applies all fixes
 * @param {string} rawContent - Raw content from Claude
 * @param {object} options - Options
 * @returns {object} - { content: string|array, isThread: boolean, metadata: object }
 */
export function optimizeThread(rawContent, options = {}) {
  const {
    minTweetLength = 100,
    maxTweetLength = 280,
    autoCompress = true
  } = options;
  
  // Step 1: Parse JSON
  const parsed = parseThreadJSON(rawContent);
  
  if (!parsed.success || !parsed.isThread) {
    // Single tweet - just validate length
    if (parsed.content.length > maxTweetLength) {
      const split = smartSplit(parsed.content, maxTweetLength);
      return {
        content: split,
        isThread: true,
        metadata: {
          originalFormat: 'single',
          modifications: ['split_long_tweet'],
          tweetCount: split.length
        }
      };
    }
    
    return {
      content: parsed.content,
      isThread: false,
      metadata: {
        originalFormat: 'single',
        modifications: []
      }
    };
  }
  
  // Step 2: Fix thread
  let tweets = parsed.content;
  const modifications = [];
  
  // Check if it should even be a thread
  if (autoCompress) {
    const threadCheck = shouldBeThread(tweets);
    if (!threadCheck.shouldBeThread && threadCheck.alternativeSingle) {
      return {
        content: threadCheck.alternativeSingle,
        isThread: false,
        metadata: {
          originalFormat: 'thread',
          modifications: ['compressed_to_single'],
          reason: threadCheck.reason,
          originalTweetCount: tweets.length
        }
      };
    }
  }
  
  // Step 3: Split any tweets that are too long
  const validation = validateTweetLengths(tweets);
  if (!validation.valid) {
    const tooLong = validation.analysis.some(a => a.length > maxTweetLength);
    if (tooLong) {
      tweets = splitLongTweets(tweets);
      modifications.push('split_long_tweets');
    }
  }
  
  // Step 4: Merge short tweets
  const tooShort = tweets.some((t, i) => t.length < minTweetLength && i < tweets.length - 1);
  if (tooShort) {
    tweets = mergeShortTweets(tweets, minTweetLength);
    modifications.push('merged_short_tweets');
  }
  
  // Step 5: Final validation
  const finalValidation = validateTweetLengths(tweets);
  
  return {
    content: tweets,
    isThread: true,
    metadata: {
      originalFormat: 'thread',
      modifications,
      tweetCount: tweets.length,
      validation: finalValidation,
      originalTweetCount: parsed.content.length
    }
  };
}
