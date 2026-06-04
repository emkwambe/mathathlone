# MathAthlone — Handover Summary
### Complete Project State for New Chat Session

**Date:** June 4, 2026
**Author:** Eddy Mkwambe / Mpingo Systems LLC
**Platform:** mathathlone.vercel.app
**Repo:** github.com/emkwambe/mathathlone
**Local:** C:\Users\HP\Documents\mathathlone-app

---

## 1. What MathAthlone Is

MathAthlone is a real-time competitive math platform — "Chess.com for math." Teachers create Heats (timed competitions), students join via a 6-character code, compete simultaneously on curriculum-aligned questions, and get scored on Content × Timing × Accuracy (CTA). The platform features ELO ratings, league brackets, identity scaling (classroom → nationals), and tiered integrity (Practice → National lockdown).

**Positioning:** Not just for "math kids." Built on school curriculum (NC Math standards), not trick questions. Every student can compete.

**Tagline:** "Where math becomes a sport."

---

## 2. Current State — What's Built and Deployed

### Tech Stack
- Next.js 14 + TypeScript + Tailwind CSS
- Supabase (Auth, Postgres, Realtime, RLS)
- Vercel deployment (auto-deploys on git push to main)
- Supabase project ID: yhqxxgqfpgcertsqibps

### Git Log (latest first)
```
f0e1b0e  UX: auto-format Heat code input
33b527d  docs: Curriculum Pipeline Skill + production build fixes
451410f  Generator audit: 4 math bugs fixed, 54 generators verified, visual concept naming
19a5cff  FR/MC ratio enforcement — 40% FR, 60% MC with backfill chain
bfebde1  CTA formula implementation — FR 2x weight, anti-pointsification UI
3761849  CTA Scoring Framework — research-backed document for grant applications
ad2e590  Hotfix: auth redirect loop, app_role athlete enum
fd7f788  Hotfix: FK target, RLS policies, realtime
b4cd86a  Sprint 6: Integration + Polish
401059b  Sprint 5: Results + Awards
a77bcb4  Sprint 4: Competition experience
62f751f  Sprint 3: Student join + lobby
3d040fc  Sprint 2: Create Heat page
cb9bb07  Sprint 1: Heat Engine rewrite
4f616f9  Sprint 0: Fix foundations
```

**Pending commit (not yet pushed):**
- Heat dates on teacher/student results pages
- resolveDisplayLabel() replaces "Mathlete" fallback with real names
- number_or_fraction answer type (prevents format hints from leaking answers)
- 5 generators updated: calculate_slope, perp/parallel_line_slope, exponent_zero_negative, calculate_central_tendency

### Full Flow (Verified on Production)
```
Teacher login → Dashboard → Create Heat → Share code →
Students login → Enter code → Join lobby → Teacher starts →
Countdown → Questions (FR + MC + Visual) → Timer → Focus Mode →
Student finishes → "You're done!" → Teacher ends Heat →
Results: CTA score, accuracy, concept mastery, awards, leaderboard
```

### NC Math 1 Curriculum (MVP)
- 111 atomic concepts across 8 unit topics
- 54 procedural generators (free-response, infinite unique questions)
- 12 SVG visual generators (coordinate planes, number lines, scatter plots, geometry)
- 42 static MC questions (text-based, stored in DB)
- FR/MC ratio: 40% free-response / 60% multiple choice (default)
- FR weighted 2× in CTA Content score

### Scoring System (CTA)
```
Content (40%):  FR_correct × 2 + MC_correct × 1, normalized
Timing  (30%):  coverage × 0.6 + efficiency × 0.4
Accuracy (30%): first_touch_correct / questions_attempted
Composite:      C × 0.40 + T × 0.30 + A × 0.30 → score out of 100
```

---

## 3. Database Architecture

### Key Tables
```
public.users           — profiles (id, email, display_name, role::user_role, grade_level, school_id)
user_roles             — auth hook roles (user_id, role::app_role, scope_type, scope_id, is_active)
heats                  — competitions (id, code, status, integrity_level, duration_seconds, created_by)
heat_participations    — student entries (heat_id, athlete_id, questions_attempted, is_flagged)
heat_questions         — generated questions per Heat (heat_id, generator_id, question_text, correct_answer)
question_submissions   — student answers (heat_participation_id, heat_question_id, is_correct, time_taken_ms)
heat_awards            — results (participation_id, award_level, cta_score)
atomic_concepts        — curriculum concepts (unit_topic_id, lesson_number, name)
question_generators    — generator registry (concept_id, generator_type, answer_type)
static_questions       — pre-written MC questions (concept_id as TEXT lesson_number, NOT UUID)
unit_topics            — course units (course_id, code, name)
courses                — e.g., NC Math 1
divisions              — grade bands (Rising Stars, Challengers, Contenders, Varsity)
division_curricula     — links divisions to courses
athlete_ratings        — ELO/Glicko-2 ratings
schools                — school profiles
```

### Auth Hook
`custom_access_token_hook` runs on every login. It queries `user_roles` table and injects `user_role`, `permissions`, `school_id`, `district_id` into the JWT. **Every user MUST have a row in `user_roles` or login fails.**

### RLS Notes
- All curriculum tables (unit_topics, atomic_concepts, question_generators, division_curricula) have public SELECT
- Heat-related tables require auth
- `authorize()`, `has_role()`, `user_school_id()` are all `SECURITY DEFINER` to avoid RLS recursion

---

## 4. Test Accounts

### Pilot Accounts (password: TestHeat2026!)
| Email | Display Name | Role | DB State |
|---|---|---|---|
| mshodges@mathathlone.dev | Ms. Hodges | teacher | auth ✅ profile ✅ role ✅ |
| mrmkwambe@mathathlone.dev | Mr. Mkwambe | teacher | auth ✅ profile ✅ role ✅ |
| student1@mathathlone.dev | Amara Osei | athlete G9 | auth ✅ profile ✅ role ✅ |
| student2@mathathlone.dev | Jordan Chen | athlete G10 | auth ✅ profile ✅ role ✅ |
| student3@mathathlone.dev | Priya Sharma | athlete G8 | auth ✅ profile ✅ role ✅ |
| student4@mathathlone.dev | Marcus Williams | athlete G9 | auth ✅ profile ✅ role ✅ |

### Dev Accounts (password: devpass123)
| Email | Role |
|---|---|
| dev.teacher@test.com | teacher |
| dev.mathlete.g7@test.com | mathlete |
| dev.mathlete.g10@test.com | mathlete |
| dev.admin@test.com | platform_admin |
| dev.parent@test.com | parent |
| dev.broadcast@test.com | broadcast_host |

### Creating New Accounts (3-step process)
```sql
-- Step 1: Create in Supabase Dashboard → Authentication → Users → Add User (Auto Confirm ✅)

-- Step 2: Create profile
INSERT INTO public.users (id, email, display_name, role, grade_level)
SELECT id, email, 'Display Name', 'athlete'::user_role, 9
FROM auth.users WHERE email = 'new@mathathlone.dev'
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create auth hook role
INSERT INTO user_roles (user_id, role, scope_type, scope_id, is_active)
SELECT id, 'mathlete'::app_role, 'self', id, true
FROM auth.users WHERE email = 'new@mathathlone.dev'
ON CONFLICT DO NOTHING;
```

---

## 5. Key File Locations

### Source Code
```
src/app/page.tsx                          — Landing page (enhanced, all sections)
src/app/auth/login/page.tsx               — Login page
src/app/auth/register/page.tsx            — Registration
src/app/compete/page.tsx                  — Join Heat page (auto-format code input)
src/app/compete/create/page.tsx           — Create Heat page (teacher)
src/app/compete/[code]/page.tsx           — Lobby → Active → Results (main flow)
src/app/dashboard/teacher/page.tsx        — Teacher dashboard

src/lib/competition/generators.ts         — 54 procedural question generators
src/lib/competition/visual-generators.ts  — 12 SVG visual generators
src/lib/competition/question-delivery.ts  — Assembles questions into Heats (FR/MC ratio)
src/lib/competition/scoring-service.ts    — CTA formula, calculateHeatResults()
src/lib/competition/validation.ts         — Answer validation + prenormalize()
src/lib/competition/heat-service.ts       — createHeat(), joinHeat(), endHeat(), resolveDisplayLabel()
src/lib/competition/heat-realtime.ts      — Supabase Realtime subscriptions
src/lib/competition/focus-mode.ts         — Focus detection, violation tracking
src/lib/supabase/client.ts                — Browser Supabase client
src/lib/supabase/server.ts                — Server Supabase client
src/lib/supabase/middleware.ts            — Auth middleware

src/components/competition/CompetitionView.tsx  — Main gameplay component
src/components/competition/TeacherMonitor.tsx   — Live progress view
src/components/competition/TeacherResults.tsx   — Class results + concept mastery
src/components/competition/StudentResults.tsx   — Personal results + award card
src/components/competition/focus-mode-ui.tsx    — Focus violation overlays
```

### Documentation
```
docs/PROJECT_CONTEXT.md                   — MVP flow, competition rulebook
docs/SCHEMA_AUDIT.md                      — Full schema audit
docs/CTA_SCORING_FRAMEWORK.md            — Research-backed scoring (grant-ready)
docs/CURRICULUM_PIPELINE_SKILL.md         — How JSON curriculum becomes live questions
docs/MATHATHLONE_PRICING_STRATEGY.md      — Competitive analysis, tier pricing
docs/MATHATHLONE_OPEN_PLATFORM_VISION.md  — Chess.com model, global heats, homeschool
```

### Supabase Migrations
```
supabase/migrations/001-017              — Schema, RLS, FK fixes, curriculum seeds
supabase/migrations/014c_seed_static_questions.sql  — 42 static MC questions
```

---

## 6. Known Issues & Pending Work

### Bugs to Fix
1. **"Loading Heat..." on production** — Lobby page sometimes gets stuck. Hard refresh fixes it. Likely auth session timeout when tab is inactive. Needs a loading timeout that redirects to login.
2. **Stale dashboard links** — `/analytics` and `/class/create` return 404. Remove from teacher dashboard.
3. **CTA score > 100** — Streak bonus pushes past cap (131/100 observed). Either cap display at 100 or treat >100 as a flex.
4. **Student 2 couldn't join Heat** — Pilot feedback: one student's code "was never active." Need to verify Heat was still in `lobby` status when they tried. Likely the Heat had already started.
5. **Browser extension interference** — `content.js` error from extensions. Recommend incognito for testing.

### Post-Pilot Improvements
1. **Session keep-alive** — Prevent auth timeout when tab is backgrounded
2. **Join window enforcement** — Clear error message: "This Heat has already started. Ask your teacher for the next one."
3. **Teacher sees real names always** — resolveDisplayLabel() fix is committed but not yet pushed
4. **number_or_fraction answer type** — Committed but not yet pushed. Prevents format hints from leaking whether answer is integer or fraction
5. **Heat dates on results** — Committed but not yet pushed
6. **Remove stale dashboard links** — /analytics and /class/create
7. **ELO ratings end-to-end test** — RLS policies added but not confirmed writing
8. **Cosmetic generator issues** — 4 generators output "1x" instead of "x" when coefficient is ±1

### Future Features (Not Started)
1. **Global auto-heats** — Cron-based, division-matched, country representation (see OPEN_PLATFORM_VISION.md)
2. **Assessment framework migration** — Replace Bronze/Silver/Gold/Platinum with MathPivot 3-axis system
3. **Integrity-level scaling** — Scale question count and FR/MC ratio by integrity level
4. **Additional courses** — Math 2, Pre-Calc, Math 3-4, Grade 7-8 math
5. **Stripe integration** — Free/Pro/School/District tiers (see PRICING_STRATEGY.md)
6. **Family plan** — Homeschool families ($99/yr)
7. **Creator affiliate program** — TikTok/YouTube educator referrals

---

## 7. Deployment Configuration

### Vercel
- Project: mathathlone
- URL: mathathlone.vercel.app
- Auto-deploys on push to main
- Environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL` = https://yhqxxgqfpgcertsqibps.supabase.co
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (set in Vercel dashboard)

### Supabase Auth URL Config
- Site URL: https://mathathlone.vercel.app
- Redirect URLs: https://mathathlone.vercel.app/** , http://localhost:3000/**

### Production Build Requirements
- Auth pages wrapped in Suspense boundary
- middleware.ts/server.ts: cookiesToSet type annotations
- next.config.js: `missingSuspenseWithCSRBailout: false` experimental flag
- Supabase Realtime enabled on: heats, heat_participations, question_submissions

---

## 8. Development Rules

1. **PowerShell only** — Always use absolute paths, never `cd` first
2. **NEVER run `pnpm add` or `pnpm remove` in apps/cli/** — N/A for MathAthlone but applies to RealityDB
3. **BOM-free UTF-8** — Use `[System.IO.File]::WriteAllText()` for file writes
4. **User-facing:** "Mathlete" not "athlete" (DB stays `athlete`)
5. **Complete file replacements over patches** — Safer for Claude Code
6. **Atomic git commits** — One feature per commit
7. **Research-backed enum distributions** — All template data must cite sources
8. **Trio workflow:** Claude Chat plans → Claude Code executes → Eddy verifies locally

---

## 9. Pilot Test Results (June 4, 2026)

### What Worked
- Teacher created Heat successfully on production
- Question pipeline verified: 2 FR + 1 static MC + 2 visual MC = 5Q at 40/60 ratio
- Student logged in, answered all 5 questions, scored 5/5 Champion
- Focus Mode detected tab switch, flagged student, applied +5s penalty
- CTA scoring calculated (131/100 — streak bonus exceeded cap)
- Concept mastery heatmap showed 5/5 concepts mastered
- Teacher results page showed award distribution, leaderboard, CSV export

### What Didn't Work
- Second student's Heat code "was never active" — likely tried to join after Heat started
- Format hint "Enter a whole number" leaked that perpendicular slope answer was integer (fixed, not pushed)
- Teacher leaderboard showed "Mathlete" instead of real name (fixed, not pushed)
- No date on results pages (fixed, not pushed)

### Pilot Observation
Students need clear instructions: ALL students must join BEFORE teacher starts the Heat. Once started, lobby closes.

---

## 10. Curriculum Expansion Roadmap

### Expansion Order (bottom-up strategy)

Build fundamentals first, then layer high school courses on top. Each course reuses generator patterns from the one before it.

| Phase | Course | Grade Band | Division | Generator Est. | Priority |
|---|---|---|---|---|---|
| **Phase 1** | NC Math 1 (MVP) | 9-10 | Varsity | 54 ✅ done | ✅ Shipped |
| **Phase 2** | Grade 7 Math | 7 | Challengers | ~40 new | **Next** |
| **Phase 3** | Grade 8 Math | 8 | Contenders | ~35 new | After Phase 2 |
| **Phase 4** | NC Math 2 | 10-11 | Varsity | ~30 new | After Phase 3 |
| **Phase 5** | NC Math 3 | 11-12 | Varsity | ~25 new | After Phase 4 |
| **Phase 6** | Pre-Calculus | 11-12 | Varsity | ~20 new | After Phase 5 |
| **Phase 7** | Grade 5-6 Math | 5-6 | Rising Stars | ~30 new | When demand exists |

### Why This Order

1. **Grade 7 first** — Largest untapped student population. Concepts (ratios, proportions, integers, basic geometry) are foundational and generator patterns transfer up.
2. **Grade 8 next** — Bridges to high school. Introduces linear functions, Pythagorean theorem, basic statistics. Many generators overlap with Math 1 at lower difficulty.
3. **Math 2 after** — Builds on Math 1 generators. Adds trigonometry, circles, quadratic applications. ~30% of generators are extensions of existing ones.
4. **Math 3 / Pre-Calc later** — Smaller audience, more complex generators (polynomials, logarithms, sequences). Worth building once the platform has traction.

### Generator Strategy: New Pools Per Course (Not Reuse)

Each course MUST have its own unique generator pool. Reusing Math 1 generators with different parameter ranges creates recognizable patterns across schools, classes, and grade levels. A student who competes frequently would see the same "Solve: ax + b = c" structure everywhere — just with different numbers.

Instead, each course gets generators with **genuinely different question frames** appropriate to that grade's curriculum emphasis:

```
Grade 7 (proportional reasoning emphasis):
  "A recipe calls for 3 cups of flour for 12 cookies. How many cups for 30?"
  "The map scale is 1 inch = 15 miles. Two cities are 4.5 inches apart. How far?"

Grade 8 (functions and modeling emphasis):
  "A pool drains at 50 gallons/minute. It holds 1,200 gallons. Write an equation for the water level after t minutes."
  "The scatter plot shows hours studied vs test score. Estimate the score for 6 hours."

Math 1 (abstract algebra emphasis):
  "Solve: 3x + 7 = 22"
  "Write the equation of a line through (2, 5) with slope -3."

Math 2 (trig and circles emphasis):
  "Find sin(A) in the right triangle with legs 5 and 12."
  "A central angle of 60° subtends an arc. Find the arc length if r = 8."
```

Same underlying math concepts, completely different student experience. This means:
- Phase 2 (Grade 7) builds **~40 entirely new generators** — no reuse from Math 1
- Phase 3 (Grade 8) builds **~35 entirely new generators** — no reuse from Grade 7 or Math 1
- Cross-school Heats within the same course still randomize parameters, but adding MORE generators per course further reduces pattern recognition
- Target: **minimum 40 generators per course** to keep Heats fresh across an entire school year

### Assessment Framework Integration

The current MVP uses Bronze/Silver/Gold/Platinum difficulty tiers. The long-term plan is to migrate to the MathPivot 3-axis assessment framework:

```
Axis 1: Cognitive Demand (recall → application → analysis → synthesis)
Axis 2: Complexity (single-step → multi-step → multi-concept)
Axis 3: Context (abstract → semi-real → real-world)
```

**When to integrate:** After Grade 7 + Grade 8 are built. The 3-axis framework requires enough concept breadth to meaningfully differentiate along all three axes. With 3 courses (G7 + G8 + M1), the framework becomes useful.

**How it affects generators:** Each generator gets tagged with its position on all 3 axes instead of a single difficulty integer. The question-delivery pipeline selects questions that match the target profile for the Heat type.

**Assessment framework docs:**
- `docs/assessment_framework_explained.pdf` — Full framework with examples
- `docs/Assessment_framework_new_paradigm.pdf` — Detailed paradigm shift document

### Adding a New Course (Step-by-Step)

See `docs/CURRICULUM_PIPELINE_SKILL.md` for the full 6-step process:
1. Create JSON curriculum file
2. Write SQL migration (course → unit_topics → atomic_concepts → generators)
3. Implement generators in generators.ts
4. Add static MC questions
5. Add visual SVG generators (if needed)
6. Test pipeline end-to-end

---

## 11. Immediate Next Steps

1. **Push pending fixes** — dates, real names, number_or_fraction
2. **Clean up stuck Heats** — Any Heat in `calculating` status for >10 min should be cleaned:
   ```sql
   UPDATE heats SET status = 'completed' WHERE status = 'calculating' AND updated_at < NOW() - INTERVAL '10 minutes';
   ```
3. **Add join window error** — "This Heat has already started" instead of infinite loading
4. **Remove stale dashboard links** — /analytics, /class/create
5. **Add loading timeout** — If lobby doesn't load in 10s, show "Session expired" with login link
6. **Run full pilot with 3+ students** — All join before teacher starts

---

*Precision tools built to stay. © 2026 Mpingo Systems LLC*
