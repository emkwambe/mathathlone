# Claude Code Sprint: Create Heat Redesign
# Paste this entire prompt into Claude Code

Read these files first:
1. docs/MATHATHLONE_HANDOVER_SUMMARY.md
2. src/app/compete/create/page.tsx
3. src/lib/competition/question-delivery.ts
4. src/lib/competition/heat-service.ts

## WHAT WE'RE BUILDING

A complete redesign of the Create Heat page (/compete/create) that replaces 
the current single-topic dropdown + Bronze/Silver/Gold/Platinum difficulty 
with a full top-down selection flow and 3-axis assessment presets.

## CURRENT STATE (what to replace)

- Single course (NC Math 1 hardcoded)
- Single topic dropdown OR "Mixed (all topics)"
- Difficulty: Bronze (depth 1-2), Silver (2-3), Gold (3-4), Platinum (4)
- Heat type: Sprint, Target, Practice, Championship, Official
- Integrity level: Practice, Classroom, School, School+, National

## NEW FLOW

### Step 1: Division
Auto-detect from teacher's profile (grade_level → division mapping).
Show as pill selector, editable:

  Rising Stars (5-6) | Challengers (7) | Contenders (8) | Varsity (9-12)

If teacher only teaches one division, pre-select it and show as read-only.
Divisions come from the `divisions` table.

### Step 2: Course
Filtered by selected division. Query division_curricula to get 
available courses for that division.

- If only 1 course matches → auto-select and skip
- If multiple → show as cards or radio buttons
  e.g., Varsity shows: NC Math 1 | Algebra 1 | NC Math 3

### Step 3: Topics & Concepts (multi-select tree)
Load unit_topics for the selected course, then atomic_concepts 
for each topic. Render as expandable tree with checkboxes:

  ┌──────────────────────────────────────────────────────┐
  │ Topics & Concepts                       [Select All] │
  │                                                      │
  │ ▼ ☑ Equations & Inequalities           (14 concepts) │
  │     ☑ Solving 1-step equations (add/sub)             │
  │     ☑ Solving 1-step equations (mult/div)            │
  │     ☑ Solving 2-step equations                       │
  │     ☐ Solving multi-step equations                   │
  │     ☐ Variables on both sides                        │
  │     ...                                              │
  │                                                      │
  │ ► ☐ Functions & Linear Functions       (18 concepts) │
  │ ► ☐ Systems of Equations               (8 concepts)  │
  │ ► ☑ Polynomials & Factoring       3/12 selected      │
  │     ☑ Factor GCF                                     │
  │     ☑ Factor trinomials (a=1)                        │
  │     ☐ Factor trinomials (a≠1)                        │
  │     ☑ Difference of squares                          │
  │     ☐ Perfect square trinomials                      │
  │     ...                                              │
  └──────────────────────────────────────────────────────┘

Behavior:
- Clicking a topic checkbox selects/deselects ALL its concepts
- Clicking individual concepts gives granular control  
- Topic header shows "3 of 14 selected" when partially checked
- Partial selection shows indeterminate checkbox state (dash)
- ▼/► arrow expands/collapses the concept list
- Collapsed by default, expand on click
- Minimum: at least 3 concepts selected (for a meaningful Heat)
- Show validation: "Select at least 3 concepts" if fewer selected
- "Select All" at top selects every concept across all topics

### Step 4: Heat Settings

Replace Bronze/Silver/Gold/Platinum with 3-axis presets:

  ┌─────────────┬──────────────────┬──────────────┬───────────────┐
  │ Preset      │ Cognitive Demand │ Complexity   │ Context       │
  ├─────────────┼──────────────────┼──────────────┼───────────────┤
  │ Warm-Up     │ recall           │ single_step  │ abstract      │
  │ Standard    │ application      │ mixed        │ 70/30 abs/real│
  │ Challenge   │ analysis         │ multi_step   │ 50/50 abs/real│
  │ Championship│ synthesis        │ multi_concept│ real_world    │
  └─────────────┴──────────────────┴──────────────┴───────────────┘

Show as 4 cards with icons and descriptions:
  🔥 Warm-Up      — Quick recall, single-step problems
  📐 Standard     — Apply skills to straightforward problems
  ⚡ Challenge    — Multi-step analysis, mixed context
  🏆 Championship — Synthesis across concepts, real-world scenarios

Teacher picks one preset. The preset maps to filter criteria 
for question-delivery.ts when selecting generators/static questions.

Other settings (keep as-is):
  - Question count: 5 | 10 | 15 | 20 (radio or stepper)
  - Heat type: Sprint (15 min) | Target (20 min) | Practice (no timer)
  - Integrity: Practice | Classroom | School

### Step 5: Summary + Create

Show a summary card before creating:
  "Creating a Challenge Heat with 15 questions
   Course: NC Grade 7 Math
   Topics: Ratios & Proportions (5), Expressions & Equations (3)
   8 concepts selected | ~6 FR, ~9 MC
   Heat type: Sprint (15 min) | Integrity: Classroom"

  [Create Heat →]

## QUESTION-DELIVERY.TS CHANGES

Currently receives: { unitTopicId: string | null }
Change to: { conceptIds: string[] }

If conceptIds is provided:
1. Filter question_generators WHERE concept_id IN (conceptIds)
2. Filter static_questions WHERE concept_id IN (
     SELECT lesson_number FROM atomic_concepts WHERE id IN (conceptIds)
   )
3. Filter visual generators by matching concept keys

If conceptIds is empty or "Select All" → use all concepts for the course
(backward compatible with current behavior).

Add preset filtering:
- Load the preset's 3-axis criteria
- Filter generators WHERE cognitive_demand = preset.demand 
  AND complexity = preset.complexity AND context = preset.context
- If not enough generators match the exact criteria, relax by one axis
  (context first, then complexity, then demand) to fill the question count

Relaxation order (most flexible first):
1. Try exact match on all 3 axes
2. Relax context (any context)
3. Relax complexity (any complexity) 
4. Relax demand (any demand)
5. If still short, pull from all generators for selected concepts

## HEAT-SERVICE.TS CHANGES

createHeat() currently takes:
  { unitTopicId, depthMin, depthMax, ... }

Change to:
  { conceptIds: string[], preset: 'warmup'|'standard'|'challenge'|'championship', ... }

Store in heats table:
  - Add column: preset TEXT (nullable for backward compat)
  - Add column: concept_ids TEXT[] (array of selected concept UUIDs)
  - Keep existing columns for backward compatibility

## BACKWARD COMPATIBILITY

- Existing Math 1 generators that only have difficulty (1-4) and no 
  3-axis tags: map them to presets using this fallback:
    difficulty 1-2 → warmup/standard
    difficulty 3   → challenge  
    difficulty 4   → championship
- The old depth-based filtering still works as a fallback when 
  3-axis tags are NULL

## TEACHER EXPERIENCE OPTIMIZATION

- Store teacher's last selection in localStorage:
  { division, courseId, lastPreset, lastQuestionCount, lastHeatType }
- Pre-fill on next visit so repeat Heats are one-click
- If teacher has grade_level in profile → auto-select division
- If only one course for that division → auto-select course
- A teacher who teaches Math 1 to 9th graders should reach 
  the topic picker in 0 clicks on their second visit

## FILES TO MODIFY

1. src/app/compete/create/page.tsx — complete rewrite of the form
2. src/lib/competition/question-delivery.ts — conceptIds array + preset filtering
3. src/lib/competition/heat-service.ts — new createHeat params
4. supabase/migrations/031_add_preset_and_concept_ids_to_heats.sql — schema change

## TEST CRITERIA

After building, verify:
[ ] Division auto-selects from teacher profile
[ ] Course filters by division
[ ] Topic tree loads with correct concept counts
[ ] Individual concept selection works
[ ] Topic checkbox selects/deselects all children
[ ] Partial selection shows indeterminate state
[ ] "Select All" selects everything
[ ] Cannot create Heat with fewer than 3 concepts
[ ] Preset cards show correct descriptions
[ ] Summary card shows accurate counts
[ ] question-delivery.ts receives and filters by conceptIds
[ ] Backward compatible with existing Math 1 Heats (no preset, no conceptIds)
[ ] Teacher's last selection persists across visits
