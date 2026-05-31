# CLAUDE CODE PROMPT — Sprint 3: Student Join + Lobby

## READ FIRST (mandatory, in this order)
1. `docs/PROJECT_CONTEXT.md` — MVP flow steps 9-13
2. `docs/SCHEMA_AUDIT.md` — heats, heat_participations columns
3. `docs/LIVE_QUERY_RESULTS.md` — actual column names
4. `src/lib/competition/heat-service.ts` — joinHeat(), startHeat(), getHeatByCode()
5. `src/lib/competition/heat-realtime.ts` — useHeatRealtime(), useHeatParticipants()
6. `src/app/compete/page.tsx` — current join page (may need rewrite)
7. `src/app/compete/[code]/page.tsx` — current competition page (needs rewrite)
8. `src/contexts/AuthContext.tsx` — useAuth() hook
9. `src/lib/supabase/client.ts` — createClient()

## CONTEXT

Sprint 2 delivered the Create Heat page. After a teacher creates a Heat, they're redirected to `/compete/[code]`. That page needs to serve as:
- **Lobby view (teacher):** see participants joining, "Start Heat" button
- **Join + lobby view (student):** enter code → join → wait in lobby → countdown → start

The Heat lifecycle is:
```
lobby → countdown (5s) → active → calculating → complete
```

heat-service.ts has: `joinHeat(supabase, code)`, `startHeat(supabase, heatId)`, `getHeatByCode(supabase, code)`
heat-realtime.ts has: `useHeatRealtime(heatId)`, `useHeatParticipants(heatId)`

## SPRINT 3 GOAL

Build two pages that handle the full join-to-countdown flow:
1. `/compete` — Student enters a Heat code
2. `/compete/[code]` — Lobby (both teacher and student views) with realtime participant list and countdown

## TASK 1: Rewrite /compete/page.tsx (Join Heat)

### Requirements

- Clean, focused page — student enters a 6-character Heat code
- Input auto-capitalizes, limits to 6 chars, validates format
- On submit: verify Heat exists and is joinable (status = 'lobby' or 'open')
- If valid: call `joinHeat(supabase, code)` then redirect to `/compete/[code]`
- If invalid: show error ("Heat not found", "Heat already started", etc.)
- Works for both authenticated and unauthenticated users:
  - Authenticated: join directly
  - Unauthenticated: redirect to `/auth/login?next=/compete` with code preserved
- Mobile-friendly: large input, big button, minimal UI
- Design: dark gradient background (matching landing page hero), centered card

### UI mockup
```
┌─────────────────────────────────────┐
│                                     │
│       🔥 Join a Heat               │
│   Enter your 6-character code       │
│                                     │
│      ┌───────────────────┐          │
│      │    MA-7X4K         │         │
│      └───────────────────┘          │
│                                     │
│      [ Join Heat → ]                │
│                                     │
│   Or create a new Heat              │
│                                     │
└─────────────────────────────────────┘
```

## TASK 2: Rewrite /compete/[code]/page.tsx (Lobby + Competition Host)

This is the most important page — it serves multiple roles based on Heat status and user role.

### Page states

**State 1: LOBBY (status = 'lobby' or 'open')**

Teacher view:
```
┌─────────────────────────────────────────────┐
│  🔥 Heat MA-7X4K                           │
│  NC Math 1 · Equations & Inequalities       │
│  Sprint · 20 questions · Silver · Practice  │
│                                             │
│  Share this code with your Mathletes:       │
│  ┌─────────────────────────┐                │
│  │     MA-7X4K             │  📋 Copy      │
│  └─────────────────────────┘                │
│                                             │
│  Participants (3/∞)                         │
│  ┌─────────────────────────────────────┐    │
│  │ 🟢 Amara O.                        │    │
│  │ 🟢 Jordan C.                       │    │
│  │ 🟢 Priya S.                        │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [ Start Heat 🚀 ]                         │
│                                             │
└─────────────────────────────────────────────┘
```

Student view (after joining):
```
┌─────────────────────────────────────────────┐
│  🔥 Heat MA-7X4K                           │
│  NC Math 1 · Equations & Inequalities       │
│                                             │
│  Waiting for teacher to start...            │
│  ⏳ (animated spinner)                      │
│                                             │
│  Participants (3)                           │
│  🟢 Amara O. (you)                         │
│  🟢 Jordan C.                              │
│  🟢 Priya S.                               │
│                                             │
└─────────────────────────────────────────────┘
```

**State 2: COUNTDOWN (status = 'countdown')**
Both teacher and student see:
```
┌─────────────────────────────────────────────┐
│                                             │
│            GET READY!                       │
│                                             │
│              3                              │
│         (big animated number)               │
│                                             │
│    20 questions · 15 minutes                │
│                                             │
└─────────────────────────────────────────────┘
```

5-second countdown, numbers animate large. After countdown, status changes to 'active' and page transitions to the competition view (Sprint 4 will build this — for now show a placeholder "Heat is active" message).

**State 3: ACTIVE (status = 'active' or 'in_progress')**
For Sprint 3, just show a placeholder:
```
"Heat is active — competition UI coming in Sprint 4"
```

**State 4: COMPLETE (status = 'complete' or 'calculating')**
Show a placeholder:
```
"Heat complete — results coming in Sprint 5"
```

**State 5: INVALID**
If the code doesn't match any Heat, show:
```
"Heat not found. Check your code and try again."
[ Back to /compete ]
```

### Realtime requirements

- Use `useHeatRealtime(heatId)` from heat-realtime.ts to subscribe to Heat status changes
- Use `useHeatParticipants(heatId)` to get live participant list
- When teacher clicks "Start Heat":
  1. Call `startHeat(supabase, heatId)` from heat-service.ts
  2. Status changes to 'countdown' → all connected clients see the countdown
  3. After 5 seconds, status changes to 'active'
- Participant list updates in real-time as students join
- Show participant count: "Participants (3)"
- Show each participant's display_name (from users table JOIN)

### Auto-join logic

When a student navigates to `/compete/[code]`:
1. Check if they're already a participant (query heat_participations)
2. If yes: show lobby/waiting view
3. If no and Heat status is 'lobby'/'open': auto-join via `joinHeat()`
4. If no and Heat already started: show "This Heat has already started"

### Data loading

```typescript
// Load Heat details
const heat = await getHeatByCode(supabase, code);

// Load Heat metadata (topic name, division name)
// JOIN heats → unit_topics → courses, heats → divisions

// Check participation
const { data: participation } = await supabase
  .from('heat_participations')
  .select('*')
  .eq('heat_id', heat.id)
  .eq('athlete_id', user.id)
  .single();

// Determine if current user is the teacher (heat.created_by === user.id)
const isTeacher = heat.created_by === user.id;
```

## TASK 3: Verify heat-service.ts functions work

Test these functions work correctly with the actual schema:
- `getHeatByCode(supabase, code)` — returns Heat with all columns
- `joinHeat(supabase, code)` — creates participation record
- `startHeat(supabase, heatId)` — transitions lobby → countdown → active
- `listHeatParticipants(supabase, heatId)` — returns participants with display_name

If any function is missing or broken, fix it in heat-service.ts.

## TASK 4: Update compete pages routing

Ensure the Next.js routing works:
- `/compete` → `src/app/compete/page.tsx` (join page)
- `/compete/create` → `src/app/compete/create/page.tsx` (create page, Sprint 2)
- `/compete/[code]` → `src/app/compete/[code]/page.tsx` (lobby/competition)

The `[code]` dynamic segment should extract the Heat code from the URL params.

## DESIGN REQUIREMENTS

- Dark gradient background for the lobby (matches landing page hero: indigo-900 → purple-900)
- White/light cards for content areas
- Participant list: green dot + display_name, subtle animation on new joins
- Countdown: large centered numbers with scale animation
- Copy-to-clipboard for Heat code with tooltip feedback
- Mobile responsive (375px+)
- Loading states for all async operations
- "Mathlete" in all user-facing text

## RULES

1. Read docs/PROJECT_CONTEXT.md and docs/SCHEMA_AUDIT.md before writing any code
2. Use ACTUAL column names from LIVE_QUERY_RESULTS.md
3. heat_participations: `questions_attempted`, `finished_at`, `total_time_ms`, `accuracy_score` — NO `display_name` (JOIN to users)
4. Use `createClient()` from `@/lib/supabase/client`
5. Use hooks from `heat-realtime.ts` for realtime — no raw channel subscriptions in page code
6. Complete file replacements
7. `[System.IO.File]::WriteAllText()` for BOM-free UTF-8
8. User-facing: "Mathlete" not "athlete"

## SUCCESS CRITERIA

- [ ] `/compete` page: student enters code, joins Heat, redirects to lobby
- [ ] `/compete/[code]` page: teacher sees lobby with participant list + "Start Heat" button
- [ ] `/compete/[code]` page: student sees lobby with "Waiting for teacher" + participant list
- [ ] Participant list updates in real-time as students join
- [ ] Teacher clicks Start → countdown (5-4-3-2-1) visible to all connected clients
- [ ] After countdown → status becomes 'active' (placeholder UI for now)
- [ ] Invalid codes show error, already-started Heats show appropriate message
- [ ] Auto-join: student navigating to /compete/[code] auto-joins if Heat is in lobby
- [ ] Mobile responsive
- [ ] Zero new TypeScript errors
- [ ] git commit: "Sprint 3: Student join + lobby — realtime participants and countdown"
