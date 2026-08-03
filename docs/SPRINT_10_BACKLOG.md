# Sprint 10 Backlog — Assessment Polish & RBAC

## Issues to Fix

### 1. Assessment RBAC (High Priority)
- **Problem:** `/assessment/generate` and `/assessment/preview` are accessible to any authenticated user
- **Fix:** Add server-side role check — only `teacher` and `parent` roles may access these pages
- **Files:** `src/app/assessment/generate/page.tsx`, `src/app/assessment/preview/page.tsx`
- **Approach:** Use `getCurrentProfile()` from `@/lib/supabase/server` and redirect to `/dashboard` if role is not `teacher` or `parent`

### 2. Slow Initial Load (Medium Priority)
- **Problem:** First load of `/assessment/generate` is slow until hard refresh
- **Likely cause:** Generator registry (`src/lib/competition/generators.ts`) is a large module (~9,000 lines) loaded cold on first request
- **Fix options:**
  - Add `export const dynamic = 'force-static'` or `export const revalidate = 3600` to the page
  - Pre-warm by splitting the generator registry into lazy-loaded chunks by grade band
  - Add a loading skeleton so the slow load is not jarring

### 3. Double Page Numbering in Print Preview (Low Priority)
- **Problem:** Page numbers appear twice on the printed PDF
- **Likely cause:** CSS `@page { counter-increment: page }` conflicting with a manual `<span>Page X of Y</span>` in the HTML template
- **Fix:** Remove the manual page number span from the HTML and rely solely on CSS `@page` counter, OR remove the CSS counter and keep only the manual span
- **Files:** `src/app/assessment/preview/page.tsx` or the assessment PDF template component

## Notes
- Assessment feature is teacher/parent only — not for students
- The generate page UI is well-built (Division → Course → Topics → Document Type flow)
- The preview output quality is good — clean two-section layout (Multiple Choice + Free Response)
