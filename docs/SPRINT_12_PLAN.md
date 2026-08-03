# Sprint 12 Plan: Heat Config Builder UI

## Overview
The current heat creation flow (`src/app/compete/create/page.tsx`) uses a rigid 7-step sequential wizard. While functional, it is slow for power users (teachers) who want to quickly spin up a heat with their preferred settings. 

Sprint 12 focuses on refactoring the Heat Creation experience into a **single-page Config Builder UI**. This will allow teachers to see all settings at a glance, adjust sliders and dropdowns instantly, and launch a heat with fewer clicks. It will also better integrate the `league_id` and `scope` pre-fills introduced in Sprint 9.

## Goals
1. **Flatten the Wizard**: Convert the 7-step wizard into a unified, two-column dashboard/form layout.
2. **Preserve State Logic**: Maintain the complex cascading state (Division → Course → Topics → Concepts).
3. **Enhance League Integration**: Clearly show when a heat is linked to a league (via URL params from Sprint 9) and lock the course/topic selection if dictated by the league scope.
4. **Improve UX/Speed**: Allow teachers to save "default" settings or launch immediately without clicking "Next" 6 times.

## UI Architecture (Wireframe Description)

The new `/compete/create` page will adopt a split-pane design:

### Left Pane: Configuration Form
The left pane will feature a scrollable form divided into logical, collapsible sections, all expanded by default to provide immediate access. The "Audience & Content" section will house the Division dropdown (JR, INT, ADV, JV, SV), a dynamically filtered Course dropdown, and the existing `TopicTreeNode` component embedded inline for concept selection. The "Competition Format" section will contain the Mode selector (Sprint, Target, Practice, Championship, Quiz, Test) and the Profile selector (Warm-Up, Standard, Challenge, Deep). Finally, the "Rules & Integrity" section will offer sliders for Question Count (5 to 50) and Duration (5 to 60 minutes), along with toggles for the Integrity Level (Practice, Focus, Lockdown).

### Right Pane: Summary & Launch (Sticky)
The right pane will serve as a sticky sidebar that updates in real-time as the teacher modifies the configuration on the left. It will prominently feature a League Linkage Banner indicating if the heat is tied to a specific league (e.g., "🏆 Linked to [League Name]"). Below the banner, a Live Summary will present a clean, continuously updated list of the current selections, including Course, Topics, Question Count, Time, and Mode. The pane will culminate in a large "Create Heat" launch button, which will remain disabled with clear error or warning states (such as "Select at least one topic to continue") until all required fields are satisfied.

## Data Model & State Management Changes

Currently, state is managed via dozens of `useState` hooks (e.g., `selectedDivision`, `selectedCourse`, `questionCount`). 
- **Refactor to `useReducer` or Zustand**: To manage the complex cascading updates (e.g., changing a Division must clear the Course and Concept selections), we will consolidate the form state into a single reducer or a local Zustand store.
- **URL Parameter Hydration**: The `league_id` and `scope` parameters (from `StartLeagueHeatButton`) will initialize the store, optionally locking the `Division` and `Course` fields if the league is strictly bound to a specific course.

## Implementation Steps

The implementation will be executed in five distinct steps to ensure a smooth transition from the old wizard to the new builder.

| Step | Focus Area | Description |
|---|---|---|
| 1 | State Consolidation | Create a new `useHeatConfigState.ts` hook or local reducer in `src/app/compete/create/` to unify all `useState` variables from `page.tsx`. Implement handlers for cascading clears, ensuring that changing a top-level selection like Division automatically resets dependent fields like Course and Concepts. |
| 2 | Split-Pane Layout | Restructure `src/app/compete/create/page.tsx` into a responsive CSS Grid (`grid-cols-1 lg:grid-cols-3`). The left column (`col-span-2`) will host the new `ConfigForm` component, while the right column (`col-span-1`) will contain the `StickySummary` component. |
| 3 | UI Migration | Extract the existing `TopicTreeNode` and Mode selectors from their legacy `SectionCard` wrappers and integrate them directly into the new `ConfigForm` sections. Remove the sequential Next/Back buttons in favor of immediate, unified state updates. |
| 4 | League Pre-fill Logic | Update the `useEffect` hook that parses `searchParams.get('scope')`. If a scope such as NC Math 3 is provided, the system must automatically select the appropriate division and course. Visual indicators, like lock icons or informational banners, must be added to explain when content selections are locked to match a League's predefined scope. |
| 5 | Testing & Validation | Rigorously test the new flow to verify that standard ad-hoc heat creation functions correctly. Ensure that initiating a heat via the "Start League Heat" button on a League Dashboard accurately pre-fills the builder. Finally, confirm that the `createHeat` Supabase RPC receives the exact same payload structure as the legacy implementation. |

## Exit Criteria

The sprint will be considered complete when the legacy 7-step wizard is entirely removed from the codebase. Teachers must be able to configure and launch a heat seamlessly from a single, unified screen. Furthermore, league-linked heats must correctly and automatically pre-fill the course and topic selections based on the URL scope parameters provided by the dashboard. The resulting user interface must be fully responsive, gracefully stacking vertically on mobile devices while maintaining the split-pane design on larger screens.
