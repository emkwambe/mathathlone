# MathAthlone

**The Global Math Olympics** — Where Math Athletes Compete Worldwide

## Overview

MathAthlone is a real-time competitive math platform where students compete in synchronized "Heats" against mathletes globally. Performance is measured using the **CTA Score** formula:

```
CTA = (Content × 0.50) + (Time × 0.30) + (Accuracy × 0.20)
```

- **Content**: Points based on problem difficulty (Depth 1-4)
- **Time**: Speed on correct answers
- **Accuracy**: First-attempt success rate

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Styling**: Tailwind CSS
- **Math Rendering**: KaTeX
- **State Management**: Zustand

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/your-org/mathathlone.git
   cd mathathlone
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Set up database**
   
   In your Supabase SQL Editor, run:
   - `mathathlone-schema.sql` (creates tables)
   - `mathathlone-seed.sql` (adds test data)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open** http://localhost:3000

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Login/Register pages
│   ├── dashboard/         # User dashboards
│   └── heat/              # Competition pages
├── components/
│   ├── ui/                # Base UI components
│   ├── heat/              # Heat-specific components
│   └── dashboard/         # Dashboard components
├── lib/
│   ├── supabase/          # Supabase client
│   ├── scoring/           # CTA calculation
│   └── sync/              # Clock synchronization
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
└── utils/                 # Utility functions
```

## Key Features

### For Mathletes
- Join Heats via code or global queue
- Real-time competition with synchronized timing
- Instant feedback on answers
- CTA score breakdown and ranking
- Medal recognition (Gold/Silver/Bronze)

### For Teachers
- Create and manage classes
- Launch classroom Heats
- Live monitoring during competition
- Post-Heat analytics and gap analysis
- Export results to CSV

### Integrity System
- Focus detection (tab/app switching)
- Clock synchronization (<200ms variance)
- Self-reporting (Akeelah Rule)
- Graduated consequence framework

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
npm run test         # Run tests
npm run db:generate  # Generate Supabase types
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | Application URL |

## Documentation

- [Competition Bible](./docs/competition-bible.md) — Complete rules and scoring
- [Fair Play Code](./docs/fair-play-code.md) — Integrity guidelines
- [User Flows](./docs/user-flows.md) — Journey maps
- [Sprint Plan](./docs/sprint-plan.md) — Development roadmap

## License

Proprietary — © Mpingo Systems

---

Built with ❤️ for mathletes everywhere.
