# Daily Voice - Project Context

## Vision
Automate the discovery-to-posting pipeline for tech learning, enabling consistent daily learning with public validation through social media posts.

## Core Problem Solved
- Learning without application leads to procrastination
- Need for validation and feedback to maintain momentum
- Manual process of finding, learning, and posting is time-consuming
- Difficulty in maintaining consistency in learning and sharing

## Mental Model

### The Flow: Learn → Explore → Opinion → Share

**Daily Cycle:**
1. **Discovery** (Automated): Receive curated digest of tech topics
2. **Selection** (Human, 5 min): Pick 1-3 topics that spark curiosity
3. **Deep Dive** (Human, 30-60 min): Actually try it, form opinion, note surprises
4. **Synthesis** (AI-Assisted): Transform raw thoughts into structured posts
5. **Review & Post** (Human, 2 min): Approve and auto-publish

### Key Principles

#### 1. Human-in-the-Loop Where It Matters
- **Automated**: Discovery, formatting, posting, scheduling
- **Human**: Topic selection, opinion formation, final approval
- **Why**: Keeps authenticity while removing friction

#### 2. Adaptive Learning System
The system learns from:
- What topics you pick (interests)
- What you skip (noise)
- Engagement rates (what resonates)
- Time patterns (when you're productive)
- Multi-pick patterns (energy levels)

#### 3. Simple Interface, Smart Backend
- **User sees**: Simple digest → Pick → Learn → Post
- **System tracks**: Pick rates, completion rates, engagement, timing
- **Evolution**: Week 1-2 broad discovery → Week 3+ personalized curation (70% sweet spots, 30% wildcards)

### Post Types & Value Prop

Not "Today I learned X" but:
- "I tried X so you don't have to"
- "Everyone's wrong about Y"
- "The hidden gem in Z"
- "X vs Y: the comparison nobody's making"
- "Why X will matter in 6 months"

**Value**: Doing the homework others won't - testing, comparing, forming unique opinions

### Discovery Sources
- HackerNews top stories
- GitHub trending repos
- Papers with Code trending
- Tech Twitter lists
- Reddit (r/programming, r/machinelearning)
- Product Hunt launches

### Adaptive Features

**Self-tuning signals:**
- Pick AI topics 3 days → More AI content
- Docker post gets 100 likes → More containerization content
- Skip all blockchain → Stops showing crypto
- Friday lighter topics → Adjusts for end-of-week energy

**Control Options:**
- Auto mode: AI-curated mix based on learning
- Focus mode: "System design week" → 80% focused content
- Explore mode: "What's new in AI" → 100% fresh discoveries

### Success Metrics
- Streak days (consistency)
- Topics explored (breadth)
- Engagement rate (validation)
- Time from discovery to post (efficiency)
- Pick rate (relevance of suggestions)

## Technical Architecture (Simplified v1)

### Components
1. **Discovery Engine**: Fetches from multiple sources
2. **Curation Algorithm**: Filters and ranks based on user history
3. **Learning Tracker**: Stores picks, completions, topics
4. **Post Generator**: Transforms raw notes to platform-specific formats
5. **Publisher**: Auto-posts to Twitter/LinkedIn at optimal times

### Data Flow
```
Sources → Discovery Engine → Ranked Digest → User Selection
→ Deep Dive Notes → AI Synthesis → Review → Auto Publish
                          ↓
                   Learning Tracker (feeds back to ranking)
```

## MVP Scope (Phase 1)

**Simplified version for initial build:**
- Single discovery source (HackerNews)
- Manual topic selection from digest
- Basic note capture (text input)
- AI-assisted post generation
- Manual posting (copy-paste)
- Simple tracking (what picked, what posted)

**NOT in MVP:**
- Auto-posting
- Multiple sources
- Advanced learning algorithm
- Engagement tracking
- Category filtering

## Future Enhancements
- Voice note capture for thoughts
- Auto-scheduling based on optimal times
- Series detection (related topics → thread)
- Comparison post generator
- Integration with more sources
- Mobile app for on-the-go capture