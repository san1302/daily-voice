#!/usr/bin/env node

/**
 * post.js - CLI Interface for Daily Voice
 *
 * Simple interactive CLI for creating and posting social media content.
 * This is the tool you'll use daily until we build the mobile app.
 */

import 'dotenv/config';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { generatePost, quickRefine, refinePost, parsePlatformIntent } from '../../core/generator.js';
import { saveNote, savePost, loadPost, markAsPublished, loadAllDrafts } from '../../core/storage.js';
import { validateHumanFeel } from '../../core/humanize.js';
import {
  detectFactCheckRequest,
  extractClaims,
  evaluateClaimWithKnowledge,
  generateCorrectedThought
} from '../../core/fact-check.js';

console.log(chalk.bold.cyan('\n📝 Daily Voice - Transform Thoughts into Posts\n'));

/**
 * Display a generated post with formatting
 */
function displayPost(platform, content, validation, isThread = false) {
  const platformName = platform === 'twitter' ? 'Twitter' : 'LinkedIn';
  const emoji = platform === 'twitter' ? '🐦' : '💼';

  console.log(chalk.bold.blue(`\n${emoji} ${platformName.toUpperCase()} ${isThread ? 'THREAD' : 'POST'}:`));
  console.log(chalk.gray('─'.repeat(70)));

  // Handle both array (thread) and string (single tweet) formats
  if (Array.isArray(content)) {
    content.forEach((tweet, index) => {
      console.log(chalk.white(`${index + 1}. ${tweet}`));
      if (index < content.length - 1) {
        console.log(); // Add spacing between tweets
      }
    });
  } else {
    console.log(content);
  }

  console.log(chalk.gray('─'.repeat(70)));

  // Show validation score
  const scoreColor = validation.score >= 80 ? 'green' : validation.score >= 60 ? 'yellow' : 'red';
  console.log(chalk[scoreColor](`Human Score: ${validation.score}/100 ${validation.passes ? '✅' : '⚠️'}`));

  if (validation.feedback.length > 0 && !validation.passes) {
    console.log(chalk.yellow(`Feedback: ${validation.feedback.join(', ')}`));
  }
  console.log();
}

/**
 * Display fact-check results
 */
function displayFactCheckResults(evaluations) {
  console.log(chalk.cyan(`\nFound ${evaluations.length} claim(s) to verify:`));
  console.log(chalk.gray('━'.repeat(70)));

  evaluations.forEach((evaluation, index) => {
    const statusEmoji = {
      'VERIFIED': '✅',
      'INCORRECT': '⚠️',
      'PARTIALLY_CORRECT': '⚠️',
      'UNCLEAR': '❓'
    }[evaluation.status] || '❓';

    const statusColor = {
      'VERIFIED': 'green',
      'INCORRECT': 'red',
      'PARTIALLY_CORRECT': 'yellow',
      'UNCLEAR': 'gray'
    }[evaluation.status] || 'gray';

    console.log(chalk.bold(`\n${index + 1}. Claim: "${evaluation.claim}"`));
    console.log(chalk[statusColor](`   Status: ${statusEmoji} ${evaluation.status}`));
    console.log(chalk.white(`   ${evaluation.explanation}`));

    if (evaluation.correction) {
      console.log(chalk.cyan(`   Correction: ${evaluation.correction}`));
    }

    if (evaluation.sources && evaluation.sources.length > 0) {
      console.log(chalk.gray(`   Sources: ${evaluation.sources.slice(0, 2).join(', ')}`));
    }
  });

  console.log(chalk.gray('\n' + '━'.repeat(70)));
}

/**
 * Detect available text editor
 */
async function detectEditor() {
  // Check environment variables first
  if (process.env.EDITOR) return process.env.EDITOR;
  if (process.env.VISUAL) return process.env.VISUAL;

  // Try common editors
  const editors = ['code', 'cursor', 'nano', 'vim'];

  for (const editor of editors) {
    try {
      await new Promise((resolve, reject) => {
        const proc = spawn('which', [editor]);
        proc.on('exit', (code) => {
          if (code === 0) resolve();
          else reject();
        });
      });
      return editor;
    } catch {
      continue;
    }
  }

  // Default to nano (should always be available on macOS/Linux)
  return 'nano';
}

/**
 * Open a file in the detected editor and wait for it to close
 */
function openEditor(editor, filePath) {
  return new Promise((resolve, reject) => {
    const editorProcess = spawn(editor, [filePath], {
      stdio: 'inherit'
    });

    editorProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });

    editorProcess.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted date string
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Publish a draft post to specified platforms
 * @param {string} postId - The draft post ID
 * @param {Array<string>} platformsToPublish - Platforms to publish to (e.g., ['twitter'])
 */
async function publishPost(postId, platformsToPublish) {
  const spinner = ora('Publishing to Twitter...').start();

  try {
    // Load draft
    const draft = await loadPost(postId, 'draft');

    if (!draft) {
      spinner.fail('Draft not found');
      console.error(chalk.red(`Error: Draft ${postId} not found`));
      return;
    }

    // Publish to each platform
    for (const platform of platformsToPublish) {
      if (platform === 'twitter' && draft.content?.twitter) {
        const { publishToTwitter } = await import('../../adapters/publishers/twitter.js');
        const result = await publishToTwitter(draft.content.twitter);

        // Handle partial publish (thread failed mid-way)
        if (result.partial) {
          spinner.warn('Partial publish (thread failed mid-way)');
          console.log(chalk.yellow(`\n⚠️  Published ${result.data.tweets.length} of ${result.totalTweets} tweets`));
          console.log(chalk.yellow(`   Failed at tweet ${result.failedAt}`));
          console.log(chalk.red(`\n❌ Error: ${result.error}`));

          if (result.data.threadUrl) {
            console.log(chalk.blue(`\n🐦 View published tweets: ${result.data.threadUrl}`));
          }

          console.log(chalk.gray(`\nThe draft remains in data/drafts/ for retry or manual handling.`));

          // Mark as partial publish (stays in drafts)
          await markAsPublished(postId, 'twitter', result);
          return;
        }

        // Full success
        await markAsPublished(postId, 'twitter', result);

        spinner.succeed('Published to Twitter!');

        if (result.type === 'thread') {
          console.log(chalk.blue(`\n🐦 Thread posted: ${result.data.threadUrl}`));
          console.log(chalk.gray(`   ${result.data.tweets.length} tweets in thread`));
        } else {
          console.log(chalk.blue(`\n🐦 Tweet posted: ${result.data.tweetUrl}`));
        }

        console.log(chalk.green(`\n✅ Post moved to data/published/`));
      }
    }
  } catch (error) {
    spinner.fail('Publishing failed');
    console.error(chalk.red('\nError:'), error.message);
  }
}

/**
 * Publish an existing draft from the drafts folder
 */
async function publishExistingDraft() {
  // Load all drafts
  const drafts = await loadAllDrafts();

  if (drafts.length === 0) {
    console.log(chalk.yellow('\nNo drafts found. Create a post first!\n'));
    return;
  }

  // Show draft selection
  const { draftId } = await inquirer.prompt([{
    type: 'list',
    name: 'draftId',
    message: 'Select a draft to publish:',
    choices: drafts.map(d => ({
      name: `${d.id} - Created ${formatDate(d.timestamp)}`,
      value: d.id
    }))
  }]);

  // Load selected draft
  const draft = await loadPost(draftId, 'draft');

  if (!draft) {
    console.log(chalk.red('\nDraft not found!\n'));
    return;
  }

  // Show preview
  console.log(chalk.bold.blue('\n🐦 TWITTER POST:'));
  console.log(chalk.gray('─'.repeat(70)));

  if (Array.isArray(draft.content?.twitter)) {
    draft.content.twitter.forEach((tweet, i) => {
      console.log(chalk.white(`${i + 1}. ${tweet}`));
    });
  } else if (typeof draft.content?.twitter === 'string') {
    console.log(chalk.white(draft.content.twitter));
  } else {
    console.log(chalk.red('No Twitter content found in this draft'));
    return;
  }

  console.log(chalk.gray('─'.repeat(70) + '\n'));

  // Confirm
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: 'Publish this to Twitter?',
    default: true
  }]);

  if (confirm) {
    await publishPost(draftId, ['twitter']);
  } else {
    console.log(chalk.yellow('\n👋 Cancelled.\n'));
  }
}

/**
 * Main CLI flow
 */
async function main() {
  try {
    // Main menu
    const { mode } = await inquirer.prompt([{
      type: 'list',
      name: 'mode',
      message: 'What would you like to do?',
      choices: [
        { name: '📝 Create new post', value: 'create' },
        { name: '🚀 Publish existing draft', value: 'publish' },
        { name: '❌ Exit', value: 'exit' }
      ]
    }]);

    if (mode === 'exit') {
      console.log(chalk.yellow('\n👋 Goodbye!\n'));
      process.exit(0);
    }

    if (mode === 'publish') {
      await publishExistingDraft();
      return;
    }

    // mode === 'create' - Continue with post creation flow
    // Step 1: Get user's thought
    const { thought } = await inquirer.prompt([
      {
        type: 'input',
        name: 'thought',
        message: 'What\'s on your mind?',
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Please enter a thought or idea';
          }
          if (input.trim().length < 10) {
            return 'Please provide more context (at least 10 characters)';
          }
          return true;
        }
      }
    ]);

    // Save the thought as a note
    const note = await saveNote(thought, 'tech', ['post']);
    console.log(chalk.green(`\n✅ Note saved (ID: ${note.id})`));

    // NEW: Fact-check flow (if requested)
    let finalThought = thought;

    try {
      // Detect if user wants fact-checking
      const factCheckRequest = await detectFactCheckRequest(thought);

      if (factCheckRequest.needsFactCheck) {
        console.log(chalk.cyan('\n🔍 Fact-checking requested...'));
        console.log(chalk.gray(`   Reason: ${factCheckRequest.reasoning}\n`));

        const spinner = ora('Extracting claims...').start();

        // Extract claims
        const claims = await extractClaims(thought);

        if (claims.length === 0) {
          spinner.info('No specific factual claims found to verify.');
          console.log(chalk.yellow('Proceeding with original thought...\n'));
        } else {
          spinner.text = `Verifying ${claims.length} claim(s)...`;

          // Evaluate each claim using Claude's knowledge
          const evaluations = await Promise.all(
            claims.map(claim => evaluateClaimWithKnowledge(claim))
          );

          spinner.succeed('Fact-check complete!');

          // Display results
          displayFactCheckResults(evaluations);

          // Check if any claims need correction
          const needsCorrection = evaluations.filter(
            e => e.status === 'INCORRECT' || e.status === 'PARTIALLY_CORRECT'
          );

          if (needsCorrection.length > 0) {
            // Generate corrected version
            console.log(chalk.cyan('\n📝 Generating corrected version...\n'));
            const correctedThought = await generateCorrectedThought(thought, evaluations);

            // Show both versions
            console.log(chalk.bold('Original thought:'));
            console.log(chalk.gray(thought));
            console.log();
            console.log(chalk.bold.green('Suggested correction:'));
            console.log(chalk.white(correctedThought));
            console.log();

            // Ask user what to do
            const { choice } = await inquirer.prompt([
              {
                type: 'list',
                name: 'choice',
                message: 'What would you like to do?',
                choices: [
                  { name: '✅ Use corrected version (recommended)', value: 'corrected' },
                  { name: '📝 Use original version anyway', value: 'original' },
                  { name: '✏️  Edit manually', value: 'edit' },
                  { name: '❌ Cancel', value: 'cancel' }
                ]
              }
            ]);

            if (choice === 'corrected') {
              finalThought = correctedThought;
              console.log(chalk.green('\n✅ Using corrected version\n'));
            } else if (choice === 'edit') {
              // Open editor with corrected version
              const editor = await detectEditor();
              const tempFile = `/tmp/daily-voice-thought-${Date.now()}.txt`;
              await fs.writeFile(tempFile, correctedThought, 'utf-8');

              console.log(chalk.cyan(`\n✏️  Opening in ${editor}...\n`));
              await openEditor(editor, tempFile);

              const edited = await fs.readFile(tempFile, 'utf-8');
              finalThought = edited.trim();

              await fs.unlink(tempFile).catch(() => {});
              console.log(chalk.green('\n✅ Using edited version\n'));
            } else if (choice === 'cancel') {
              console.log(chalk.yellow('\n👋 Cancelled.\n'));
              process.exit(0);
            } else {
              // original
              console.log(chalk.yellow('\n⚠️  Using original version (unverified)\n'));
            }
          } else {
            // All verified
            console.log(chalk.green('\n✨ All claims verified! Proceeding with your thought...\n'));
          }
        }
      }
    } catch (error) {
      console.error(chalk.red('\n⚠️  Fact-check failed:'), error.message);
      console.log(chalk.yellow('Continuing with original thought...\n'));
      // Continue with original thought on error
    }

    // Step 2: Select platforms
    const { platforms } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'platforms',
        message: 'Which platforms?',
        choices: [
          { name: 'Twitter', value: 'twitter', checked: true },
          { name: 'LinkedIn', value: 'linkedin', checked: true }
        ],
        validate: (choices) => {
          if (choices.length === 0) {
            return 'Please select at least one platform';
          }
          return true;
        }
      }
    ]);

    // Step 3: Generate posts
    const spinner = ora('Generating posts with Claude...').start();

    let results;
    try {
      results = await generatePost(finalThought, { platforms });
      spinner.succeed('Posts generated!');
    } catch (error) {
      spinner.fail('Failed to generate posts');
      console.error(chalk.red('\nError:'), error.message);

      if (error.message.includes('ANTHROPIC_API_KEY')) {
        console.log(chalk.yellow('\n💡 Make sure your ANTHROPIC_API_KEY is set in .env file'));
      }

      process.exit(1);
    }

    // Step 4: Display generated posts
    for (const platform of platforms) {
      if (results[platform] && results[platform].content) {
        displayPost(platform, results[platform].content, results[platform].validation, results[platform].isThread);
      }
    }

    // Step 5: Main action menu
    let currentResults = results;
    let shouldContinue = true;

    while (shouldContinue) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What do you want to do?',
          choices: [
            { name: '✅ Looks good - Save as draft', value: 'save' },
            { name: '✏️  Edit post manually', value: 'edit' },
            { name: '💬 Give custom instructions', value: 'custom' },
            { name: '✨ Refine posts', value: 'refine' },
            { name: '🔄 Regenerate completely', value: 'regenerate' },
            { name: '❌ Cancel', value: 'cancel' }
          ]
        }
      ]);

      if (action === 'save') {
        // Save posts as drafts
        const postData = {
          noteId: note.id,
          thought,
          content: {},
          platforms
        };

        for (const platform of platforms) {
          if (currentResults[platform]?.content) {
            postData.content[platform] = currentResults[platform].content;
          }
        }

        const savedPost = await savePost(postData, 'draft');
        console.log(chalk.green(`\n✅ Draft saved (ID: ${savedPost.id})`));
        console.log(chalk.gray(`   Location: data/drafts/${savedPost.id}.json`));

        // Ask if user wants to publish now
        const { publishNow } = await inquirer.prompt([{
          type: 'confirm',
          name: 'publishNow',
          message: 'Publish to Twitter now?',
          default: true
        }]);

        if (publishNow) {
          await publishPost(savedPost.id, ['twitter']);
        } else {
          console.log(chalk.yellow('\n💡 Tip: Run the tool again and select "🚀 Publish existing draft" to publish later'));
        }

        shouldContinue = false;

      } else if (action === 'edit') {
        // Edit posts manually in text editor
        console.log(chalk.cyan('\n✏️  Opening posts in your editor...\n'));

        const editor = await detectEditor();
        console.log(chalk.gray(`Using editor: ${editor}\n`));

        try {
          for (const platform of platforms) {
            if (currentResults[platform]?.content) {
              // Save to temp file
              const tempFile = `/tmp/daily-voice-${platform}-${Date.now()}.txt`;
              await fs.writeFile(tempFile, currentResults[platform].content, 'utf-8');

              console.log(chalk.blue(`Opening ${platform} post...`));

              // Open in editor and wait
              await openEditor(editor, tempFile);

              // Read edited content
              const edited = await fs.readFile(tempFile, 'utf-8');
              currentResults[platform].content = edited.trim();

              // Revalidate
              currentResults[platform].validation = validateHumanFeel(edited.trim(), platform);

              // Clean up temp file
              await fs.unlink(tempFile).catch(() => {});
            }
          }

          console.log(chalk.green('\n✅ Posts updated!\n'));

          // Display edited posts
          for (const platform of platforms) {
            if (currentResults[platform]?.content) {
              displayPost(platform, currentResults[platform].content, currentResults[platform].validation, currentResults[platform].isThread);
            }
          }

        } catch (error) {
          console.error(chalk.red('\nError editing posts:'), error.message);
        }

      } else if (action === 'custom') {
        // Custom instructions for Claude
        const { instructions } = await inquirer.prompt([
          {
            type: 'input',
            name: 'instructions',
            message: 'What changes do you want? (e.g., "add link: https://...", "mention React 19")',
            validate: (input) => {
              if (!input || input.trim().length === 0) {
                return 'Please provide instructions';
              }
              return true;
            }
          }
        ]);

        const customSpinner = ora('Parsing your instructions...').start();

        try {
          // Parse which platform(s) to modify
          const intent = await parsePlatformIntent(instructions, platforms);

          customSpinner.text = `Applying to ${intent.platforms.join(' and ')}...`;

          // Only refine the specified platforms
          for (const platform of intent.platforms) {
            if (currentResults[platform]?.content) {
              const refined = await refinePost(
                currentResults[platform].content,
                intent.cleanedInstruction,
                platform
              );
              currentResults[platform] = refined;
            }
          }

          customSpinner.succeed('Posts updated!');

          // Display refined posts
          for (const platform of platforms) {
            if (currentResults[platform]?.content) {
              displayPost(platform, currentResults[platform].content, currentResults[platform].validation, currentResults[platform].isThread);
            }
          }

        } catch (error) {
          customSpinner.fail('Failed to apply instructions');
          console.error(chalk.red('\nError:'), error.message);
        }

      } else if (action === 'refine') {
        // Refinement options
        const { refinementType } = await inquirer.prompt([
          {
            type: 'list',
            name: 'refinementType',
            message: 'How should I refine it?',
            choices: [
              { name: '✂️  Make it shorter', value: 'shorter' },
              { name: '📏 Make it longer', value: 'longer' },
              { name: '🔧 More technical', value: 'more_technical' },
              { name: '💬 More casual', value: 'more_casual' },
              { name: '🌶️  Spicier (more controversial)', value: 'spicier' },
              { name: '🎯 More professional', value: 'more_professional' },
              { name: '← Back', value: 'back' }
            ]
          }
        ]);

        if (refinementType === 'back') {
          continue;
        }

        // Refine for each platform
        const refineSpinner = ora('Refining posts...').start();

        try {
          for (const platform of platforms) {
            if (currentResults[platform]?.content) {
              const refined = await quickRefine(
                currentResults[platform].content,
                refinementType,
                platform
              );
              currentResults[platform] = refined;
            }
          }

          refineSpinner.succeed('Posts refined!');

          // Display refined posts
          for (const platform of platforms) {
            if (currentResults[platform]?.content) {
              displayPost(platform, currentResults[platform].content, currentResults[platform].validation, currentResults[platform].isThread);
            }
          }

        } catch (error) {
          refineSpinner.fail('Refinement failed');
          console.error(chalk.red('\nError:'), error.message);
        }

      } else if (action === 'regenerate') {
        // Regenerate from scratch
        const regenSpinner = ora('Regenerating posts...').start();

        try {
          currentResults = await generatePost(thought, { platforms });
          regenSpinner.succeed('Posts regenerated!');

          // Display new posts
          for (const platform of platforms) {
            if (currentResults[platform]?.content) {
              displayPost(platform, currentResults[platform].content, currentResults[platform].validation, currentResults[platform].isThread);
            }
          }

        } catch (error) {
          regenSpinner.fail('Regeneration failed');
          console.error(chalk.red('\nError:'), error.message);
        }

      } else if (action === 'cancel') {
        console.log(chalk.yellow('\n👋 Cancelled. Your note was saved but no draft was created.'));
        shouldContinue = false;
      }
    }

    console.log(chalk.cyan('\n✨ Done!\n'));

  } catch (error) {
    if (error.isTtyError) {
      console.error(chalk.red('Prompt couldn\'t be rendered in this environment'));
    } else {
      console.error(chalk.red('\nUnexpected error:'), error);
    }
    process.exit(1);
  }
}

// Run the CLI
main();
