/**
 * generator.js - AI Post Generation using Claude API
 *
 * Core engine that transforms thoughts into platform-specific,
 * human-feeling social media posts.
 *
 * Uses:
 * - Claude API for generation
 * - Templates as inspiration (not rigid rules)
 * - Humanization rules to avoid AI detection
 * - User's past posts to learn their voice
 */

import Anthropic from '@anthropic-ai/sdk';
import { getTemplatesAsInspiration, getPlatformGuidelines } from './templates.js';
import { getHumanizationPrompt, validateHumanFeel } from './humanize.js';
import { getHistory } from './storage.js';
import { optimizeThread } from './thread-optimizer.js';

// Initialize Claude API client
let anthropic;

/**
 * Initialize the Anthropic client
 * @throws {Error} if ANTHROPIC_API_KEY is not set
 */
function initializeClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

/**
 * Load user's voice from past approved posts
 * Analyzes recent published posts to understand writing style
 * @param {number} limit - Number of recent posts to analyze (default: 5)
 * @returns {Promise<string>} - Formatted voice examples
 */
async function getUserVoice(limit = 5) {
  try {
    const history = await getHistory(limit);
    const publishedPosts = history.filter(item => item.status === 'published');

    if (publishedPosts.length === 0) {
      return 'No past posts available yet. Generate in a professional but authentic voice.';
    }

    let voiceExamples = `Here are ${publishedPosts.length} examples of the user's past posts to match their voice:\n\n`;

    publishedPosts.forEach((post, index) => {
      voiceExamples += `Example ${index + 1}:\n`;

      // Include Twitter version if available
      if (post.content?.twitter) {
        voiceExamples += `Twitter: ${post.content.twitter}\n`;
      }

      // Include LinkedIn version if available
      if (post.content?.linkedin) {
        voiceExamples += `LinkedIn: ${post.content.linkedin.substring(0, 300)}...\n`;
      }

      voiceExamples += '\n';
    });

    voiceExamples += 'IMPORTANT: Match this user\'s voice, tone, and style. Notice:\n';
    voiceExamples += '- How they structure their thoughts\n';
    voiceExamples += '- Their level of formality/casualness\n';
    voiceExamples += '- How they use examples and specifics\n';
    voiceExamples += '- Their natural rhythm and pacing\n';

    return voiceExamples;
  } catch (error) {
    // Silently fall back - first-time users won't have voice history yet
    return 'No past posts available. Generate in a professional but authentic voice.';
  }
}

/**
 * Build the system prompt for Claude
 * @param {string} platform - 'twitter' or 'linkedin'
 * @returns {Promise<string>} - Complete system prompt
 */
async function buildSystemPrompt(platform) {
  const templateInspiration = await getTemplatesAsInspiration(platform);
  const platformGuidelines = getPlatformGuidelines(platform);
  const humanizationRules = getHumanizationPrompt(platform);

  // Add thread-specific instructions for Twitter
  let threadInstructions = '';
  if (platform === 'twitter' && platformGuidelines.threadGuidelines) {
    threadInstructions = `

CRITICAL THREAD FORMATTING RULES:

When the thought requires a thread (>200 chars of content):

1. **Content Density Principle**: MAXIMIZE content per tweet
   - Use 200-280 characters per tweet (don't waste space)
   - Combine related sentences in the same tweet
   - Only break for: (a) approaching 280 chars, (b) natural cliffhanger, (c) major topic shift
   - NEVER create tweets under 100 chars unless it's a deliberate punch line

2. **Output Format**: Return a JSON array of tweet strings, NOT a long text with \\n\\n separators

   CORRECT format:
   ["Hook tweet with full context and setup...", "Continuation with meaty content...", "CTA"]

   WRONG format:
   "Hook tweet...\\n\\nContinuation...\\n\\nCTA"

3. **Target Length**: ${platformGuidelines.threadGuidelines.optimalLength}
   - Fewer, dense tweets > many short tweets
   - Don't pad to hit a specific count
   - Quality and narrative flow matter more than quantity

4. **Narrative Structure**:
   - Tweet 1: Strong hook + context (${platformGuidelines.threadGuidelines.hooks.patterns[0]})
   - Middle tweets: Build tension, combine related points, strategic cliffhangers
   - Final tweet: Resolution + CTA (can be shorter if impactful)

5. **Cliffhanger Placement**:
   - Place cliffhangers ${platformGuidelines.threadGuidelines.cliffhangers.frequency}
   - End tweets at narrative peaks, NOT mechanical paragraph breaks
   - Examples: ${JSON.stringify(platformGuidelines.threadGuidelines.cliffhangers.techniques)}

6. **Bad Examples** (what NOT to do):
   - ❌ "Then something shifted." (48 chars) - Too short, combine with next tweet
   - ❌ "Still not sure if perfect." (67 chars) - Too short, merge with previous
   - ✅ "Then something shifted. Claude Code now handles this automatically." (124 chars) - Better

For single tweets (<200 chars of content):
- Return a simple string (not array)
- Make it punchy and complete

REMEMBER: Your job is narrative engineering AND content density. Don't waste the 280-char limit.
`;
  }

  return `You are an expert social media content creator specializing in ${platform.toUpperCase()} posts.

Your job is to transform the user's thought into an engaging ${platform} post that:
1. Feels genuinely HUMAN (not AI-generated)
2. Matches the user's authentic voice
3. Is optimized for ${platform}'s format and audience
4. Drives engagement

${humanizationRules}

LENGTH CONTROL - CRITICAL:
Your output length should match the user's input intent. DO NOT over-expand short thoughts.

- Input <150 chars: Keep output concise. Single tweet (200-280 chars) preferred. Don't add unnecessary elaboration.
- Input 150-300 chars: 2-3 tweets max. Stay focused on the core point.
- Input 300-500 chars: 3-5 tweets. Moderate expansion is OK if it adds value.
- Input 500+ chars: Full thread (5-8 tweets). This is where you can elaborate and build narrative.

The user gave you their complete thought. Your job is to format/enhance it, NOT to write a dissertation on it.
If they wanted more content, they would have written more.

PLATFORM GUIDELINES (${platform.toUpperCase()}):
${JSON.stringify(platformGuidelines, null, 2)}

${threadInstructions}

${templateInspiration}

Remember: Your goal is to create content that sounds like it came from a real person sharing authentic thoughts, not a marketing bot or AI assistant.`;
}

/**
 * Build the user prompt for a specific thought
 * @param {string} thought - The user's thought/idea
 * @param {string} userVoice - Examples of user's past posts
 * @returns {string} - User prompt for Claude
 */
function buildUserPrompt(thought, userVoice) {
  // Determine length guidance based on input
  const inputLength = thought.length;
  let lengthGuidance = '';
  
  if (inputLength < 150) {
    lengthGuidance = 'This is a SHORT thought. Keep output concise - ideally a single punchy tweet (200-280 chars). Do NOT elaborate or add unnecessary context.';
  } else if (inputLength < 300) {
    lengthGuidance = 'This is a MEDIUM thought. Output should be 2-3 tweets max. Stay focused on the core point.';
  } else if (inputLength < 500) {
    lengthGuidance = 'This is a SUBSTANTIAL thought. A thread of 3-5 tweets is appropriate.';
  } else {
    lengthGuidance = 'This is a LONG thought. A full thread (5-8 tweets) is appropriate to do it justice.';
  }
  
  return `${userVoice}

USER'S THOUGHT (${inputLength} chars):
"${thought}"

${lengthGuidance}

Generate the post. Make it:
- Engaging and authentic
- True to the user's voice (see examples above)
- Platform-appropriate
- Human-feeling (no AI tells)

Return ONLY the post content, no explanations or meta-commentary.`;
}

/**
 * Generate a post for a specific platform
 * @param {string} thought - The user's thought/idea
 * @param {string} platform - 'twitter' or 'linkedin'
 * @param {object} options - Additional options
 * @returns {Promise<object>} - { content: string, validation: object }
 */
async function generateForPlatform(thought, platform, options = {}) {
  const client = initializeClient();

  // Load user's voice from past posts
  const userVoice = await getUserVoice(options.voiceLimit || 5);

  // Build prompts
  const systemPrompt = await buildSystemPrompt(platform);
  const userPrompt = buildUserPrompt(thought, userVoice);

  try {
    // Call Claude API
    const response = await client.messages.create({
      model: options.model || 'claude-opus-4-5-20251101',
      max_tokens: platform === 'twitter' ? 1000 : 2000,
      temperature: 0.7, // Some creativity, but not too wild
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    // Extract content
    let rawContent = response.content[0].text.trim();

    // For Twitter: Use thread optimizer to parse and validate
    let content;
    let isThread = false;
    let optimizationMetadata = {};

    if (platform === 'twitter') {
      const optimized = optimizeThread(rawContent, {
        minTweetLength: 100,
        maxTweetLength: 280,
        autoCompress: true
      });
      
      content = optimized.content;
      isThread = optimized.isThread;
      optimizationMetadata = optimized.metadata;
    } else {
      // LinkedIn always uses string format
      content = rawContent;
    }

    // Validate human feel
    // For threads, validate the first tweet (most important for hook)
    const contentToValidate = isThread ? content[0] : content;
    const validation = validateHumanFeel(contentToValidate, platform);

    return {
      content,
      validation,
      isThread,
      metadata: {
        model: response.model,
        usage: response.usage,
        tweetCount: isThread ? content.length : 1,
        optimization: optimizationMetadata // Include optimization details
      }
    };
  } catch (error) {
    throw new Error(`Failed to generate ${platform} post: ${error.message}`);
  }
}

/**
 * Generate posts for multiple platforms
 * Main function for post generation
 *
 * @param {string} thought - The user's thought/idea
 * @param {object} options - Generation options
 * @param {string[]} options.platforms - Platforms to generate for (default: ['twitter', 'linkedin'])
 * @param {string} options.model - Claude model to use (default: opus-4-5)
 * @param {number} options.voiceLimit - Number of past posts to analyze (default: 5)
 * @returns {Promise<object>} - { twitter?: {...}, linkedin?: {...} }
 */
export async function generatePost(thought, options = {}) {
  if (!thought || typeof thought !== 'string' || thought.trim().length === 0) {
    throw new Error('Thought is required and must be a non-empty string');
  }

  const platforms = options.platforms || ['twitter', 'linkedin'];
  const results = {};

  // Generate for each platform in parallel
  const generations = platforms.map(async (platform) => {
    try {
      const result = await generateForPlatform(thought, platform, options);
      return { platform, result };
    } catch (error) {
      console.error(`Error generating for ${platform}:`, error);
      return {
        platform,
        result: {
          content: null,
          error: error.message,
          validation: { passes: false, score: 0, feedback: [error.message] }
        }
      };
    }
  });

  const generatedPosts = await Promise.all(generations);

  // Organize results by platform
  generatedPosts.forEach(({ platform, result }) => {
    results[platform] = result;
  });

  return results;
}

/**
 * Refine an existing draft based on user feedback
 *
 * @param {string} draft - The current draft
 * @param {string} feedback - User's feedback (e.g., "make it shorter", "more technical")
 * @param {string} platform - 'twitter' or 'linkedin'
 * @param {object} options - Additional options
 * @returns {Promise<object>} - { content: string, validation: object }
 */
export async function refinePost(draft, feedback, platform, options = {}) {
  if (!draft || !feedback || !platform) {
    throw new Error('Draft, feedback, and platform are required');
  }

  const client = initializeClient();
  const systemPrompt = await buildSystemPrompt(platform);
  const humanizationRules = getHumanizationPrompt(platform);

  // Detect if the input draft is a thread (JSON array)
  const isThreadDraft = Array.isArray(draft) ||
    (typeof draft === 'string' && draft.trim().startsWith('[') && draft.trim().endsWith(']'));

  // Add format instruction for Twitter threads
  const formatInstruction = isThreadDraft && platform === 'twitter'
    ? `\n\nIMPORTANT FORMAT REQUIREMENT: The draft is a Twitter thread (JSON array of tweets). You MUST return your revision in the EXACT same format as a JSON array:
["revised tweet 1", "revised tweet 2", ...]

Do NOT return plain text with paragraph breaks. Return a valid JSON array of tweet strings.`
    : '';

  const userPrompt = `Here is the current draft:

"${draft}"

USER FEEDBACK: ${feedback}

Revise the post based on this feedback while:
1. Maintaining the human feel (no AI tells)
2. Keeping the core message
3. Following platform guidelines
4. Staying true to the user's voice${formatInstruction}

${humanizationRules}

Return ONLY the revised post, no explanations.`;

  try {
    const response = await client.messages.create({
      model: options.model || 'claude-opus-4-5-20251101',
      max_tokens: platform === 'twitter' ? 1000 : 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const refinedContent = response.content[0].text.trim();

    // For Twitter: Use thread optimizer to parse and validate
    let content;
    let isThread = false;
    let optimizationMetadata = {};

    if (platform === 'twitter') {
      const optimized = optimizeThread(refinedContent, {
        minTweetLength: 100,
        maxTweetLength: 280,
        autoCompress: true
      });
      
      content = optimized.content;
      isThread = optimized.isThread;
      optimizationMetadata = optimized.metadata;
    } else {
      // LinkedIn always uses string format
      content = refinedContent;
    }

    const validation = validateHumanFeel(
      Array.isArray(content) ? content.join(' ') : content,
      platform
    );

    return {
      content,
      isThread,
      validation,
      metadata: {
        model: response.model,
        usage: response.usage,
        refinedFrom: draft,
        optimization: optimizationMetadata
      }
    };
  } catch (error) {
    throw new Error(`Failed to refine ${platform} post: ${error.message}`);
  }
}

/**
 * Quick refinement shortcuts for common feedback
 * @param {string} draft - The current draft
 * @param {string} action - 'shorter', 'longer', 'more_technical', 'less_technical', 'more_casual', 'more_professional'
 * @param {string} platform - 'twitter' or 'linkedin'
 * @returns {Promise<object>} - Refined post
 */
export async function quickRefine(draft, action, platform) {
  const feedbackMap = {
    shorter: 'Make this significantly shorter while keeping the core message. Cut at least 30%.',
    longer: 'Expand this with more details, examples, or context.',
    more_technical: 'Add more technical depth and specific implementation details.',
    less_technical: 'Simplify the technical aspects, make it accessible to non-technical readers.',
    more_casual: 'Make the tone more casual and conversational, like talking to a friend.',
    more_professional: 'Make the tone more professional while staying authentic.',
    spicier: 'Make this more bold and controversial. Add a stronger opinion or hot take.',
    safer: 'Tone down any controversial elements, make it more balanced and diplomatic.'
  };

  const feedback = feedbackMap[action];
  if (!feedback) {
    throw new Error(`Unknown action: ${action}. Available: ${Object.keys(feedbackMap).join(', ')}`);
  }

  return refinePost(draft, feedback, platform);
}

/**
 * Batch generate variations of a post
 * Useful for giving user multiple options to choose from
 *
 * @param {string} thought - The user's thought
 * @param {string} platform - 'twitter' or 'linkedin'
 * @param {number} count - Number of variations (default: 3, max: 5)
 * @returns {Promise<Array>} - Array of generated variations
 */
export async function generateVariations(thought, platform, count = 3) {
  if (count > 5) {
    throw new Error('Maximum 5 variations allowed');
  }

  const variations = [];

  for (let i = 0; i < count; i++) {
    try {
      const result = await generateForPlatform(thought, platform, {
        temperature: 0.7 + (i * 0.1) // Slight temperature variation for diversity
      });
      variations.push({
        version: i + 1,
        ...result
      });
    } catch (error) {
      console.error(`Failed to generate variation ${i + 1}:`, error);
    }
  }

  return variations;
}

/**
 * Parse user instruction to determine which platform(s) to modify
 *
 * Uses Claude to intelligently detect which platform(s) the user wants to modify
 * and cleans up the instruction by removing platform-specific preambles.
 *
 * @param {string} instruction - User's custom instruction
 * @param {Array<string>} availablePlatforms - Platforms to choose from (e.g., ['twitter', 'linkedin'])
 * @returns {Promise<object>} - { platforms: string[], cleanedInstruction: string }
 */
export async function parsePlatformIntent(instruction, availablePlatforms) {
  if (!instruction || !availablePlatforms || availablePlatforms.length === 0) {
    return {
      platforms: availablePlatforms || [],
      cleanedInstruction: instruction || ''
    };
  }

  const client = initializeClient();

  const prompt = `Parse this user instruction to determine which platform(s) they want to modify.

Available platforms: ${availablePlatforms.join(', ')}

User instruction: "${instruction}"

Determine:
1. Which platform(s) should be modified? Look for mentions of platform names, or if no specific platform is mentioned, assume ALL platforms.
2. Remove platform-specific preambles from the instruction (like "LinkedIn post seems fine" or "Twitter is good")

Examples:
- "LinkedIn post seems fine. Make Twitter post shorter" → platforms: ["twitter"], instruction: "Make it shorter"
- "Make both posts more technical" → platforms: ["twitter", "linkedin"], instruction: "Make it more technical"
- "Add this link: https://..." → platforms: ["twitter", "linkedin"], instruction: "Add this link: https://..." (no platform mentioned = all)
- "Only the X post should be spicier" → platforms: ["twitter"], instruction: "Make it spicier"
- "Just update LinkedIn to mention React" → platforms: ["linkedin"], instruction: "Mention React"

Platform name variations:
- "Twitter" or "X" or "Twitter/X" → twitter
- "LinkedIn" or "LI" → linkedin

Respond ONLY with valid JSON:
{
  "platforms": ["twitter"],
  "cleanedInstruction": "Make it shorter"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 200,
      temperature: 0, // Deterministic for parsing
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0].text.trim();

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from platform intent response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and normalize platform names
    const normalizedPlatforms = (result.platforms || availablePlatforms)
      .map(p => p.toLowerCase())
      .filter(p => availablePlatforms.includes(p));

    // If no valid platforms found, default to all
    const finalPlatforms = normalizedPlatforms.length > 0
      ? normalizedPlatforms
      : availablePlatforms;

    return {
      platforms: finalPlatforms,
      cleanedInstruction: result.cleanedInstruction || instruction
    };

  } catch (error) {
    console.error('Error parsing platform intent:', error.message);

    // Fallback: apply to all platforms
    return {
      platforms: availablePlatforms,
      cleanedInstruction: instruction
    };
  }
}
