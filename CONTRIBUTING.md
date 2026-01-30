# Contributing to Daily Voice

Thanks for considering contributing to Daily Voice.

## Ways to Contribute

**Report bugs**  
Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (OS, Node version)

**Suggest features**  
Open an issue describing:
- The problem you're trying to solve
- How you'd use the feature
- Why it fits Daily Voice's mission (low-friction consistency)

**Fix bugs or add features**  
1. Fork the repo
2. Create a branch (`git checkout -b fix-something`)
3. Make your changes
4. Test it works
5. Commit with a clear message
6. Push and open a PR

**Improve documentation**  
Typos, clarity, examples - all welcome. Just open a PR.

## Guidelines

**Keep it simple**  
Daily Voice is about removing friction. Don't add complexity unless the value is clear.

**Follow existing style**  
Match the code style you see. We don't have strict rules, just be consistent.

**Test your changes**  
Make sure the basic workflow still works:
```bash
npm run digest
npm run post
```

**One feature per PR**  
Easier to review and merge.

**Be patient**  
This is a side project. I'll respond as fast as I can.

## Areas We Need Help

**High priority:**
- LinkedIn publisher implementation
- Web UI (Next.js)
- Better error messages
- More post templates

**Medium priority:**
- Analytics (track what performs well)
- Scheduled posts
- Voice note support
- Thread from conversation

**Low priority:**
- Other platforms (Facebook, Instagram, etc.)
- Advanced customization
- Team features

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/daily-voice.git
cd daily-voice

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your API keys

# Run tests
npm test

# Try the CLI
npm run post
```

## Code Structure

```
src/
├── core/              # Core engine (most contributions here)
│   ├── generator.js   # Post generation logic
│   ├── humanize.js    # AI detection rules
│   ├── fact-check.js  # Claim validation
│   └── thread-optimizer.js
├── adapters/          # Platform publishers
│   └── publishers/
│       └── twitter.js
├── discovery/         # Content curation
└── interfaces/        # User interfaces
    └── cli/
```

**Core principles:**
- `core/` is platform-agnostic (works for any social network)
- `adapters/` are swappable (easy to add new platforms)
- `interfaces/` are swappable (CLI now, web later)

## Questions?

Open an issue or DM me on Twitter: @san1302

## License

By contributing, you agree your contributions will be licensed under MIT.
