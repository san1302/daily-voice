# Daily Voice

Transform your daily tech learning into engaging social media posts.

## What It Does

Daily Voice automates the friction between learning and sharing:

1. **Discover** - Curates content from 7 sources (HackerNews, Dev.to, GitHub trending, etc.)
2. **Select** - Pick 1-3 topics that spark your curiosity
3. **Learn** - Explore, form opinions, take notes
4. **Generate** - AI transforms your raw thoughts into polished posts
5. **Publish** - Post to Twitter (LinkedIn coming soon)

## Features

- **Multi-source Discovery** - HackerNews, Dev.to, GitHub, Lobsters, Hashnode, FreeCodeCamp, Daily.dev
- **AI Post Generation** - Claude-powered, learns your writing voice
- **Humanization System** - Avoids AI detection (no corporate buzzwords, natural flow)
- **Fact-Checking** - Validates claims before posting
- **Twitter Publishing** - Single tweets and threads with smart formatting
- **Draft Management** - Save, edit, and publish later

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Run the daily digest (discover content)
npm run digest

# Create and publish a post
npm run post
```

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_claude_api_key

# Twitter (for publishing)
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_token_secret

# LinkedIn (coming soon)
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_PERSON_URN=
```

## Project Structure

```
daily-voice/
├── src/
│   ├── index.js                 # Entry point
│   ├── digest.js                # Daily digest generator
│   │
│   ├── discovery/               # Content discovery
│   │   ├── index.js             # Fetches from all sources
│   │   ├── normalizer.js        # Unifies scoring across sources
│   │   └── sources/             # Individual source adapters
│   │       ├── hackernews.js
│   │       ├── devto.js
│   │       ├── github.js
│   │       ├── lobsters.js
│   │       ├── hashnode.js
│   │       ├── freecodecamp.js
│   │       └── dailydev.js
│   │
│   ├── core/                    # Core logic (platform-agnostic)
│   │   ├── generator.js         # AI post generation (Claude)
│   │   ├── storage.js           # Notes, drafts, published posts
│   │   ├── templates.js         # Post format templates
│   │   ├── humanize.js          # AI detection avoidance
│   │   └── fact-check.js        # Claim verification
│   │
│   ├── adapters/publishers/     # Platform publishers
│   │   └── twitter.js           # Twitter OAuth + posting
│   │
│   └── interfaces/cli/          # User interfaces
│       └── post.js              # CLI for creating posts
│
├── data/                        # Local storage
│   ├── templates/               # Post format templates
│   ├── notes/                   # Your raw thoughts (gitignored)
│   ├── drafts/                  # Generated posts (gitignored)
│   └── published/               # Published posts (gitignored)
│
├── docs/
│   └── PLAN.md                  # Development plan & architecture
│
└── PROJECT_CONTEXT.md           # Vision and mental model
```

## Usage

### Daily Workflow

```bash
# 1. Discover what's trending
npm run digest
# → Select 1-3 topics, opens in browser

# 2. After learning, create a post
npm run post
# → Enter your thought
# → AI generates Twitter + LinkedIn versions
# → Review, edit, refine
# → Publish or save as draft
```

### Post Creation Options

When creating a post, you can:
- **Save as draft** - Store for later
- **Edit manually** - Opens in your text editor
- **Custom instructions** - Tell AI what to change ("make it shorter", "add a hook")
- **Quick refine** - Preset options (shorter, longer, spicier, more technical)
- **Regenerate** - Start fresh
- **Publish** - Post to Twitter immediately

## Architecture

```
┌─────────────────┐
│  CLI Interface  │  (swappable - mobile coming)
└────────┬────────┘
         ↓
┌─────────────────┐
│   Core Engine   │  (never changes)
│  - Generator    │
│  - Storage      │
│  - Humanizer    │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Publishers    │  (swappable - add platforms)
│  - Twitter ✓    │
│  - LinkedIn     │
└─────────────────┘
```

## Current Status

**Working:**
- Multi-source content discovery
- AI post generation with voice learning
- Humanization (avoids AI detection)
- Fact-checking
- Twitter publishing (single + threads)
- Draft management

**Coming Soon:**
- LinkedIn publishing
- Mobile app (PWA)

## License

MIT
