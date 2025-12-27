/**
 * templates.js - Template Loading and Management
 *
 * Templates are INSPIRATION, not rigid rules.
 * Claude uses these as examples of proven formats that work,
 * but can blend/adapt them to fit the user's thought naturally.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '../../data/templates');

/**
 * Load all templates for a specific platform
 * @param {string} platform - 'twitter' or 'linkedin'
 * @returns {Promise<Array>} - Array of template objects
 */
export async function loadTemplates(platform) {
  const filePath = path.join(TEMPLATES_DIR, `${platform}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    return data.templates || [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`No templates found for platform: ${platform}`);
      return [];
    }
    throw error;
  }
}

/**
 * Get a specific template by ID and platform
 * @param {string} platform - 'twitter' or 'linkedin'
 * @param {string} templateId - The template ID (e.g., 'contrarian_thread')
 * @returns {Promise<object|null>} - Template object or null if not found
 */
export async function getTemplate(platform, templateId) {
  const templates = await loadTemplates(platform);
  return templates.find(t => t.id === templateId) || null;
}

/**
 * Get all templates across all platforms
 * Used to give Claude a comprehensive view of what formats work
 * @returns {Promise<object>} - { twitter: [...], linkedin: [...] }
 */
export async function getAllTemplates() {
  const [twitter, linkedin] = await Promise.all([
    loadTemplates('twitter'),
    loadTemplates('linkedin')
  ]);

  return {
    twitter,
    linkedin
  };
}

/**
 * Format templates as inspiration text for Claude
 * Converts template JSON into human-readable examples
 * @param {string} platform - 'twitter' or 'linkedin'
 * @returns {Promise<string>} - Formatted template examples
 */
export async function getTemplatesAsInspiration(platform) {
  const templates = await loadTemplates(platform);

  if (templates.length === 0) {
    return 'No template examples available.';
  }

  let inspiration = `Here are ${templates.length} proven ${platform.toUpperCase()} post formats that work well:\n\n`;

  templates.forEach((template, index) => {
    inspiration += `${index + 1}. **${template.name}** (${template.type})\n`;
    inspiration += `   Use case: ${template.useCase}\n`;
    inspiration += `   Description: ${template.description}\n`;

    // Include structure if available
    if (template.structure) {
      inspiration += `   Structure:\n`;
      if (template.structure.hook) {
        inspiration += `   - Hook: ${template.structure.hook}\n`;
      }
      if (template.structure.pattern) {
        inspiration += `   - Pattern: ${template.structure.pattern.join(' → ')}\n`;
      }
      if (template.structure.sections) {
        inspiration += `   - Sections: ${template.structure.sections.join(' → ')}\n`;
      }
    }

    // Include example hooks
    if (template.hooks && template.hooks.length > 0) {
      inspiration += `   Example hooks: "${template.hooks[0]}"\n`;
    }

    // Include real examples
    if (template.examples && template.examples.length > 0) {
      inspiration += `   Example: "${template.examples[0]}"\n`;
    }

    inspiration += '\n';
  });

  inspiration += `\nIMPORTANT: Use these as INSPIRATION only. You can:\n`;
  inspiration += `- Blend multiple formats if it fits the thought better\n`;
  inspiration += `- Adapt the structure to match the user's voice\n`;
  inspiration += `- Create something unique if none of these feel right\n`;
  inspiration += `- The goal is engagement, not rigid format adherence\n`;

  return inspiration;
}

/**
 * Suggest which template(s) might work for a given thought
 * Note: This is a simple keyword-based suggestion.
 * In practice, Claude will make the final decision based on context.
 * @param {string} thought - The user's thought/idea
 * @param {string} platform - 'twitter' or 'linkedin'
 * @returns {Promise<Array>} - Array of suggested template IDs with reasoning
 */
export async function suggestTemplates(thought, platform) {
  const templates = await loadTemplates(platform);
  const suggestions = [];
  const lowerThought = thought.toLowerCase();

  // Simple keyword matching for initial suggestions
  // Claude will make the final decision
  templates.forEach(template => {
    let score = 0;
    let reasoning = [];

    // Check use case match
    const useCaseLower = template.useCase.toLowerCase();

    if (lowerThought.includes('wrong') || lowerThought.includes('overhyped') || lowerThought.includes('unpopular')) {
      if (template.id.includes('contrarian') || template.id.includes('opinion')) {
        score += 3;
        reasoning.push('sounds like a contrarian take');
      }
    }

    if (lowerThought.includes('how i') || lowerThought.includes('how to') || lowerThought.includes('steps')) {
      if (template.id.includes('how_to') || template.id.includes('problem_solution')) {
        score += 3;
        reasoning.push('instructional/how-to format fits');
      }
    }

    if (lowerThought.includes('tools') || lowerThought.includes('resources') || lowerThought.includes('stack')) {
      if (template.id.includes('tool') || template.id.includes('list')) {
        score += 3;
        reasoning.push('tool/resource list format works');
      }
    }

    if (lowerThought.includes('learned') || lowerThought.includes('discovered') || lowerThought.includes('TIL')) {
      if (template.id.includes('learning') || template.id.includes('personal_story')) {
        score += 3;
        reasoning.push('learning/insight sharing fits');
      }
    }

    if (lowerThought.includes('building') || lowerThought.includes('shipped') || lowerThought.includes('launched')) {
      if (template.id.includes('build_in_public') || template.id.includes('technical_breakdown')) {
        score += 3;
        reasoning.push('build in public / technical story');
      }
    }

    if (lowerThought.includes('problem') || lowerThought.includes('bug') || lowerThought.includes('fixed')) {
      if (template.id.includes('problem_solution') || template.id.includes('technical_breakdown')) {
        score += 3;
        reasoning.push('problem-solving story format');
      }
    }

    if (score > 0) {
      suggestions.push({
        templateId: template.id,
        templateName: template.name,
        score,
        reasoning: reasoning.join(', ')
      });
    }
  });

  // Sort by score (highest first)
  suggestions.sort((a, b) => b.score - a.score);

  // Return top 3 suggestions
  return suggestions.slice(0, 3);
}

/**
 * Get platform-specific formatting guidelines
 * @param {string} platform - 'twitter' or 'linkedin'
 * @returns {object} - Platform formatting rules
 */
export function getPlatformGuidelines(platform) {
  const guidelines = {
    twitter: {
      maxLength: 280,
      threadFormat: true,
      tone: 'punchy, conversational, witty',
      structure: 'Short sentences, thread if needed (1/, 2/, 3/)',
      hooks: 'Start strong - hook in first tweet',
      formatting: 'Line breaks for readability, minimal formatting',
      engagement: 'End with question or call to action',

      // Advanced thread structure guidelines
      threadGuidelines: {
        optimalLength: '4-7 tweets (fewer is better if content is dense)',
        pacing: 'Vary tweet lengths (short punchy + longer detailed) for rhythm',
        contentDensity: {
          principle: 'Maximize content per tweet. Fewer, meatier tweets > many short tweets',
          targetLength: '200-280 chars per tweet (use the full limit when possible)',
          minimumLength: 'Avoid tweets under 100 chars unless it\'s a punch line or final CTA',
          breakRules: [
            'Only create new tweet when approaching 280 chars',
            'OR at natural narrative climax/cliffhanger',
            'OR major topic shift',
            'Do NOT break just to hit a target tweet count'
          ]
        },
        hooks: {
          firstTweet: 'Strong hook in first 80-150 chars. Create curiosity or promise value.',
          patterns: [
            'Shock + Stat: "99% of people miss this..."',
            'Bold statement: "I spent 10 years learning X..."',
            'Story setup: "In 2019, I made a mistake that..."'
          ]
        },
        cliffhangers: {
          frequency: 'Every 2-3 tweets to maintain momentum',
          techniques: [
            'End mid-revelation: "Then something unexpected happened..."',
            'Tease next insight: "But here\'s where it gets interesting..."',
            'Question hook: "Want to know what changed everything?"',
            'Incomplete thought: "The solution? It wasn\'t what I expected..."'
          ]
        },
        structure: {
          narrative: 'Hook → Problem → Mini-cliffhanger → Process → Unexpected turn → Resolution → Lesson',
          pacing: 'Don\'t front-load insights. Save "aha" moments for middle tweets',
          rhythm: 'Vary between dense informational tweets and short punchy statements',
          ending: 'Soft CTA or engaging question (can be short if impactful)',
          density: 'Combine related ideas in single tweets. Don\'t artificially split content.'
        },
        formatting: {
          lineBreaks: 'Use sparingly within tweets. Each tweet should be focused.',
          emphasis: 'Avoid ALL CAPS. Use strong verbs instead.',
          numbers: 'List markers only if doing a listicle thread'
        }
      }
    },
    linkedin: {
      maxLength: 3000,
      paragraphLength: '2-3 lines max',
      tone: 'professional but authentic, storytelling',
      structure: 'Hook (first 2 lines) → Story → Insights → Question',
      hooks: 'First 2 lines CRITICAL - must grab attention immediately',
      formatting: 'Use **bold** for emphasis, line breaks between paragraphs',
      engagement: 'End with engaging question, ask for perspectives'
    }
  };

  return guidelines[platform] || guidelines.linkedin;
}
