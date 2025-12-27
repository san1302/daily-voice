/**
 * humanize.js - AI Detection Avoidance Rules
 *
 * Research finding: 54% of LinkedIn posts are AI-generated and easily detectable.
 * This module contains rules to make AI-generated content feel genuinely human.
 *
 * Based on research of AI detection patterns and human writing best practices.
 */

// ❌ FORBIDDEN WORDS - Instant AI tells (10x more common in AI writing)
export const FORBIDDEN_WORDS = [
  'delve',
  'foster',
  'transformative',
  'harness',
  'leverage',
  'streamline',
  'optimize',
  'enhance',
  'unpack',
  'utilize',
  'realm',
  'meticulously',
  'navigate',
  'ever-evolving',
  'landscape',
  'groundbreaking',
  'cutting-edge',
  'revolutionary',
  'game-changing',
  'empower',
  'synergy',
  'paradigm',
  'robust',
  'comprehensive',
  'holistic',
  'seamless',
  'innovative',
  'dynamic',
  'strategic',
  'facilitate'
];

// ❌ FORBIDDEN PHRASES - Robotic crutch phrases
export const FORBIDDEN_PHRASES = [
  "in today's fast-paced world",
  "in today's digital age",
  "in an ever-evolving landscape",
  "it's important to note",
  "it is worth noting",
  "in conclusion",
  "in summary",
  "all things considered",
  "moving forward",
  "embrace the future",
  "as previously mentioned",
  "studies have shown",
  "it is evident that",
  "essentially",
  "in essence",
  "let's delve into",
  "provide a valuable insight",
  "left an indelible mark",
  "play a significant role in shaping",
  "furthermore",
  "moreover",
  "in addition",
  "one can argue that",
  "it goes without saying",
  "at the end of the day",
  "think of it as",
  "the fact of the matter is"
];

// ✅ HUMAN WRITING RULES - What makes content feel authentic
export const HUMAN_WRITING_RULES = {
  voice: {
    person: 'first-person',
    description: 'Use "I", "we", "my" - not "one should" or "users can"',
    examples: {
      good: "I spent 3 hours debugging this",
      bad: "One should allocate time for debugging"
    }
  },

  contractions: {
    required: true,
    description: 'Always use contractions - they\'re natural',
    examples: {
      good: "don't, can't, won't, I'm, it's",
      bad: "do not, cannot, will not, I am, it is"
    }
  },

  sentenceVariety: {
    required: true,
    description: 'Mix very short and longer sentences (creates "burstiness")',
    examples: {
      good: "I failed. Spent 6 hours on it. Turns out the issue was a typo in line 47, where I'd written 'calcualte' instead of 'calculate'.",
      bad: "I experienced a failure. I invested six hours into the problem. It turned out that the issue was a typographical error."
    }
  },

  opening: {
    style: 'specific story or concrete example',
    description: 'Start with a real moment, not abstract concepts',
    examples: {
      good: "I deleted production database last Tuesday at 3pm.",
      bad: "In today's world, database management is crucial for organizations."
    }
  },

  specificity: {
    required: true,
    description: 'Use real numbers, names, details - no vague generalities',
    examples: {
      good: "47 slides, 8 hours, 3 specific companies",
      bad: "many slides, significant time, several organizations"
    }
  },

  activeVoice: {
    required: true,
    description: 'Active voice, not passive',
    examples: {
      good: "I broke the build",
      bad: "The build was broken"
    }
  },

  emojis: {
    maxPerPost: 2,
    forbidden: 'emoji bookends (🚀 Title 🚀)',
    description: 'Minimal, natural emoji use - not decorative',
    examples: {
      good: "Just discovered this 🤯",
      bad: "🚀 Exciting News! 🚀"
    }
  },

  ending: {
    style: 'question',
    description: 'End with a question to spark engagement',
    examples: {
      good: "Anyone else learned this the hard way?",
      bad: "This concludes our discussion on the topic."
    }
  },

  tone: {
    style: 'conversational',
    description: 'Write like you talk - would you say this out loud?',
    test: 'Read it aloud. If it sounds weird, rewrite it.'
  }
};

// Platform-specific guidelines
export const PLATFORM_RULES = {
  twitter: {
    maxLength: 280,
    threadFormat: true,
    tone: 'punchy, conversational, sometimes sarcastic',
    avoid: 'long paragraphs, corporate speak',
    examples: {
      good: "spent 6 hours debugging\n\nthe function was named 'calcualte'\n\nhire me",
      bad: "In today's development landscape, debugging efficiency is paramount..."
    }
  },

  linkedin: {
    maxLength: 3000,
    firstTwoLines: 'CRITICAL - must hook immediately',
    paragraphLength: '2-3 lines max',
    tone: 'professional but authentic, storytelling',
    formatting: {
      useBold: true,
      useLineBreaks: true,
      avoid: 'walls of text'
    },
    examples: {
      good: "I screwed up a client pitch last week.\n\nSpent 3 days building the 'perfect' deck. 47 slides...",
      bad: "🚀 Exciting Update! 🚀\n\nIn today's fast-paced business landscape, it's important to note..."
    }
  }
};

/**
 * Check if text contains forbidden words or phrases
 * @param {string} text - The text to check
 * @returns {object} - { isClean: boolean, violations: string[] }
 */
export function checkForAITells(text) {
  const violations = [];
  const lowerText = text.toLowerCase();

  // Check forbidden words
  FORBIDDEN_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(text)) {
      violations.push(`Forbidden word: "${word}"`);
    }
  });

  // Check forbidden phrases
  FORBIDDEN_PHRASES.forEach(phrase => {
    if (lowerText.includes(phrase.toLowerCase())) {
      violations.push(`Forbidden phrase: "${phrase}"`);
    }
  });

  // Check for emoji bookends (🚀 Title 🚀 pattern)
  const emojiBookendPattern = /^[\p{Emoji}].*[\p{Emoji}]$/u;
  const firstLine = text.split('\n')[0];
  if (emojiBookendPattern.test(firstLine.trim())) {
    violations.push('Emoji bookends detected (🚀 Title 🚀)');
  }

  return {
    isClean: violations.length === 0,
    violations
  };
}

/**
 * Get prompting instructions for Claude to generate human-feeling content
 * @param {string} platform - 'twitter' or 'linkedin'
 * @returns {string} - Instructions to include in Claude prompt
 */
export function getHumanizationPrompt(platform = 'linkedin') {
  const platformRules = PLATFORM_RULES[platform] || PLATFORM_RULES.linkedin;

  return `
CRITICAL RULES - You must follow these to avoid AI detection:

VOICE & STYLE:
- Write in first-person with contractions (I'm, don't, can't, won't)
- Use active voice, not passive
- Sound conversational - like you're talking to a friend
- Would you say this out loud? If not, rewrite it.

SENTENCE STRUCTURE:
- Vary sentence length dramatically (mix very short and longer sentences)
- Short sentences: 3-5 words. Long sentences: 15-25 words.
- Example: "I failed. Spent 6 hours on it. Turns out the issue was a typo in line 47."

OPENING:
- Start with a specific story, moment, or concrete example
- NOT abstract concepts or generic statements
- Good: "I deleted production database last Tuesday at 3pm."
- Bad: "In today's world, database management is important."

SPECIFICITY:
- Use real numbers, names, specific details
- NOT vague generalities like "many," "several," "various"
- Good: "47 slides, 8 hours, 3 companies"
- Bad: "many slides, significant time, several organizations"

FORBIDDEN WORDS (NEVER use these):
${FORBIDDEN_WORDS.join(', ')}

FORBIDDEN PHRASES (NEVER use these):
${FORBIDDEN_PHRASES.slice(0, 10).join(', ')}, and similar corporate buzzwords

EMOJIS:
- Maximum 2 emojis per post
- NEVER use emoji bookends (🚀 Title 🚀)
- Use naturally, not decoratively

ENDING:
- End with a question to spark engagement
- NOT "in conclusion" or similar

PLATFORM-SPECIFIC (${platform}):
${platform === 'twitter'
  ? '- Punchy, conversational tone\n- Short sentences\n- Can be sarcastic or witty\n- Thread format if needed'
  : '- Professional but authentic\n- Paragraph breaks every 2-3 lines\n- First 2 lines CRITICAL (must hook)\n- Use **bold** for emphasis\n- Storytelling approach'
}

FINAL CHECK:
- Does this sound like a real person wrote it?
- Would I say this out loud?
- No corporate buzzwords or AI tells?
`;
}

/**
 * Validate a generated post for human feel
 * @param {string} text - The generated post
 * @param {string} platform - 'twitter' or 'linkedin'
 * @returns {object} - { passes: boolean, score: number, feedback: string[] }
 */
export function validateHumanFeel(text, platform = 'linkedin') {
  const feedback = [];
  let score = 100;

  // Check for AI tells
  const { isClean, violations } = checkForAITells(text);
  if (!isClean) {
    score -= violations.length * 15;
    feedback.push(...violations);
  }

  // Check for contractions
  const hasContractions = /\b(don't|can't|won't|I'm|it's|we're|they're|isn't|aren't)\b/i.test(text);
  if (!hasContractions) {
    score -= 10;
    feedback.push('Missing contractions - add some for natural feel');
  }

  // Check for first-person voice
  const hasFirstPerson = /\b(I|my|we|our)\b/i.test(text);
  if (!hasFirstPerson) {
    score -= 15;
    feedback.push('Use first-person voice (I, my, we)');
  }

  // Check sentence variety (burstiness)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceLengths = sentences.map(s => s.split(' ').length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.some(len => Math.abs(len - avgLength) > 5);

  if (!variance && sentenceLengths.length > 3) {
    score -= 10;
    feedback.push('Vary sentence length (mix short and long sentences)');
  }

  // Platform-specific checks
  if (platform === 'linkedin') {
    const lines = text.split('\n').filter(l => l.trim());
    const firstLine = lines[0] || '';

    if (firstLine.length > 100) {
      score -= 10;
      feedback.push('LinkedIn: First line should be punchy (hook immediately)');
    }
  }

  return {
    passes: score >= 70,
    score,
    feedback: feedback.length > 0 ? feedback : ['Post feels human! ✅']
  };
}
