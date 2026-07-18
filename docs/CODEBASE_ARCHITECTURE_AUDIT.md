# MathAthlone Codebase & Architecture Audit
**Prepared for:** Eddy Mkwambe, Technical Director, Mpingo Systems
**Date:** July 18, 2026

## Executive Summary
I have completed a deep-dive terminal audit of the MathAthlone repository (`emkwambe/mathathlone`). The architecture is highly sophisticated—particularly the curriculum generation engine and the Supabase realtime heat syncing. 

However, the audit confirms that the platform is currently blocked from completing a full MVP flow due to several severe disconnects between the database schema and the TypeScript application layer, specifically around Heat creation and the new Auth v2 implementation.

---

## 1. The Registration Blocker (Code-Level Fix)

### The "Fair Play Code" Checkbox Bug
As identified in the frontend inspection, the checkboxes on Step 3 of registration are unclickable.
*   **Root Cause:** The `disabled` attribute on the checkboxes is tied to `!hasScrolledToBottom`. The `handleScroll` function checks if `scrollTop + clientHeight >= scrollHeight - 10` on the `fairPlayRef` div. However, because the div has a fixed height (`h-64`) and the content inside it is not tall enough on larger screens to trigger an overflow, `scrollHeight` equals `clientHeight`. Thus, a scroll event is never fired, and `hasScrolledToBottom` remains `false` permanently.
*   **The Fix:** 
    1.  Add a `useEffect` that checks on mount if `scrollHeight <= clientHeight`. If true, immediately set `hasScrolledToBottom(true)`.
    2.  Alternatively, remove the scroll-to-unlock friction entirely for the MVP and rely solely on the explicit checkbox action.

### Role State Management
*   **Observation:** The registration page uses a Next.js `useSearchParams` hook to read the `?role=` query parameter and initialize the `role` state. However, the UI buttons that set the role do not automatically advance the user to Step 2, nor do they disable the "Continue" button if no role is selected (though a default is provided).

---

## 2. Authentication & RBAC Architecture

The codebase recently underwent a massive "Auth v2" migration (`006_auth_v2_schema.sql` and `007_auth_v2_rls.sql`), which moved away from a single `role` column on the `users` table to a more robust `user_roles` and `role_permissions` structure.

### The AuthContext & JWT Hook Disconnect
*   **The Issue:** The React `AuthContext` relies on a custom Supabase JWT hook to inject `user_role`, `permissions`, `school_id`, and `district_id` into the session token. 
*   **The Risk:** If the "Custom Access Token Hook" is not manually enabled in the Supabase Dashboard (as noted in the comments of migration `006`), the JWT will lack these claims. `AuthContext` will decode an empty payload, default the user to `mathlete`, and fail all `hasPermission` checks.
*   **Recommendation:** Verify immediately in your Supabase project settings that the `custom_access_token_hook` function is bound to the auth lifecycle.

### Dashboard Routing Precedence
*   **Observation:** `src/app/dashboard/page.tsx` correctly queries `user_roles` and uses a `ROLE_PRECEDENCE` dictionary to route users to the correct dashboard (e.g., `district_admin` > `school_admin` > `teacher`). This is an excellent implementation for multi-role users.

### Missing SSO
*   **Observation:** The login and register pages (`src/app/auth/login/page.tsx`) only contain email/password fields. The `AuthContext` exposes a `signInWithProvider` method for Google and Azure, but no UI buttons call it.
*   **Recommendation:** Expose the Google/Microsoft SSO buttons immediately to support frictionless classroom onboarding.

---

## 3. The "Heat Engine" Crisis (C1 - C4)

The most critical issue in the codebase is documented in `docs/TECHNICAL_PROBLEM_DESCRIPTION.md`. The platform cannot run a Heat because the TypeScript layer is sending the wrong column names to the database.

*   **The Issue:** The `HeatEngine` class was written against an older schema. It attempts to insert `heat_type`, `name`, `time_limit_minutes`, and `max_participants`. The actual database table (`heats`) expects `type`, `duration_seconds`, and `participant_count`, and does not have a `name` column.
*   **The Attempted Fix:** The codebase shows an attempt to refactor this by splitting the monolithic engine into `heat-service.ts`, `question-delivery.ts`, and `heat-realtime.ts` (as seen in `src/lib/competition/heat-engine.ts`). 
*   **Current State:** The refactor is incomplete. The UI components (`compete/[code]/page.tsx`) are likely still calling the legacy wrapper methods which fail against the new schema.

---

## 4. Caching & State Persistence

### Next.js Caching
*   **Observation:** There is no `vercel.json`. The `next.config.js` is standard. The stale "1,247 mathletes" metric on the landing page is hardcoded HTML (`1,247 mathletes competing right now`), not a cached fetch. 
*   **Recommendation:** Replace the hardcoded number with a dynamic fetch to a Supabase RPC function that counts active sessions in the `heat_participations` table.

### Mid-Heat State Protection
*   **Observation:** `src/lib/competition/state-persistence.ts` implements a brilliant `sessionStorage` snapshot system. It saves the student's progress locally on every question. If they accidentally refresh or close the tab, it restores their exact state without a database round-trip.
*   **Verdict:** This is a highly robust solution for unstable school networks. Do not change this.

---

## Recommended Execution Plan

To get MathAthlone to a functional, pilot-ready state, we must execute the following in order:

1.  **Fix the Registration UI:** Patch `register/page.tsx` to handle the `scrollHeight` edge case so users can actually sign up.
2.  **Fix the Heat Engine (C1-C4):** Complete the wiring of `heat-service.ts` to the UI components so teachers can create Heats and students can join them without schema errors.
3.  **Enable SSO:** Wire up the Google/Microsoft buttons on the login page to the existing `AuthContext` methods.
4.  **Verify JWT Hook:** Ensure the Supabase custom claim hook is active in your project dashboard.

If you approve, I can begin writing the code to fix the Registration UI and the Heat Engine immediately.
