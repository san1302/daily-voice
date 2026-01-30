# Daily Voice: Note-to-Post System

**Last Updated**: 2025-12-24
**Status**: Implementation Phase - Step 3 (AI Generator)

---

## 🎯 Vision (Your Mental Model)

Simple flow:
```
You have a thought/learning
  ↓
Put it in the tool (mobile/PC)
  ↓
Tool brainstorms with you, suggests post formats
  ↓
You edit and approve
  ↓
Tool publishes to Twitter/LinkedIn
  ↓
Stores the post for reference
```

**Future**: Mobile app
**Now**: Start with foundation that won't need rewriting

---

## 🏗️ Architecture (Foundation First)

### Core Principle
Build in layers that can be swapped without changing the core:

```
┌─────────────────┐
│  Input Layer    │  ← CLI now, mobile later (SWAPPABLE)
└────────┬────────┘
         ↓
┌─────────────────┐
│  Core Engine    │  ← This never changes (FOUNDATION)
│  - Note storage │
│  - AI generation│
│  - Templates    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Output Layer   │  ← Twitter/LinkedIn APIs (SWAPPABLE)
└─────────────────┘
```

**What this means**: When you want mobile later, you just replace the CLI input layer. The core engine stays the same.

### Multi-Platform Design
**Critical principle**: The system is platform-agnostic. Twitter and LinkedIn are just the start.

- Core generator doesn't know about specific platforms
- Platform adapters handle platform-specific posting
- Adding Instagram, Threads, etc. = just add a new adapter
- No core code changes needed for new platforms

---

## 📋 Phase 1: Build the Core Engine (Start Here)

### Goal
Create the "brain" - the part that turns thoughts into posts. This core won't change when you add mobile.

### What We'll Build
1. **Note Storage System** (JSON for now, can swap to DB later)
   - Save thoughts with timestamps
   - Tag by category (tech/AI/general)
   - Link to published posts

2. **Template System** (The "brainstorm" feature)
   - Load proven post formats (contrarian, how-to, tool list, etc.)
   - Match user's thought to best format
   - Suggest: "This sounds like a hot take - let's try a contrarian thread?"

3. **AI Post Generator** (Claude API)
   - Templates as inspiration (not rigid rules - Claude can blend/adapt)
   - Generate platform-specific posts (different for Twitter vs LinkedIn)
   - **Critical: Human touch** - Avoid AI detection (no "delve," "leverage," emoji bookends)
   - Learn user's voice from past approved posts
   - Quick refinement ("make it shorter," "more technical")

4. **Post Storage** (Archive what you publish)
   - Save drafts
   - Save published posts with URLs
   - Track which formats you use

### Files to Create
```
src/
├── core/                    # ← THE FOUNDATION (never changes)
│   ├── storage.js           # Save/load notes & posts
│   ├── templates.js         # Load templates as inspiration
│   ├── humanize.js          # AI detection avoidance rules
│   ├── generator.js         # AI post generation (Claude API)
│   └── index.js             # Core orchestrator
│
├── interfaces/              # ← SWAPPABLE LAYERS
│   └── cli/                 # CLI for now
│       └── post.js          # Simple CLI to test core
│
└── adapters/                # ← SWAPPABLE LAYERS
    └── publishers/          # Platform publishers
        ├── twitter.js
        └── linkedin.js

data/
├── notes/                   # Your thoughts
├── drafts/                  # Generated posts (before publish)
├── published/               # Archive of published posts
└── templates/               # Format templates
    ├── twitter.json
    └── linkedin.json
```

---

## 🚀 Immediate First Steps (MVP)

### Step 1: Set Up Foundation (2 hours)
**What**: Create core data structures and storage

**Tasks**:
1. Create `src/core/storage.js`
   - `saveNote(thought, category, tags)` → saves to JSON
   - `loadNote(id)` → retrieves note
   - `savePost(draft, status)` → saves generated post
   - `getHistory()` → see past notes & posts

2. Create data directories
   - `data/notes/`
   - `data/drafts/`
   - `data/published/`

**Test**: Can you save a thought and load it back?

---

### Step 2: Create Templates (1 hour)
**What**: Curate 3-5 proven post formats

**Tasks**:
1. Create `data/templates/twitter.json` with:
   - Contrarian thread ("Everyone's wrong about X")
   - How-to thread ("How I achieved X")
   - Tool list ("N tools I use")

2. Create `data/templates/linkedin.json` with:
   - Technical breakdown (Problem → Solution → Results)
   - Opinion piece (Hot take with reasoning)

**Test**: Can you load templates from JSON?

---

### Step 3: Build AI Generator
**What**: The core "thought → post" engine that feels genuinely human

**Critical requirement**: Posts must avoid AI detection. 54% of LinkedIn posts are AI-generated - ours won't be detectable.

**Tasks**:
1. Create `src/core/humanize.js`
   - Forbidden words list (delve, foster, transformative, leverage, etc.)
   - Forbidden phrases ("in today's world," "it's important to note," etc.)
   - Human writing rules (first-person, contractions, varied sentence length)

2. Create `src/core/templates.js`
   - Load templates as inspiration (not rigid rules)
   - Claude can blend/adapt templates to fit the thought

3. Create `src/core/generator.js`
   - Uses Claude API (better at creative writing than OpenAI)
   - Generates platform-specific posts (Twitter ≠ LinkedIn)
   - Learns from your past approved posts (your voice)
   - Refinement function ("make it shorter," "more technical")

**Test**:
- Give it "React Server Components are overhyped"
- Check: Does it feel human? (no forbidden words/phrases)
- Check: Are Twitter and LinkedIn versions different?
- Check: Can we refine it quickly?

---

### Step 4: Simple CLI Interface (2 hours)
**What**: Quick way to test the core (will be replaced by mobile later)

**Tasks**:
1. Create `src/interfaces/cli/post.js`
   - Prompt: "What's on your mind?"
   - Show template suggestions
   - User picks template
   - Generate post
   - Show preview (Twitter + LinkedIn)
   - Ask: "Publish or edit?"

**Test**: Can you go from thought → generated post via CLI?

---

### Step 5: Add Publishing (3 hours)
**What**: Actually post to Twitter & LinkedIn

**Tasks**:
1. Set up Twitter API (free tier - 1,500/month)
2. Set up LinkedIn API (personal API, free)
3. Create `src/adapters/publishers/twitter.js`
4. Create `src/adapters/publishers/linkedin.js`
5. Test posting

**Test**: Can you publish a post to both platforms?

---

### Step 6: Connect Everything (1 hour)
**What**: Wire up the full flow

**Tasks**:
1. Create `src/core/index.js` (orchestrator)
   - Input thought → Save note
   - Suggest template → User picks
   - Generate post → Show preview
   - User edits/approves → Publish
   - Save to published archive

2. Update CLI to use core orchestrator

**Test**: End-to-end flow works

---

## 📊 Current State Tracker

### ✅ Completed
- [x] Planning phase
- [x] API research (Twitter/LinkedIn access confirmed)
- [x] Step 1: Foundation & storage ✅
- [x] Step 2: Post format templates ✅ (5 Twitter + 5 LinkedIn formats)
- [x] Step 3: AI generator ✅
  - Created `humanize.js` (AI detection avoidance)
  - Created `templates.js` (template loader)
  - Created `generator.js` (Claude API integration)
  - Tested successfully (100/100 human scores)
- [x] Step 4: CLI interface ✅
  - Created `interfaces/cli/post.js`
  - Added manual edit option (opens in VS Code/Cursor/nano)
  - Added custom instructions option
  - Fixed "Could not load user voice" error
- [x] **Feature: Fact-Checking** ✅
  - Created `fact-check.js` module
  - Uses Claude to detect fact-check requests
  - Extracts claims and verifies using Claude's knowledge
  - Offers corrected version to user
  - Integrated into CLI flow
- [x] **Bug Fix: Platform-Specific Custom Instructions** ✅
  - Added `parsePlatformIntent()` to generator.js
  - Claude now intelligently detects which platform(s) to modify
  - Cleans up instructions (removes "LinkedIn seems fine" preambles)
  - Only modifies specified platforms
- [x] **Step 5: Twitter Publishing** ✅
  - Created `adapters/publishers/twitter.js` (Twitter API v2 with OAuth 1.0a)
  - Intelligent thread generation with narrative engineering
  - Content density optimization (4-7 dense tweets vs 8+ thin tweets)
  - Two publishing flows (immediate and later)
  - Rate limiting (1.5s delays between tweets)
  - Partial publish handling (keeps successful tweets)
  - Updated CLI with publish existing draft feature
  - See "Twitter Publishing Implementation" section below for details

### 🚧 In Progress
- [ ] None currently

### 📝 TODO
- [ ] Step 5: LinkedIn publishing adapter (complete Step 5)
- [ ] Step 6: Integration (end-to-end flow)

### 🐛 Known Issues
- None currently

### 🎯 Current Session
**Status**: Updating documentation to reflect Twitter publishing completion

---

## 🗂️ Documentation Structure

This is the ONE evolving document. As we build, we'll update:

### Section 1: Vision
- Your mental model (updated if changes)

### Section 2: Architecture
- High-level design (foundation + swappable layers)

### Section 3: Implementation Steps
- What we're building, step by step

### Section 4: Current State
- What's done, what's in progress, what's next

### Section 5: Technical Notes
- API keys, setup instructions, gotchas

---

## 🔑 Technical Notes (Will grow as we build)

### APIs Confirmed
- **Twitter**: Free tier, 1,500 posts/month
- **LinkedIn**: Personal API (free, token expires every 2 months)
- **Claude API**: Used for post generation + fact-checking

### Dependencies
```bash
npm install @anthropic-ai/sdk twitter-api-v2 inquirer chalk ora
```

### Environment Variables
```bash
ANTHROPIC_API_KEY=your_claude_api_key
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_token_secret
LINKEDIN_ACCESS_TOKEN=your_token
LINKEDIN_PERSON_URN=your_urn
```

### Twitter API Setup
**Get credentials at**: https://developer.twitter.com/en/portal/dashboard

**Steps:**
1. Create a Twitter Developer account
2. Create a new app (or use existing)
3. Generate OAuth 1.0a credentials:
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
   - Access Token
   - Access Secret
4. Ensure app has "Read and Write" permissions (not just Read)
5. Add credentials to `.env` file

**Rate Limits (Free Tier):**
- 1,500 tweets per month
- ~50 tweets per day
- Rate limit resets: Wait 15-30 minutes between high-volume posting sessions
- Within-thread delays: 1.5 seconds (handled automatically by publisher)

**Common Errors:**
- **401/403**: Authentication failed - check credentials and app permissions
- **429**: Rate limit exceeded - wait 15-30 minutes before retrying
- **Tweet too long (>280 chars)**: Generator should output JSON array for threads

**Partial Publish Recovery:**
If a thread fails mid-way (e.g., rate limit hit at tweet 3 of 5):
- Successfully posted tweets (1-2) remain on Twitter
- Error shows: "Thread failed at tweet 3 of 5. Successfully posted: 2 tweet(s)"
- Options: (1) Wait and retry full thread, or (2) Manually delete partial thread on Twitter

### Fact-Checking Feature
**Module**: `src/core/fact-check.js`

**How it works**:
1. User includes phrases like "validate this", "is this true", "check on Internet"
2. Claude detects the fact-check request (intent understanding, not keywords)
3. Extracts factual claims from the thought
4. Verifies each claim using Claude's knowledge (not web search*)
5. Generates corrected version if claims are wrong
6. User chooses: corrected / original / edit manually

**Limitations**:
- Uses Claude's training data (knowledge cutoff: January 2025)
- Cannot verify claims about very recent events
- Web search integration possible but not implemented yet

**Example**:
```
User: "React 19 released in December. Can you validate this?"
System: Detects request → Extracts claim → Verifies → "INCORRECT: Released in October 2024" → Offers correction
```

---

### Twitter Publishing Implementation
**Module**: `src/adapters/publishers/twitter.js`

**Architecture:**
```
User Thought
    ↓
Generator (Claude API)
  - Outputs JSON array for threads: ["tweet 1", "tweet 2", ...]
  - Uses narrative engineering (hooks, cliffhangers, pacing)
  - Optimizes content density (200-280 chars/tweet)
    ↓
Twitter Publisher Adapter
  - OAuth 1.0a authentication
  - Single tweet or thread posting
  - Rate limiting (1.5s delays)
  - Partial publish handling
    ↓
Twitter API v2
```

**Key Features:**

1. **Intelligent Thread Generation**
   - Claude outputs threads as JSON arrays with strategic narrative structure
   - Content density optimization: 4-7 dense tweets (200-280 chars each) instead of 8+ thin tweets
   - Strategic cliffhangers placed at narrative peaks, not mechanical paragraph breaks
   - Narrative engineering: hooks in first tweet, tension building, resolution + CTA

2. **Thread Generation Principles** (implemented in `templates.js` and `generator.js`)
   - **Content density**: Maximize content per tweet (200-280 chars target)
   - **Quality over quantity**: Fewer, meatier tweets > many short tweets
   - **Strategic breaks**: Only break at (a) approaching 280 chars, (b) natural cliffhanger, (c) major topic shift
   - **JSON array format**: Generator outputs `["tweet 1", "tweet 2", ...]` not long strings with `\n\n`

3. **Two Publishing Flows**
   - **Flow A (Immediate)**: Publish right after creating post
     - User creates post → Approve → Prompt: "Publish to Twitter now?" → Publish immediately
   - **Flow B (Later)**: Publish existing draft from main menu
     - User selects "Publish existing draft" → Pick draft → Publish

4. **Rate Limiting**
   - 1.5-second delays between tweets within a thread to avoid 429 errors
   - Twitter free tier: 1,500 tweets/month
   - Note: Multiple thread posts in quick succession can still hit rate limits (wait 15-30 min)

5. **Partial Publish Handling**
   - If thread fails mid-way (e.g., rate limit), successfully posted tweets remain on Twitter
   - Error message shows: "Thread failed at tweet X of Y. Successfully posted: Z tweet(s)"
   - User can manually delete or continue thread later

**Files Modified:**
- `src/adapters/publishers/twitter.js` - Twitter API integration (OAuth 1.0a, posting logic)
- `src/core/generator.js` - Thread-specific prompt instructions with narrative engineering rules
- `src/core/templates.js` - Thread guidelines (`contentDensity`, `cliffhangers`, `hooks` in `threadGuidelines`)
- `src/interfaces/cli/post.js` - Publishing flows (immediate and later), updated display for thread arrays
- `src/core/storage.js` - Added `loadAllDrafts()` and `markAsPublished()` functions

**Example Thread Output:**
```javascript
[
  "Context window management was my biggest pain point with Claude Code. I'd hit the limit mid-task and watch my AI forget everything we'd discussed. Frustrating as hell.", // 173 chars - Hook + problem
  "My workaround? I built a whole system of sub-agents. Delegated chunks of work to separate contexts, then stitched results together manually. It worked, but felt like I was fighting the tool instead of using it.", // 221 chars - Solution
  "Then something shifted. Recent Claude Code updates seem to handle this automatically now. The tool creates its own sub-agents, manages context internally, delegates without me micromanaging every token.", // 227 chars - The shift
  "Sessions feel longer. More coherent. Less \"wait, what were we building again?\" moments. Still not sure if it's perfect, but the improvement is noticeable.", // 170 chars - Results
  "Anyone else notice this? Or am I just imagining things because I stopped overloading single sessions?" // 107 chars - CTA
]
```

**Implementation Commit**: `[main 1bc97aa] Implement intelligent Twitter thread generation and publishing`

---

## 💡 Why This Approach?

**Foundation First**: The core engine (storage, templates, AI) won't change when you add mobile. You're building the brain, not the interface.

**Swappable Layers**:
- Input layer (CLI) → can become mobile app later
- Output layer (Twitter/LinkedIn) → can add more platforms later
- Core stays the same

**Platform-Agnostic Design**:
- Twitter and LinkedIn are just the start
- Easy to add Instagram, Threads, etc. later
- Just add a new adapter - no core changes needed

**Human Touch First**:
- 54% of LinkedIn posts are AI-generated and detectable
- We avoid all AI tells (forbidden words, robotic phrases, emoji bookends)
- Posts feel genuinely human, not like ChatGPT output
- Learns your voice from past approved posts

**Test Early**: Each step is independently testable. You'll see progress fast.

**One Document**: This file evolves as we build. It's your single source of truth.

---

## 🎯 Next Steps

1. **Decision needed**: Start with Step 1 (foundation)?
2. **Your input**: Anything in this plan that doesn't feel right?

Once you approve, we'll start building Step 1 together.
