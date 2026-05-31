# MathAthlone — Project Context (Claude Code Reference)

**Read this file FIRST before any sprint. Do not skip.**

---

## What Is MathAthlone

A real-time competitive math platform — "Chess.com for math." Students compete in timed Heats on curriculum-standard problems, earn ELO ratings, advance through divisions, and progress from classroom practice to national championships.

**Core thesis:** Math Olympiad is for the few. MathAthlone is for everyone. Built on school curriculum, not trick questions. Inclusive divisions by grade. Year-round leagues with championship points.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, `src/app/`) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Realtime, RLS) |
| Auth | Supabase Auth via `@supabase/ssr` |
| Package manager | pnpm |
| Deployment | Not yet deployed (local dev only) |

---

## Repo Structure

```
C:\Users\HP\Documents\mathathlone-app\
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── page.tsx                 # Landing page
│   │   ├── auth/                    # Login, register, forgot/reset password
│   │   ├── compete/
│   │   │   ├── page.tsx             # Join Heat (enter code)
│   │   │   ├── create/page.tsx      # Create Heat (teacher)
│   │   │   └── [code]/page.tsx      # Live competition
│   │   └── dashboard/               # Teacher, athlete, parent, admin dashboards
│   ├── lib/
│   │   ├── supabase/client.ts       # Supabase browser client (singleton)
│   │   ├── competition/
│   │   │   ├── generators.ts        # 54 procedural question generators
│   │   │   ├── visual-generators.ts # 12 SVG visual question generators
│   │   │   ├── question-service.ts  # Unified question service (gen + static + visual)
│   │   │   ├── validation.ts        # Answer validation
│   │   │   ├── heat-engine.ts       # ⚠️ NEEDS REWRITE — wrong column names
│   │   │   ├── focus-mode.ts        # Browser focus detection
│   │   │   └── index.ts             # Barrel exports
│   │   ├── league-engine.ts         # ELO, brackets, Swiss, standings
│   │   └── identity-resolver.ts     # Competition identity tags by level
│   ├── components/
│   │   ├── competition/             # Heat UI components
│   │   │   ├── index.tsx            # Competition components
│   │   │   ├── focus-mode-ui.tsx    # Focus mode overlays
│   │   │   └── attestation.tsx      # Teacher attestation form
│   │   └── league/
│   │       └── LeagueDashboard.tsx   # Bracket + standings UI (mock data)
│   └── contexts/
│       └── AuthContext.tsx           # Auth provider + useAuth hook
├── supabase/migrations/             # SQL migration files
│   ├── 003_integrity_system.sql
│   ├── 005_views_and_functions.sql
│   ├── 006_league_engine.sql
│   ├── 007_identity_fields.sql
│   └── 008_fix_rls_recursion.sql
├── docs/
│   ├── SCHEMA_AUDIT.md              # ← Created by Pre-Sprint (source of truth)
│   ├── TECHNICAL_PROBLEM_DESCRIPTION.md
│   ├── MVP_BLUEPRINT_SPRINTS.md
│   ├── MATHATHLONE_OPEN_PLATFORM_VISION.md
│   ├── MATHATHLONE_PRICING_STRATEGY.md
│   └── NC_Math_1.json               # Full curriculum (97 concepts)
└── .env.local                       # Supabase URL + anon key
```

---

## Database Architecture

### Curriculum Hierarchy (the spine of the platform)
```
divisions (5: Junior, Intermediate, Advanced, JV, SV)
  └─ division_curricula (junction: which courses each division can access)
       └─ courses (NC Math 1, future: Grade 7-8, Math 2, etc.)
            └─ unit_topics (8 per NC Math 1: Equations, Functions, Systems, etc.)
                 └─ atomic_concepts (97 per NC Math 1, each with lesson code like M1.EQN.2.4)
                      └─ question_generators (54+ procedural generators)
                      └─ static_questions (50 MC questions for non-generator concepts)
```

### Competition Flow Tables
```
heats → heat_questions → question_submissions
     → heat_participations → heat_awards (to be created)
```

### League System Tables
```
seasons → splits → leagues → league_standings
brackets → bracket_matches
athlete_ratings → rating_history
championship_points → season_standings
```

### Integrity Tables
```
integrity_configs → focus_violations → teacher_attestations
detected_anomalies → qualification_reviews
```

### Key Enums
- `heat_type`: official, practice, sprint, target, championship
- `heat_status`: scheduled, open, lobby, countdown, active, in_progress, calculating, complete, finished, cancelled
- `integrity_level`: practice, school, district, regional, state, national

---

## Competition Rulebook (Locked Design)

### Division Structure
| Division | Code | Grades | MVP curriculum access |
|---|---|---|---|
| Junior | JR | 3–4 | None yet (greyed out) |
| Intermediate | INT | 5–6 | None yet (greyed out) |
| Advanced | ADV | 7–8 | NC Math 1 (overlap rule) |
| Junior Varsity | JV | 9–10 | NC Math 1 (home division) |
| Senior Varsity | SV | 11–12 | NC Math 1 + future content |

### Award System (Three Layers)
1. **Participation** — grade-based division placement
2. **Eligibility** — ≥60% score threshold to enter award ranking
3. **Awards** — percentile-based within division, eligible students only:
   - Bronze: 70–80th percentile
   - Silver: 80–90th percentile
   - Gold: 90–96th percentile
   - Platinum: 96–99th percentile
   - Champion: 99–100th percentile (or Rank 1–3)

---

## User Roles
| Role | Can do |
|---|---|
| `athlete` | Join Heats, compete, view own results |
| `teacher` | Create Heats, manage classes, view results, attest |
| `parent` | View child's results |
| `school_admin` | Manage school, view all teachers/students |

---

## Auth System
- Provider: Supabase Auth (email/password)
- Client: `createClient()` from `src/lib/supabase/client.ts`
- Context: `<AuthProvider>` wraps all routes in `src/app/layout.tsx`
- Hook: `useAuth()` returns `{ user, session, loading, isAuthenticated, signIn, signOut, hasRole }`
- RLS helper: `authorize(permission)` checks `role_permissions` table (SECURITY DEFINER)

---

## Development Conventions

1. **PowerShell only** — all commands use absolute paths
2. **BOM-free UTF-8** — use `[System.IO.File]::WriteAllText()` for file writes
3. **Complete file replacements** — never patch; always write full files
4. **Schema-first** — always verify column names from `docs/SCHEMA_AUDIT.md` before writing queries
5. **Test against Supabase** — verify INSERT/SELECT works before declaring a task done
6. **No assumptions** — if a column name is uncertain, query the database

---

## Known Issues (Critical)

Read `docs/TECHNICAL_PROBLEM_DESCRIPTION.md` for the full list. Top blockers:

1. `heat-engine.ts` sends wrong column names → NEEDS REWRITE
2. Student join flow broken → wrong columns in `heat_participations`
3. Question delivery not wired → `QuestionService` exists but isn't called during Heat creation
4. Division data mismatches rulebook → needs UPDATE
5. Award system not built → no percentile calculation, no award assignment
6. Orphaned `topics` table → create-heat should query `unit_topics` instead

---

## Files to Read Before Each Sprint

| Sprint | Read first |
|---|---|
| **Every sprint** | This file (`PROJECT_CONTEXT.md`) + `docs/SCHEMA_AUDIT.md` |
| Sprint 0 | `docs/MVP_BLUEPRINT_SPRINTS.md` (Sprint 0 section) + `docs/NC_Math_1.json` |
| Sprint 1 | `src/lib/competition/heat-engine.ts` + `src/lib/competition/question-service.ts` + `src/lib/competition/generators.ts` |
| Sprint 2 | `src/app/compete/create/page.tsx` + Sprint 1 output |
| Sprint 3 | `src/app/compete/page.tsx` + `src/app/compete/[code]/page.tsx` |
| Sprint 4 | `src/lib/competition/visual-generators.ts` + `src/lib/competition/validation.ts` + `src/components/competition/` |
| Sprint 5 | `src/lib/league-engine.ts` (EloEngine, StandingsCalculator) + `src/lib/identity-resolver.ts` |
| Sprint 6 | Landing page (`src/app/page.tsx`) + all component files |

---

## MVP Definition (20-Step Flow)

```
1. Teacher logs in
2. Teacher navigates to /compete/create
3. Teacher selects DIVISION (Advanced/JV/SV — others greyed "Coming soon")
4. System loads available COURSES for that division (MVP: NC Math 1 only)
5. Teacher picks UNIT TOPIC (8 options + "Mixed")
6. Teacher picks Difficulty (Bronze/Silver/Gold/Platinum)
7. Teacher picks Integrity Level (Practice → National)
8. Teacher clicks Create Heat
9. System generates questions (generator + visual + static mix from atomic_concepts)
10. Heat code displayed → Teacher lands in lobby
11. Student logs in, enters code at /compete
12. Student enters lobby, sees other participants
13. Teacher clicks Start → Countdown → Heat begins
14. Student sees questions one at a time with timer
15. Student submits answers → instant feedback
16. Heat timer expires → Heat closes
17. CTA scores calculated
18. Eligibility gate: ≥60% → enters award ranking
19. Percentile ranking within division → Awards assigned
20. Results page: leaderboard + awards + concept mastery
```

**This is the ONLY goal. Nothing else matters until all 20 steps work.**

---

*Precision tools built to stay. © 2026 Mpingo Systems LLC*
