import { saveNote, loadNote, savePost, getHistory } from './storage.js';

async function test() {
  console.log('🧪 Testing Storage System\n');

  // Test 1: Save a note
  console.log('Test 1: Saving a note...');
  const note = await saveNote(
    'React Server Components are overhyped. They only make sense for content-heavy sites.',
    'tech',
    ['react', 'opinion', 'ssr']
  );
  console.log('✅ Note saved:', note.id);
  console.log('   Content:', note.thought.substring(0, 50) + '...');

  // Test 2: Load the note back
  console.log('\nTest 2: Loading note back...');
  const loadedNote = await loadNote(note.id);
  console.log('✅ Note loaded:', loadedNote.id);
  console.log('   Category:', loadedNote.category);
  console.log('   Tags:', loadedNote.tags.join(', '));

  // Test 3: Save a draft post
  console.log('\nTest 3: Saving a draft post...');
  const draft = await savePost({
    noteId: note.id,
    platforms: {
      twitter: {
        content: ['Tweet 1', 'Tweet 2'],
        format: 'thread'
      },
      linkedin: {
        content: 'LinkedIn post content',
        format: 'opinion'
      }
    }
  }, 'draft');
  console.log('✅ Draft saved:', draft.id);

  // Test 4: Get history
  console.log('\nTest 4: Getting history...');
  const history = await getHistory(5);
  console.log('✅ History retrieved:');
  console.log('   Notes:', history.notes.length);
  console.log('   Posts:', history.posts.length);

  console.log('\n✅ All tests passed! Storage system is working.\n');
}

test().catch(console.error);
