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

- **Frontend**: Next.js 16 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Styling**: Tailwind CSS
- **Math Rendering**: KaTeX
- **State Management**: Zustand

## Quick Start

### Prerequisites

- Node.js 20.9+ (Node 22 LTS recommended)
- npm (the repository uses `package-lock.json`)
- Supabase account

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/your-org/mathathlone.git
   cd mathathlone
   npm ci
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Set up database**

   Apply the ordered SQL files in `supabase/migrations/` to the target Supabase project. Do not assume a fresh environment is current until it includes the migration required by the feature being tested. The current production baseline includes Sprint 15 migration `046_sprint15_bracket_results.sql`.

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
- Configure and launch curriculum-aligned Heats
- Generate assessments and review student progress
- Create and manage individual leagues and brackets
- Record elimination results with cohort-safe scoring
- Use roster-scoped classroom setup once the three-school pilot operations release is complete

### Integrity System
- Focus detection (tab/app switching)
- Clock synchronization (<200ms variance)
- Self-reporting (Akeelah Rule)
- Graduated consequence framework

## Scripts

```bash
npm run dev          # Start the Turbopack development server
npm run dev:webpack  # Start development with the legacy Webpack path
npm run build        # Build for production with the explicit Webpack path
npm run lint         # Run the ESLint CLI
npm run type-check   # Run the TypeScript check
npm run db:generate  # Generate Supabase types
npm run seed:nc      # Seed NC demo data (schools, mathletes, leagues)
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | Application URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Used for bulk roster imports and admin operations |
| `NEXT_PUBLIC_HEAT_WORKER_URL` | Cloudflare HeatRoom worker URL |
| `HEAT_WORKER_URL` | Server-side worker URL |
| `HEAT_ROOM_SECRET` | Shared secret for Next.js → Worker auth |

## Documentation

- [Competition Bible](./docs/competition-bible.md) — Complete rules and scoring
- [Fair Play Code](./docs/fair-play-code.md) — Integrity guidelines
- [User Flows](./docs/user-flows.md) — Journey maps
- [Sprint Plan](./docs/sprint-plan.md) — Development roadmap

## License

Proprietary — © Mpingo Systems

---

Built with ❤️ for mathletes everywhere.
