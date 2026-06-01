# CLAUDE CODE PROMPT — Sprint 6: Integration + Polish

## READ FIRST (mandatory, in this order)
1. `docs/PROJECT_CONTEXT.md` — MVP definition, division structure, naming conventions
2. `docs/MVP_BLUEPRINT_SPRINTS.md` — Sprint 6 task list
3. `src/app/page.tsx` — landing page (needs division name + pricing updates)
4. `src/app/compete/create/page.tsx` — verify it works end-to-end
5. `src/app/compete/[code]/page.tsx` — verify all states work
6. `src/components/competition/CompetitionView.tsx` — check for edge cases
7. `src/components/competition/StudentResults.tsx` — check for edge cases
8. `src/components/competition/TeacherResults.tsx` — check for edge cases

## CONTEXT

Sprints 0-5 built the complete Heat flow: create → join → lobby → countdown → compete → results + awards. This final sprint connects loose ends, polishes the UI, handles edge cases, and ensures the MVP is demo-ready.

## SPRINT 6 GOAL

Make the platform demo-ready: fix all integration issues, polish UI, handle errors gracefully, update the landing page, and ensure mobile responsiveness.

## TASK 1: Landing Page Updates

Update `src/app/page.tsx`:

### 1a. Division names
Replace any references to the old D1-D4 / Rising Stars / Challengers / Contenders / Varsity with the official rulebook names:
- Junior (Grades 3-4)
- Intermediate (Grades 5-6)  
- Advanced (Grades 7-8)
- Junior Varsity (Grades 9-10)
- Senior Varsity (Grades 11-12)

Keep the fun icons but use the official names. Mark Junior and Intermediate as "Coming soon" visually.

### 1b. Pricing section
Add a pricing section between the Educator section and the Final CTA. Four cards:

```
┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Free    │  │  Pro         │  │  School      │  │  District    │
│  $0      │  │  $7/mo       │  │  $4/student  │  │  $2.50/stud  │
│          │  │  $59/year    │  │  /year       │  │  /year       │
│ 3 class  │  │ Unlimited    │  │ All teachers │  │ All schools  │
│ 30 std/c │  │ All features │  │ Admin dash   │  │ Cross-school │
│ Practice │  │ All levels   │  │ SSO          │  │ API access   │
│          │  │              │  │              │  │              │
│[Current] │  │[Upgrade →]   │  │[Contact →]   │  │[Contact →]   │
└──────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

Design: clean cards with clear hierarchy. Pro card should have a subtle highlight (recommended). Free and Pro have action buttons. School and District have "Contact us" links to mailto:eddy@mpingosystems.com.

### 1c. Update stats
Update the hero stats to reflect actual system state:
- "84" → "111" atomic concepts (actual count from Sprint 0)
- "54+" → "66+" question generators (54 procedural + 12 visual)
- Keep "6 competition levels" and "5 divisions" (update from 4)

### 1d. Identity showcase
If the identity showcase section still shows the old division names, update to match the rulebook.

## TASK 2: Favicon

Create a simple favicon:
- Create `public/favicon.ico` — a simple 32x32 icon
- Use an SVG-based approach: create `src/app/icon.tsx` (Next.js 14 metadata icon) that renders a simple "M" in indigo with an amber accent
- Or create `public/favicon.svg` and reference it in the root layout

Simplest approach:
```typescript
// src/app/icon.tsx
import { ImageResponse } from 'next/og';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';
export default function Icon() {
  return new ImageResponse(
    <div style={{ width: 32, height: 32, background: '#4338ca', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontSize: 20, fontWeight: 700 }}>M</div>,
    { ...size }
  );
}
```

## TASK 3: Error Handling Audit

Review all competition pages and components for unhandled errors:

### 3a. Network failures
- Supabase queries that fail should show user-friendly messages, not blank screens
- Add try/catch around all major data fetches
- Show "Something went wrong. Please try again." with a retry button

### 3b. Auth edge cases
- Session expires during a Heat → show "Session expired" message with login link, NOT a crash
- User navigates to /compete/create without being logged in → redirect to login (already done in Sprint 2, verify)
- Student tries to access teacher-only features → appropriate message

### 3c. Heat edge cases
- Heat code doesn't exist → "Heat not found" (verify)
- Heat already completed → show results (verify)
- Teacher closes browser during active Heat → students can still complete; timer handles end
- Student refreshes during competition → should resume where they left off (question progress from DB)
- No questions generated (empty heat_questions) → show error instead of blank competition view

### 3d. Empty states
- No Heats created yet on teacher dashboard → show "Create your first Heat" CTA
- No participations on student dashboard → show "Join a Heat to get started"
- Zero participants in lobby → show "Waiting for Mathletes to join..."

## TASK 4: Mobile Responsiveness Audit

Check all competition pages at 375px viewport:

### Pages to verify
- Landing page (/) — already responsive from Sprint design
- Join Heat (/compete) — should be centered, full-width input
- Create Heat (/compete/create) — wizard steps should stack vertically on mobile
- Lobby (/compete/[code]) — participant grid should collapse to 1-2 columns
- Competition (CompetitionView) — question + answer should be full-width, timer visible
- Results (StudentResults, TeacherResults) — stats should wrap, leaderboard should scroll horizontally

### Fixes needed
- Add `overflow-x-auto` on leaderboard tables
- Stack stat tiles vertically on mobile (grid-cols-2 → grid-cols-3 → grid-cols-6 based on breakpoint)
- Ensure countdown numbers aren't clipped on small screens
- Touch targets minimum 44px for MC answer buttons

## TASK 5: Dashboard Links

Update the teacher and student dashboards to link to competition features:

### Teacher dashboard (`src/app/dashboard/teacher/page.tsx`)
Add a "Competition" section or quick action:
- "Create a Heat" button → /compete/create
- "Recent Heats" list (if any) — query last 5 heats by this teacher
- Each Heat shows: code, topic, date, participant count, status

### Student/Athlete dashboard (`src/app/dashboard/athlete/page.tsx`)
Add:
- "Join a Heat" button → /compete
- "My Recent Results" — query last 5 heat_participations for this user
- Each result shows: Heat code, date, rank, award badge, CTA score

Keep changes minimal — add sections to existing dashboards, don't rewrite them.

## TASK 6: Navigation

Ensure navigation between pages works smoothly:

- Landing page nav links work: Features, Live Demo, Leagues, For Educators → smooth scroll
- "Get started free" → /auth/register
- "Log in" → /auth/login
- After login → redirect to appropriate dashboard (/dashboard/teacher or /dashboard/athlete)
- Dashboard → /compete/create (teacher) or /compete (student)
- After Heat creation → /compete/[code]
- After Heat completion → results stay on /compete/[code] (no redirect needed)
- "Back" from results → /dashboard/[role]

## RULES

1. Read docs/PROJECT_CONTEXT.md before any changes
2. "Mathlete" in all user-facing text (DB role stays 'athlete')
3. Division names: Junior, Intermediate, Advanced, Junior Varsity, Senior Varsity
4. Tailwind CSS only
5. Minimal changes to existing dashboards — ADD sections, don't rewrite
6. All error messages should be friendly and actionable
7. `[System.IO.File]::WriteAllText()` for BOM-free UTF-8
8. Complete file replacement for landing page; minimal edits for dashboards

## SUCCESS CRITERIA

- [ ] Landing page has updated division names (5 official names)
- [ ] Landing page has pricing section (Free/Pro/School/District)
- [ ] Landing page stats updated (111 concepts, 66+ generators, 5 divisions)
- [ ] Favicon renders (no more 404)
- [ ] Error handling: network failures show friendly messages
- [ ] Error handling: auth expiry handled gracefully
- [ ] Error handling: empty states have helpful messages
- [ ] Mobile: all competition pages work at 375px
- [ ] Mobile: MC buttons are 44px+ touch targets
- [ ] Teacher dashboard has "Create Heat" + recent Heats
- [ ] Student dashboard has "Join Heat" + recent results
- [ ] Navigation flows work end-to-end
- [ ] Zero new TypeScript errors
- [ ] git commit: "Sprint 6: Integration + Polish — pricing, favicon, error handling, mobile, dashboard links"
