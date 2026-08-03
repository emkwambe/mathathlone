# MathAthlone Authentication & RBAC Audit Report
**Prepared for:** Eddy Mkwambe, Technical Director, Mpingo Systems
**Date:** July 18, 2026

## Executive Summary
I have conducted a comprehensive inspection of the MathAthlone frontend authentication flows, Role-Based Access Control (RBAC) surfaces, and caching behaviors. The platform's visual design is clean and role separation is conceptually strong, but several critical UI bugs and architectural gaps currently block frictionless onboarding and enterprise adoption. 

The most urgent issue is a broken state-management bug in the registration wizard that prevents users from completing sign-up. Furthermore, the lack of Single Sign-On (SSO) and missing administrative roles in the UI will cause friction for school and district deployments.

---

## 1. Critical Registration Blockers

### The "Fair Play Code" Checkbox Bug
On Step 3 of the Mathlete registration flow, users are required to check two consent boxes to enable the "Complete Registration" button. 
*   **The Issue:** The checkboxes are unresponsive to click events. JavaScript inspection confirms their underlying state remains `checked: false` regardless of user interaction. 
*   **Impact:** This is a hard blocker. No new mathletes can currently register through the UI.
*   **Recommendation:** Review the React state bindings (likely a missing `onChange` handler or a controlled component missing its state update function) on the `input[type="checkbox"]` elements in the `FairPlayCode` component.

### Role Selection State UI
On Step 1 of the registration flow, users select between "Mathlete" and "Teacher."
*   **The Issue:** Clicking a role does not visually highlight or confirm the selection. Furthermore, the "Continue" button is active by default, allowing users to proceed to Step 2 without selecting a role.
*   **Recommendation:** Implement visual active states (e.g., a blue border ring) for the selected role card, and disable the "Continue" button until a role is explicitly set in state.

### Date of Birth Input Friction
*   **The Issue:** The native HTML5 `<input type="date">` is used without a fallback or custom wrapper. This creates significant friction, particularly on desktop browsers where selecting a birth year like 2012 requires excessive clicking.
*   **Recommendation:** Implement a robust date-picker library or split the input into three simple dropdowns (Month, Day, Year) to ensure frictionless data entry for younger students.

---

## 2. RBAC Architecture Gaps

The platform's pricing and marketing copy explicitly mentions features for Schools and Districts, implying a multi-tiered hierarchy. However, the current UI only surfaces two roles.

### Missing Administrative Roles
*   **The Issue:** The signup and login flows only support "Mathlete" and "Teacher." There is no visible pathway for a "School Admin" or "District Admin" to create an account, claim a school, or manage teacher rosters.
*   **Recommendation:** Introduce a third path on the login/signup screens for "Administrators," or implement an in-app "Upgrade to Admin" request flow for verified teachers.

### Route Protection and Redirects
*   **Observation:** The frontend correctly intercepts unauthenticated attempts to access protected routes (`/dashboard`, `/teacher`, `/admin`, `/heat/join`) and redirects to the login page with a `?next=` parameter.
*   **Recommendation:** Ensure the backend API strictly enforces these boundaries, as frontend route protection is easily bypassed. The `?next=` parameter should also be validated against an allowlist to prevent open redirect vulnerabilities.

---

## 3. Frictionless Onboarding & Enterprise Readiness

To achieve your goal of frictionless onboarding—especially for the K-12 market—the authentication strategy needs to align with how schools actually operate.

### The Missing SSO Layer
*   **The Issue:** MathAthlone currently relies entirely on email/password authentication. 
*   **Impact:** Asking 30 middle school students to manually type emails and create passwords at the start of a live Heat will consume 15 minutes of class time and generate multiple password reset requests.
*   **Recommendation:** Implement **Google Workspace SSO** immediately. For the US market, adding **Clever** or **ClassLink** integration is mandatory for district-wide adoption, as IT administrators will not approve tools that require separate credential management.

### The "Heat Code" Fast Path
*   **Observation:** The Mathlete login page features an optional "Heat Code" field designed to drop students straight into a lobby.
*   **Recommendation:** This is a brilliant feature for reducing friction. To improve it further, allow teachers to generate magic links (e.g., `mathathlone.com/join/MA-1234`) that bypass the login screen entirely for "Practice Mode" heats, requiring only a display name.

---

## 4. Caching and State Issues

You noted that the application has been "prone to caches." My inspection confirms aggressive static caching.

### Stale Landing Page Metrics
*   **The Issue:** The landing page displays "1,247 mathletes competing right now." This number appears to be statically generated at build time rather than fetched dynamically.
*   **Impact:** Stale "live" metrics degrade trust. If a teacher launches a heat and the global counter doesn't move, the platform feels inactive.
*   **Recommendation:** Move this metric to a client-side fetch (`SWR` or `React Query`) or use Next.js/Vercel's Incremental Static Regeneration (ISR) with a short revalidation window (e.g., `revalidate: 60`).

### Service Worker and Asset Caching
*   **Observation:** A service worker is registered, and the Vercel edge network is caching HTML payloads (`Cache-Control` headers). 
*   **Recommendation:** Ensure your authentication tokens (JWTs) are not being cached. Tokens should be stored in `HttpOnly` cookies rather than `localStorage` to mitigate XSS risks, and all API routes related to user state must explicitly set `Cache-Control: no-store`.

---

## Next Steps for Execution

If you agree with these findings, I recommend prioritizing the fixes in this order:

1.  **Hotfix:** Repair the React state bug on the Fair Play Code checkboxes to unblock user registration immediately.
2.  **Feature:** Integrate Google SSO to dramatically reduce classroom onboarding friction.
3.  **Architecture:** Map out the database schema for the School Admin and District Admin RBAC tiers.

Let me know which of these you would like to tackle first, and we can begin writing the implementation code.
