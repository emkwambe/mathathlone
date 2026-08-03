# Sprint 9: Multi-Course Scope, District Mode & Bulk Enrollment
**MathAthlone Design Document**

This sprint expands the League Engine to support the three most critical scale-up use cases: district-wide competitions, cross-grade content scopes, and frictionless classroom onboarding.

---

## 1. Multi-Course League Content Scope

Currently, the `content_scope` JSONB column on the `leagues` table supports picking exactly one course, one unit, or one standard. To support students excelling beyond grade level and mixed-grade competitions, we need to allow leagues to draw from multiple courses simultaneously.

### Schema Updates
No schema changes required. The `content_scope` column is already `JSONB` (added in migration 038). We simply expand the JSON schema definition in the app layer.

**Current JSON Shape:**
```json
{ "type": "course", "course_code": "G7", "course_name": "NC Grade 7 Math" }
```

**New JSON Shape:**
```json
{
  "type": "multi_course",
  "courses": [
    { "course_code": "G7", "course_name": "NC Grade 7 Math" },
    { "course_code": "G8", "course_name": "NC Grade 8 Math" }
  ]
}
```

### App Layer Changes
1. **League Creator UI (`src/app/league/create/page.tsx`)**:
   - Add a `multi_course` option to the ScopeType toggle.
   - When selected, render a multi-select checkbox list of all available courses instead of a single dropdown.
2. **League Create API (`src/app/api/league/create/route.ts`)**:
   - Validate the new `multi_course` JSON structure.
3. **Heat Generator (`src/lib/competition/heat-service.ts`)**:
   - When a heat is created for a multi-course league, the question delivery engine must pool generators from *all* specified courses before selecting the heat questions.

---

## 2. District League Mode

Currently, all users belong to a `school_id`, and leagues are implicitly scoped to the creator's school. District leagues need to allow students from *any* school within the same district to join.

### Schema Updates
No new columns needed. The `schools` table already has a `district_id` column (migration 007).

### App Layer Changes
1. **League Join Link Flow (`src/app/league/join/route.ts` or equivalent)**:
   - **Current Logic**: If `league.level != 'national'`, assert `user.school_id == league_creator.school_id`.
   - **New Logic**: If `league.level == 'district'`, assert `user_district_id() == league_creator_district_id()`. (Use the existing `user_district_id()` RPC from migration 006).
2. **Standings View (`src/components/league/StandingsTable.tsx`)**:
   - For district leagues, add a "School" column to the standings table so users can see which school each mathlete represents.

---

## 3. Bulk Student Enrollment

Currently, students must click a join link and self-authenticate to enter a league. Teachers need a way to bulk-enroll their entire roster instantly.

### Feature Flow
1. Teacher navigates to the League Dashboard → **Roster** tab.
2. Clicks **"Import Roster"**.
3. Pastes a CSV or list of student names (e.g., `First Last, StudentID`).
4. System automatically:
   - Creates shadow/managed user accounts for any student that doesn't exist.
   - Generates a printable PDF of "Login Cards" (Username + Auto-generated 4-digit PIN) for the teacher to hand out.
   - Inserts rows into `league_standings` to officially enroll them in the bracket.

### App Layer Changes
1. **New API Route (`POST /api/league/[id]/roster/import`)**:
   - Parses CSV data.
   - Uses Supabase Admin Auth client to create users silently.
   - Assigns them to the teacher's `school_id`.
   - Adds them to `league_standings`.
2. **New UI Component (`RosterImportModal.tsx`)**:
   - Textarea for CSV pasting.
   - Preview table showing valid rows before confirming.
3. **PDF Generator (`src/lib/pdf-generator.ts`)**:
   - Use `jspdf` or browser-print CSS to generate a grid of login cards.

---

## Implementation Sequence

| Step | Task | Estimated Effort |
|---|---|---|
| 1 | Multi-Course UI & API validation | Low |
| 2 | Heat Generator multi-course pooling | Medium |
| 3 | District League join-link logic | Low |
| 4 | District Standings UI (School column) | Low |
| 5 | Bulk Enrollment API (Admin Auth creation) | High |
| 6 | Bulk Enrollment UI & PDF Login Cards | Medium |
