# Daily Voice

Transform your daily tech learning into engaging social media posts.

## What it does
- Curates daily tech discoveries
- Helps you pick what to learn
- Captures your raw thoughts after exploration
- Transforms notes into LinkedIn/Twitter posts
- Tracks what resonates with your audience

## Quick Start
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Run the daily digest
npm run digest

# Development mode (with auto-reload)
npm run dev
```

## Project Structure
```
daily-voice/
├── PROJECT_CONTEXT.md    # Detailed mental model and architecture
├── src/
│   ├── index.js         # Main entry point
│   ├── digest.js        # Daily digest generator
│   ├── discovery/       # Content discovery modules
│   ├── synthesis/       # Post generation logic
│   └── utils/           # Helper functions
└── data/                # Local storage for learning history
```

## Current Status
MVP Phase - Manual discovery and posting with AI-assisted synthesis