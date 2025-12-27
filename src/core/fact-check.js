/**
 * fact-check.js - Fact-Checking and Research Validation
 *
 * Validates user claims using real-time web search before post generation.
 * Detects fact-check requests, researches claims, and suggests corrections.
 *
 * Core functions:
 * - detectFactCheckRequest() - Detect if user wants fact-checking (uses Claude for intent)
 * - extractClaims() - Extract factual claims from thought
 * - researchClaim() - Research a claim using WebSearch
 * - evaluateClaim() - Classify claim as verified/incorrect/partial
 * - generateCorrectedThought() - Rewrite thought with corrections
 */

import Anthropic from '@anthropic-ai/sdk';

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
 * Detect if user is requesting fact-checking
 *
 * Uses Claude API to understand user intent (not pattern matching).
 * Claude analyzes the full context to determine if fact-checking is requested.
 *
 * @param {string} thought - User's thought/idea
 * @returns {Promise<object>} - { needsFactCheck: boolean, confidence: number, reasoning: string }
 */
export async function detectFactCheckRequest(thought) {
  if (!thought || typeof thought !== 'string' || thought.trim().length === 0) {
    return {
      needsFactCheck: false,
      confidence: 0,
      reasoning: 'Empty or invalid input'
    };
  }

  const client = initializeClient();

  const prompt = `Analyze this user input and determine if they are requesting fact-checking or research validation.

User input: "${thought}"

Look for:
- Explicit requests to verify facts (e.g., "validate this", "is this true", "check if correct")
- Requests to research or look up information
- Uncertainty about factual claims that needs verification
- Requests to check claims against external sources (like Internet, web, online)

Respond ONLY with valid JSON in this exact format:
{
  "needsFactCheck": true,
  "confidence": 0.95,
  "reasoning": "User explicitly requested validation with 'Can you validate this on Internet'"
}

OR if no fact-checking requested:
{
  "needsFactCheck": false,
  "confidence": 0.1,
  "reasoning": "User is just sharing a thought/opinion without requesting verification"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 200,
      temperature: 0, // Deterministic for classification
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse Claude's response
    const content = response.content[0].text.trim();

    // Extract JSON from response (handle markdown code blocks if present)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      needsFactCheck: result.needsFactCheck || false,
      confidence: result.confidence || 0,
      reasoning: result.reasoning || 'No reasoning provided'
    };

  } catch (error) {
    console.error('Error detecting fact-check request:', error.message);

    // Fallback: don't block user, assume no fact-checking needed
    return {
      needsFactCheck: false,
      confidence: 0,
      reasoning: `Detection failed: ${error.message}`
    };
  }
}

/**
 * Extract factual claims from user's thought
 *
 * Uses Claude to intelligently identify claims that can be verified.
 * Separates factual claims from opinions and subjective statements.
 *
 * @param {string} thought - User's thought/idea
 * @returns {Promise<Array>} - Array of claims with metadata
 */
export async function extractClaims(thought) {
  if (!thought || typeof thought !== 'string' || thought.trim().length === 0) {
    return [];
  }

  const client = initializeClient();

  const prompt = `Extract all factual claims that can be verified from this text. Focus on claims that can be checked against external sources.

User's text: "${thought}"

Distinguish between:
1. **Factual claims** - Statements about dates, versions, product features, technical specs, events that can be objectively verified
2. **Opinions** - Subjective statements (e.g., "X is the best", "I like Y") - EXCLUDE these
3. **Implicit claims** - Assumptions or implied facts that can be checked

For each factual claim, identify:
- The exact claim text
- Type: "date_fact", "product_feature", "technical_spec", "version_fact", "event_fact", "general_fact"
- Importance: "high" (core to the message), "medium", or "low"
- Context: brief context of what this claim is about

Respond ONLY with valid JSON array:
[
  {
    "claim": "React 19 was released in December 2024",
    "type": "date_fact",
    "importance": "high",
    "context": "product release date"
  },
  {
    "claim": "Claude Code improved context management in recent releases",
    "type": "product_feature",
    "importance": "high",
    "context": "feature improvement claim"
  }
]

If there are NO factual claims to verify (only opinions), return empty array: []`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 0, // Deterministic extraction
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse Claude's response
    const content = response.content[0].text.trim();

    // Extract JSON array from response (handle markdown code blocks if present)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // No claims found or invalid response
      return [];
    }

    const claims = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(claims)) {
      throw new Error('Response is not an array');
    }

    // Filter out invalid claims
    const validClaims = claims.filter(claim =>
      claim.claim &&
      claim.type &&
      claim.importance &&
      claim.context
    );

    return validClaims;

  } catch (error) {
    console.error('Error extracting claims:', error.message);
    return []; // Return empty array on error - don't block user
  }
}

/**
 * Build an optimized search query for a claim
 *
 * Creates a search query optimized for verification.
 * Adds context like year for date-sensitive claims.
 *
 * @param {object} claim - Claim object with { claim, type, context }
 * @returns {string} - Optimized search query
 */
export function buildSearchQuery(claim) {
  const currentYear = new Date().getFullYear();
  let query = claim.claim;

  // Add year for date-sensitive claims
  if (claim.type === 'date_fact' || claim.type === 'event_fact') {
    query += ` ${currentYear}`;
  }

  // Add context for product/version claims
  if (claim.type === 'product_feature' || claim.type === 'version_fact') {
    query += ' official release notes';
  }

  // Add "fact check" for general claims
  if (claim.type === 'general_fact') {
    query += ' fact check';
  }

  return query;
}

/**
 * Research a claim using web search
 *
 * NOTE: This function returns the search query. The actual WebSearch
 * must be performed by Claude Code CLI integration, as WebSearch is
 * a tool only available during Claude Code execution, not a JS function.
 *
 * @param {object} claim - Claim object with { claim, type, importance, context }
 * @returns {object} - { claim, searchQuery }
 */
export function prepareClaimForResearch(claim) {
  const searchQuery = buildSearchQuery(claim);

  return {
    claim: claim.claim,
    type: claim.type,
    importance: claim.importance,
    context: claim.context,
    searchQuery
  };
}

/**
 * Evaluate a claim using Claude's knowledge (no web search)
 *
 * Uses Claude API to verify claims based on its training data.
 * This is faster but limited to Claude's knowledge cutoff.
 *
 * @param {object} claim - Claim object with { claim, type, context }
 * @returns {Promise<object>} - Evaluation result
 */
export async function evaluateClaimWithKnowledge(claim) {
  if (!claim || !claim.claim) {
    return {
      claim: claim?.claim || 'Unknown claim',
      status: 'UNCLEAR',
      confidence: 0,
      explanation: 'Missing claim',
      sources: []
    };
  }

  const client = initializeClient();

  const prompt = `Verify this factual claim based on your knowledge.

Claim to verify: "${claim.claim}"
Claim type: ${claim.type}
Context: ${claim.context}

Based on your training data, is this claim:
1. VERIFIED - The claim is factually correct
2. INCORRECT - The claim contradicts known facts
3. PARTIALLY_CORRECT - The claim is mostly right but missing nuance or has minor errors
4. UNCLEAR - You don't have enough information to verify (e.g., too recent, too specific)

IMPORTANT:
- If the claim is about recent events (last few months) that you might not know about, return UNCLEAR
- Be honest about uncertainty - don't guess
- If incorrect or partially correct, provide the accurate information

Respond ONLY with valid JSON:
{
  "status": "VERIFIED",
  "confidence": 0.95,
  "correction": null,
  "explanation": "This claim is correct based on known release dates",
  "sources": []
}

OR for incorrect:
{
  "status": "INCORRECT",
  "confidence": 0.90,
  "correction": "React 19 was actually released in October 2024, not December",
  "explanation": "The release date is incorrect",
  "sources": []
}

OR for unclear:
{
  "status": "UNCLEAR",
  "confidence": 0.1,
  "correction": null,
  "explanation": "This claim is about very recent events that may be after my training cutoff",
  "sources": []
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 0,
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
      throw new Error('Could not parse JSON from evaluation response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      claim: claim.claim,
      status: result.status || 'UNCLEAR',
      confidence: result.confidence || 0,
      correction: result.correction || null,
      explanation: result.explanation || 'No explanation provided',
      sources: result.sources || []
    };

  } catch (error) {
    console.error('Error evaluating claim:', error.message);

    return {
      claim: claim.claim,
      status: 'UNCLEAR',
      confidence: 0,
      explanation: `Evaluation failed: ${error.message}`,
      sources: []
    };
  }
}

/**
 * Evaluate a claim against web search results
 *
 * Uses Claude to analyze search results and determine if claim is verified.
 * This function receives the WebSearch results from external integration.
 *
 * @param {object} claim - Claim object
 * @param {string} searchResults - Raw search results from WebSearch
 * @returns {Promise<object>} - Evaluation result
 */
export async function evaluateClaim(claim, searchResults) {
  if (!claim || !searchResults) {
    return {
      claim: claim?.claim || 'Unknown claim',
      status: 'UNCLEAR',
      confidence: 0,
      explanation: 'Missing claim or search results',
      sources: []
    };
  }

  const client = initializeClient();

  const prompt = `Evaluate this factual claim against web search results.

Claim to verify: "${claim.claim}"
Claim context: ${claim.context}

Web search results:
${searchResults}

Analyze the search results and determine:
1. Is the claim VERIFIED (matches search results)?
2. Is the claim INCORRECT (contradicts search results)?
3. Is the claim PARTIALLY_CORRECT (mostly right but missing nuance)?
4. Is the claim UNCLEAR (not enough information to verify)?

If the claim is incorrect or partially correct, provide the correction.

Respond ONLY with valid JSON:
{
  "status": "VERIFIED",
  "confidence": 0.95,
  "correction": null,
  "explanation": "Multiple sources confirm this claim",
  "sources": ["https://example.com/source1", "https://example.com/source2"]
}

OR for incorrect claim:
{
  "status": "INCORRECT",
  "confidence": 0.90,
  "correction": "The correct information is...",
  "explanation": "Search results show that...",
  "sources": ["https://example.com/source"]
}

Status options: "VERIFIED", "INCORRECT", "PARTIALLY_CORRECT", "UNCLEAR"`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 0,
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
      throw new Error('Could not parse JSON from evaluation response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      claim: claim.claim,
      status: result.status || 'UNCLEAR',
      confidence: result.confidence || 0,
      correction: result.correction || null,
      explanation: result.explanation || 'No explanation provided',
      sources: result.sources || []
    };

  } catch (error) {
    console.error('Error evaluating claim:', error.message);

    return {
      claim: claim.claim,
      status: 'UNCLEAR',
      confidence: 0,
      explanation: `Evaluation failed: ${error.message}`,
      sources: []
    };
  }
}

/**
 * Generate a corrected version of the user's thought
 *
 * Uses Claude to rewrite the thought with factual corrections,
 * while preserving the user's voice, tone, and style.
 *
 * @param {string} originalThought - User's original thought
 * @param {Array} evaluations - Array of claim evaluations
 * @returns {Promise<string>} - Corrected thought
 */
export async function generateCorrectedThought(originalThought, evaluations) {
  if (!originalThought || !evaluations || evaluations.length === 0) {
    return originalThought; // No corrections needed
  }

  // Filter for claims that need correction
  const needsCorrection = evaluations.filter(
    e => e.status === 'INCORRECT' || e.status === 'PARTIALLY_CORRECT'
  );

  if (needsCorrection.length === 0) {
    return originalThought; // All verified, no changes needed
  }

  const client = initializeClient();

  // Build corrections list
  const correctionsList = needsCorrection
    .map(e => `- "${e.claim}" → ${e.correction || e.explanation}`)
    .join('\n');

  const prompt = `Rewrite this thought with factual corrections while preserving the user's voice, tone, and style.

IMPORTANT: Only change the factually incorrect parts. Keep everything else EXACTLY the same - same wording, same tone, same style, same structure.

Original thought:
"${originalThought}"

Factual corrections needed:
${correctionsList}

Instructions:
1. Replace ONLY the incorrect facts with corrected versions
2. Keep the user's original voice, tone, and casual/formal style
3. Maintain the same sentence structure where possible
4. Don't add new information beyond the corrections
5. Don't make it sound more formal or polished - keep it authentic

Respond with ONLY the corrected thought text, no explanations or meta-commentary.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      temperature: 0.3, // Slight creativity for natural rewriting
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const correctedThought = response.content[0].text.trim();

    // Remove any quotes that Claude might have added
    return correctedThought.replace(/^["']|["']$/g, '');

  } catch (error) {
    console.error('Error generating corrected thought:', error.message);
    return originalThought; // Fallback to original on error
  }
}
