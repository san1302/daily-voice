# Daily Voice

## Think it. Post it. That's it.

You learn things every day. You have opinions. You want to share them on Twitter.

But the workflow kills you:

1. Open ChatGPT
2. Prompt it about Twitter formatting
3. Go back and forth on hooks and structure
4. Copy to Twitter
5. Manually post
6. Tomorrow: "I'm too busy"
7. Result: Inconsistent posting → No growth

**Daily Voice solves this:**

```bash
daily-voice post "Just realized most startup advice is backwards"
```

That's it. It:
- Formats it for Twitter (hooks, threads, what actually works)
- Sounds like YOU (learns from your past posts)
- Auto-posts (or shows you a draft)

---

## Why It Exists

Consistency = growth on social media.

But consistency requires low friction.

Daily Voice is the lowest-friction way to go from "I learned something" to "It's on Twitter."

---

## Features

**One-command posting**  
No ChatGPT tab-switching. No copy-paste. Just: thought → posted.

**Auto-formatting**  
Knows what works on Twitter and LinkedIn. Proper hooks, thread structure, engagement patterns.

**Voice learning**  
Analyzes your past posts. The more you use it, the more it sounds like you (not a robot).

**Fact-checking**  
Automatically validates claims before posting. Prevents you from posting "90% of startups fail in year 1" when it's actually 10%.

**Thread optimization**  
Smart splitting, proper hooks, natural cliffhangers. No wasteful 50-character tweets.

**Humanization**  
Blocks 30+ AI-tell words ("delve", "leverage", "synergy"). Enforces contractions, first-person voice, natural flow. Human score: 90-100/100.

**Draft or publish**  
Review before posting, or trust it and auto-publish.

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Create and publish a post
npm run post
```

### Required API Keys

```bash
# .env
ANTHROPIC_API_KEY=your_claude_api_key

# Twitter (for auto-publishing)
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_token_secret
```

Get API keys:
- **Claude:** https://console.anthropic.com
- **Twitter:** https://developer.twitter.com

---

## Example

**Your thought:**
```
Just realized most startup advice is backwards
```

**Daily Voice generates:**

> Most startup advice is backwards.
> 
> Everyone says "find product-market fit first."
> 
> But the real bottleneck? Distribution.
> 
> You can have the perfect product. If nobody knows it exists, you're dead.
> 
> Build distribution first. Product second.
> 
> (Thread continues with 2 more tweets...)

**Human Score:** 95/100  
**Format:** 5-tweet thread  
**Published:** Automatically (or review first)

---

## Use Cases

**Share daily learnings without the grind**  
You learn something new every day. Daily Voice makes sure it gets posted.

**Build personal brand while working full-time**  
No time to write posts? Turn 2-minute thoughts into formatted threads.

**Stay consistent (the #1 growth factor)**  
Consistency requires low friction. This is the lowest friction possible.

**Turn shower thoughts into threads**  
Raw idea → Formatted thread → Posted. That simple.

---

## Not Another AI Writer

This isn't "AI writes for you."

This is "Remove all friction between thought and post."

The problem isn't that you can't write. It's that the workflow takes 15 minutes and kills your consistency.

Daily Voice makes it one step.

---

## How It Works

### 1. Content Discovery (Optional)

```bash
npm run digest
```

Curates trending content from:
- HackerNews
- GitHub Trending
- Dev.to
- Lobsters
- Hashnode
- FreeCodeCamp
- Daily.dev

Pick 1-3 topics. Open in browser. Learn. Take notes.

### 2. Post Generation

```bash
npm run post
```

Interactive workflow:
1. Enter your thought (raw, unformatted)
2. AI generates Twitter + LinkedIn versions
3. Review, edit, refine
4. Publish or save as draft

### 3. Auto-Publishing

One command publishes to Twitter.

LinkedIn coming soon.

---

## Advanced Features

**Voice Learning**  
Stores all published posts. Future posts match your style more accurately over time.

**Fact-Checking**  
Detects claims, validates them, offers corrections before posting.

Example:
```
You: "90% of startups fail in their first year"
Daily Voice: "Actually, it's 10%. Want me to correct it?"
You: "Yes"
Daily Voice: [Generates corrected post]
```

**Thread Optimizer**  
- Merges wastefully short tweets
- Splits tweets over 280 characters
- Optimizes content density
- Natural cliffhangers

**Humanization**  
Forbidden words blocked: delve, leverage, synergy, paradigm, etc.  
Enforced: contractions, first-person voice, varied sentence length.

---

## Project Structure

```
daily-voice/
├── src/
│   ├── core/              # Core engine (platform-agnostic)
│   │   ├── generator.js   # AI post generation
│   │   ├── humanize.js    # AI detection avoidance
│   │   ├── fact-check.js  # Claim validation
│   │   └── thread-optimizer.js  # Smart formatting
│   ├── adapters/
│   │   └── publishers/
│   │       └── twitter.js # Twitter API
│   ├── discovery/         # Content curation
│   └── interfaces/
│       └── cli/           # Command-line interface
├── data/
│   ├── templates/         # Post format templates
│   ├── notes/             # Your raw thoughts (gitignored)
│   ├── drafts/            # Generated posts (gitignored)
│   └── published/         # Published posts (gitignored)
├── docs/
│   ├── ARCHITECTURE.md    # Technical design
│   ├── DEVELOPMENT.md     # Development plan
│   └── FIXES.md           # Implementation notes
└── tests/                 # Test suite
```

---

## Architecture

**Swappable components:**

```
CLI Interface → Core Engine → Publishers
                    ↓
            (Humanizer, Fact-Checker, Optimizer)
```

- **Interface:** CLI now, web app later
- **Core:** Never changes (platform-agnostic)
- **Publishers:** Twitter now, LinkedIn next, others easy to add

Clean separation = easy to extend.

---

## Technical Stack

- **Node.js** - Runtime
- **Claude API** - Post generation
- **Twitter API v2** - Publishing
- **Local JSON** - Storage (no database needed)

**Why Claude?**  
Best at following complex instructions (humanization rules, fact-checking, voice matching).

---

## Requirements

- Node.js 18+
- Anthropic API key (Claude)
- Twitter API credentials (for publishing)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## License

MIT

---

## Roadmap

**v1.0 (Current)**
- Twitter publishing
- Humanization system
- Fact-checking
- Thread optimization
- Voice learning

**v1.5 (Next)**
- LinkedIn publishing
- Web UI
- Scheduled posts

**v2.0 (Future)**
- Mobile app
- Analytics (what performs well)
- Team collaboration
- Custom templates

---

## FAQ

**Q: Do I need to review every post?**  
A: No. You can auto-publish if you trust it. But you probably want to review at first.

**Q: Does it work for non-tech content?**  
A: Yes. The core engine works for any topic. Discovery module is tech-focused but optional.

**Q: Will people know it's AI?**  
A: No. Human score is 90-100/100. It blocks the words that give AI away.

**Q: How much does it cost?**  
A: Free and open source. You just pay for API usage (Claude ~$0.01-0.05 per post).

**Q: Can I self-host?**  
A: Yes. It's just a Node.js app. Run it anywhere.

---

## Support

- GitHub Issues: https://github.com/san1302/daily-voice/issues
- Twitter: @san1302

---

Built by [san1302](https://github.com/san1302) to solve the "I want to post consistently but the workflow sucks" problem.
