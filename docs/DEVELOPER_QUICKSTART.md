# MathAthlone — Developer Quick-Start

> Last updated: Sprint 11 (August 2026)

This guide gets a new developer from zero to a running local environment in under 15 minutes.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22+ | Use `nvm` or `fnm` |
| pnpm | 9+ | `npm i -g pnpm` |
| Supabase CLI | 1.200+ | `brew install supabase/tap/supabase` |
| Git | any | — |

---

## 1. Clone and install

```bash
git clone https://github.com/your-org/mathathlone-app.git
cd mathathlone-app
pnpm install
```

---

## 2. Environment variables

Copy the example file and fill in the Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://yhqxxgqfpgcertsqibps.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>
SUPABASE_SECRET_KEY=<Supabase secret key>
```

All three values are in the Supabase dashboard under **Project Settings → API Keys**. Keep `SUPABASE_SECRET_KEY` server-only; never use a `NEXT_PUBLIC_` prefix for it.

---

## 3. Seed the database

The NC demo data (1,024 mathletes, 16 schools, full league pyramid) is seeded with:

```bash
pnpm seed:nc
```

This runs `scripts/seed-mathathlone-nc.ts` and inserts all rows idempotently.

---

## 4. Run the dev server

```bash
pnpm dev
```

Navigate to `http://localhost:3000`. Sign in with any seeded teacher account:

| Email | Password | Role |
|---|---|---|
| `mshodges@mathathlone.dev` | `MathAthlone2025!` | Teacher |
| `mrmkwambe@mathathlone.dev` | `MathAthlone2025!` | Teacher |
| `dev.teacher@test.com` | `MathAthlone2025!` | Teacher (dev) |

---

## 5. Key routes

| Route | Description |
|---|---|
| `/` | Public landing page |
| `/dashboard` | Role-based redirect (athlete/teacher/admin/broadcast/parent) |
| `/dashboard/teacher` | Teacher dashboard — classes, leagues, create heat |
| `/dashboard/admin` | School admin — teachers, classroom leagues, school league |
| `/dashboard/broadcast` | Broadcast host — live heats, active leagues, recent results |
| `/dashboard/parent` | Parent — linked child's stats and recent heats |
| `/dashboard/athlete` | Athlete — ELO card, classroom league standing |
| `/compete/create` | Create a heat (teacher) |
| `/compete/[id]` | Live heat lobby and competition |
| `/league/[id]` | League dashboard (standings, bracket, championship, season) |

---

## 6. Project structure

```
mathathlone-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/league/         # League engine API routes (Sprint 4-9)
│   │   ├── compete/            # Heat creation and live competition
│   │   ├── dashboard/          # Role-based dashboards
│   │   └── league/[id]/        # League page
│   ├── components/
│   │   ├── league/             # LeagueDashboard, BracketGenerateButton
│   │   └── auth/               # MissingProfile, etc.
│   ├── lib/
│   │   ├── competition/        # generators.ts, heat-service.ts, visual-generators.ts
│   │   ├── league/             # league-engine.ts (1,471 lines)
│   │   └── supabase/           # server.ts, client.ts
│   └── types/
│       └── database.ts         # Hand-maintained TypeScript types
├── supabase/
│   ├── migrations/             # 047 SQL migration files
│   └── mathathlone-schema.sql  # Full schema dump
├── scripts/
│   ├── seed-mathathlone-nc.ts  # NC demo data seed
│   └── generator_evaluator.py  # AI-assisted generator auditing
└── docs/                       # Architecture, curriculum, sprint docs
```

---

## 7. Running the generator auditor

The Python auditor checks that math generators produce correct answers:

```bash
# Install dependencies
pip install openai

# Run the auditor (requires DEEPSEEK_API_KEY or OPENAI_API_KEY)
python3 scripts/generator_evaluator.py --course NCG7 --sample 20
```

---

## 8. Adding a new migration

```bash
# Create a new migration file
touch supabase/migrations/043_your_change.sql

# Apply it to the remote DB (requires Supabase CLI login)
supabase db push
```

Always number migrations sequentially. Never modify existing migration files.

---

## 9. TypeScript types

Types are hand-maintained in `src/types/database.ts`. After adding new columns or tables, update this file manually. The key types are:

- `UserRole` — `'athlete' | 'teacher' | 'school_admin' | ...`
- `LeagueLevel` — `'classroom' | 'school' | 'district' | 'regional' | 'state' | 'national'`
- `HeatResult` — passed to `LeagueEngineService.processHeatResult()`
- `BracketFormat` — `'single_elim' | 'double_elim' | 'swiss' | 'round_robin'`

---

## 10. Common gotchas

| Issue | Fix |
|---|---|
| `division_id IS NULL` in ELO queries returns nothing | Seeded mathletes have `division_id = ADV UUID`. Query by `games_played DESC` instead. |
| `league_id` missing on heats | Run migration `037_heats_league_id.sql` first. |
| `parent_athlete_links` table missing | Parent dashboard degrades gracefully — child shows "No athlete linked". |
| `created_by` missing from leagues select | Add `created_by` to the `.select()` call in `/league/[id]/page.tsx`. |
