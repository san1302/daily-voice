import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base data directory (2 levels up from src/core)
const DATA_DIR = path.join(__dirname, '../../data');
const NOTES_DIR = path.join(DATA_DIR, 'notes');
const DRAFTS_DIR = path.join(DATA_DIR, 'drafts');
const PUBLISHED_DIR = path.join(DATA_DIR, 'published');

/**
 * Save a note (user's thought/learning)
 * @param {string} thought - The user's raw thought
 * @param {string} category - Category (tech, ai, general)
 * @param {string[]} tags - Optional tags
 * @returns {Object} Saved note object with id
 */
export async function saveNote(thought, category = 'general', tags = []) {
  const note = {
    id: `note_${Date.now()}`,
    timestamp: new Date().toISOString(),
    thought,
    category,
    tags,
    linkedPostId: null // Will be set when post is published
  };

  const filePath = path.join(NOTES_DIR, `${note.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(note, null, 2));

  return note;
}

/**
 * Load a note by ID
 * @param {string} noteId - The note ID
 * @returns {Object|null} Note object or null if not found
 */
export async function loadNote(noteId) {
  const filePath = path.join(NOTES_DIR, `${noteId}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File not found
    }
    throw error;
  }
}

/**
 * Save a post (draft or published)
 * @param {Object} post - The post object with content for platforms
 * @param {string} status - 'draft' or 'published'
 * @returns {Object} Saved post object
 */
export async function savePost(post, status = 'draft') {
  const postData = {
    ...post,
    id: post.id || `post_${Date.now()}`,
    timestamp: post.timestamp || new Date().toISOString(),
    status,
    updatedAt: new Date().toISOString()
  };

  const dir = status === 'published' ? PUBLISHED_DIR : DRAFTS_DIR;
  const filePath = path.join(dir, `${postData.id}.json`);

  await fs.writeFile(filePath, JSON.stringify(postData, null, 2));

  return postData;
}

/**
 * Load a post by ID
 * @param {string} postId - The post ID
 * @param {string} status - 'draft' or 'published'
 * @returns {Object|null} Post object or null if not found
 */
export async function loadPost(postId, status = 'draft') {
  const dir = status === 'published' ? PUBLISHED_DIR : DRAFTS_DIR;
  const filePath = path.join(dir, `${postId}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Get history of notes and posts
 * @param {number} limit - Max number of items to return
 * @returns {Object} Object with notes and posts arrays
 */
export async function getHistory(limit = 10) {
  // Get all notes
  const noteFiles = await fs.readdir(NOTES_DIR);
  const notes = await Promise.all(
    noteFiles
      .filter(f => f.endsWith('.json'))
      .slice(0, limit)
      .map(async (file) => {
        const content = await fs.readFile(path.join(NOTES_DIR, file), 'utf-8');
        return JSON.parse(content);
      })
  );

  // Get all published posts
  const publishedFiles = await fs.readdir(PUBLISHED_DIR);
  const posts = await Promise.all(
    publishedFiles
      .filter(f => f.endsWith('.json'))
      .slice(0, limit)
      .map(async (file) => {
        const content = await fs.readFile(path.join(PUBLISHED_DIR, file), 'utf-8');
        return JSON.parse(content);
      })
  );

  // Sort by timestamp (most recent first)
  notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    notes: notes.slice(0, limit),
    posts: posts.slice(0, limit)
  };
}

/**
 * Link a note to a published post
 * @param {string} noteId - The note ID
 * @param {string} postId - The post ID
 */
export async function linkNoteToPost(noteId, postId) {
  const note = await loadNote(noteId);
  if (!note) {
    throw new Error(`Note ${noteId} not found`);
  }

  note.linkedPostId = postId;
  const filePath = path.join(NOTES_DIR, `${noteId}.json`);
  await fs.writeFile(filePath, JSON.stringify(note, null, 2));
}

/**
 * Load all draft posts
 * @returns {Array} Array of draft posts sorted by timestamp (newest first)
 */
export async function loadAllDrafts() {
  try {
    const files = await fs.readdir(DRAFTS_DIR);
    const drafts = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(DRAFTS_DIR, file), 'utf-8');
        drafts.push(JSON.parse(content));
      }
    }

    // Sort by timestamp (newest first)
    return drafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // Directory doesn't exist yet
    }
    throw error;
  }
}

/**
 * Mark a draft post as published and move it to published directory
 * @param {string} postId - The post ID
 * @param {string} platform - Platform name ('twitter' or 'linkedin')
 * @param {Object} publishData - Publishing result from adapter
 * @returns {Object} Updated post object
 */
export async function markAsPublished(postId, platform, publishData) {
  // Load draft post
  const draft = await loadPost(postId, 'draft');
  if (!draft) {
    throw new Error(`Draft post ${postId} not found`);
  }

  // Check if this is a partial publish (thread failed mid-way)
  const isPartialPublish = publishData.partial === true;

  if (isPartialPublish) {
    // Partial publish - keep in drafts but add metadata
    const updatedDraft = {
      ...draft,
      partialPublish: {
        ...(draft.partialPublish || {}),
        [platform]: {
          ...publishData,
          publishedAt: new Date().toISOString()
        }
      },
      updatedAt: new Date().toISOString()
    };

    // Save updated draft (stays in drafts directory)
    const draftPath = path.join(DRAFTS_DIR, `${postId}.json`);
    await fs.writeFile(draftPath, JSON.stringify(updatedDraft, null, 2));

    return updatedDraft;
  }

  // Full publish - move to published directory
  const publishedPost = {
    ...draft,
    status: 'published',
    published: {
      ...(draft.published || {}),
      [platform]: {
        ...publishData,
        publishedAt: new Date().toISOString()
      }
    },
    updatedAt: new Date().toISOString()
  };

  // Save to published directory
  const publishedPath = path.join(PUBLISHED_DIR, `${postId}.json`);
  await fs.writeFile(publishedPath, JSON.stringify(publishedPost, null, 2));

  // Delete from drafts directory
  const draftPath = path.join(DRAFTS_DIR, `${postId}.json`);
  try {
    await fs.unlink(draftPath);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return publishedPost;
}
