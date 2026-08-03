# MathAthlone — Sprint Changelog

Tracks all production-ready changes by sprint. Each entry lists files changed, what was added, and any DB migrations required.

---

## Sprint 6 — Broadcast, Parent & Admin Dashboards (July 2026)

### Files changed

| File | Change |
|---|---|
| `src/app/dashboard/admin/page.tsx` | Full replacement of stub — school stats, classroom league grid, teacher table, advancement alert |
| `src/app/dashboard/broadcast/page.tsx` | Full replacement of stub — live heats, active leagues, recent results (last 24 h) |
| `src/app/dashboard/parent/page.tsx` | Full replacement of stub — linked child's ELO, league standing, recent heat results |

### What was added

**Admin dashboard** — school admin now sees:
- 4 stat cards: mathletes, teachers, classroom leagues, school league status
- Amber alert when classroom leagues are running but no school league exists yet
- Clickable grid of all classroom leagues with status badges and advancement slots
- Full teacher roster table

**Broadcast dashboard** — broadcast hosts now see:
- Live heats (status = `'active'`) with participant counts and direct links
- Active leagues across all levels with direct links
- Recent completed heats from the last 24 hours

**Parent dashboard** — parents now see:
- Linked child's profile card with ELO rating, league rank, and W/L record
- Direct link to the child's classroom league
- Recent heat results table (last 10)
- Graceful "No athlete linked" state when `parent_athlete_links` has no row

### DB migrations required
None. Reads from existing tables only.

---

## Sprint 5 — Classroom League UI (July 2026)

### Files changed

| File | Change |
|---|---|
| `src/app/league/[id]/page.tsx` | Fetches `league_advancement` row; passes `advancementInfo` to `LeagueDashboard` |
| `src/components/league/LeagueDashboard.tsx` | Classroom-aware rendering: advancement banner, first-name-only display, advancement cut-line, dynamic Championship Path |
| `src/components/league/BracketGenerateButton.tsx` | New client component — bracket generation button for league owners |
| `src/app/dashboard/teacher/page.tsx` | Each class card now has "🏫 View Classroom League →" link |
| `src/app/dashboard/athlete/page.tsx` | ELO query fixed (was filtering `division_id IS NULL`); classroom league standing card added |

### What was added

- **Advancement banner** on classroom league pages: "🎯 Top N advance to [School League name]"
- **First-name-only display** in bracket slots and standings for classroom leagues
- **Indigo gradient cut-line** with violet "▲ Advancement cut" label in standings
- **Dynamic Championship Path** — current level highlighted in indigo
- **Level icons** — 🏫 classroom/school, 🏙️ district, 🗺️ regional, 🌟 state
- **Bracket generate button** — visible to league owner only

### DB migrations required
None for this sprint.

---

## Sprint 4 — Live League Engine (July 2026)

### Files changed

| File | Change |
|---|---|
| `supabase/migrations/037_heats_league_id.sql` | Adds `league_id UUID FK → leagues` to `heats` table |
| `src/app/api/league/heat-complete/route.ts` | New: `POST /api/league/heat-complete` — triggers ELO update + standings refresh |
| `src/app/api/league/bracket/generate/route.ts` | New: `POST /api/league/bracket/generate` — generates bracket for a league |
| `src/app/api/league/split/close/route.ts` | New: `POST /api/league/split/close` — closes split, triggers advancement |
| `src/lib/competition/heat-service.ts` | `endHeat()` now calls `/api/league/heat-complete` when `league_id` is set; `league_id` added to `Heat` interface and `CreateHeatParams` |
| `src/app/compete/create/page.tsx` | League selector added (Step 6.5); `selectedLeagueId` passed to `createHeat()` |

### What was added

- **Heat → League wiring**: when a teacher ends a heat that belongs to a league, ELO ratings and standings update automatically
- **Bracket generation**: teachers can generate a bracket for their league from the league page
- **Split close / advancement**: admins can close a split to promote top-N mathletes to the next level

### DB migrations required
```bash
# Apply migration 037 to add league_id to heats
supabase db push
# or manually:
psql $DATABASE_URL < supabase/migrations/037_heats_league_id.sql
```

---

## Sprint 3 — NC Demo Data Seed (July 2026)

### What was added

- 1,024 mathletes across 16 NC middle schools, 4 districts (CMS, Union, Wake, Durham), 2 regions (Charlotte, Triangle)
- 64 classroom leagues, 64 advancement paths, 64 school memberships
- Glicko-2 ratings initialized at 1200 (ADV division)
- Standings at zero — ready for first heat

### Script
```bash
pnpm seed:nc
```

### DB migrations required
Migrations 032–036 (NC school/district/region/state hierarchy).

---

## Earlier Sprints (Sprints 0–2)

See `docs/MVP_BLUEPRINT_SPRINTS.md` for the full history of the heat engine, create-heat flow, lobby, competition, and results pages.
