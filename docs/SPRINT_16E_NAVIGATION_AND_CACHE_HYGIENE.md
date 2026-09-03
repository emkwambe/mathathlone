# Sprint 16E — Pilot Navigation and Cache Hygiene

**Status:** Implemented locally; production validation and release pending.

## Purpose

This focused pilot-readiness adjustment corrects two operational observations from the controlled DEMO review: the platform-administrator console had no visible way to end the current session, and stateful pilot routes did not share an explicit response-cache policy. The result is a clear account escape route and a conservative freshness boundary for temporary pilot data.

## Navigation decision

The implementation adds a compact, reusable **Account Controls** component to the two pages that exposed the confirmed gap.

| Page | Before | After |
|---|---|---|
| `/dashboard/platform/pilot` | A platform administrator could return to `/dashboard`, which immediately routed them back to the pilot console, but could not sign out. | The header shows the current identity, a dashboard link, and **Sign out**. The existing server-side `POST /auth/signout` route remains the only sign-out mechanism. |
| `/compete` | The code-entry page showed a Mathlete-only home link for every authenticated user and provided no session control. | A role-aware header shows **Mathlete Home** only for Mathletes, **Dashboard** for staff, and **Sign out** for any authenticated user. The teacher Heat-creation link remains contextual. |
| `/compete/[code]` | Existing live-Heat resilience takes precedence. | No new header control is added. A live Heat must not be unnecessarily unmounted or interrupted by a navigation enhancement. |

The component does not display PINs, passwords, or role-scope details. It does not change the role router, roster admission, Auth configuration, or database data.

## Cache decision

The pilot uses explicit `Cache-Control: no-store` for mutable operational surfaces. This prevents browser or intermediary reuse of a prior response for session, roster, Heat, worksheet, standings, or result information.

| Route family | Response policy | Reason |
|---|---|---|
| `/dashboard/*`, `/assessment/*` | `private, no-store, max-age=0, must-revalidate` | Content may be user- or school-specific. |
| `/compete/*`, `/auth/*`, `/api/*`, `/league/*`, `/leaderboard` | `no-store, max-age=0, must-revalidate` | Heat status, invitation state, authentication flow, operational APIs, and competition results should be current during the controlled pilot. |
| Public marketing routes and immutable static assets | Unchanged | Preserve ordinary performance behavior where the content is neither session-specific nor operationally mutable. |

The live-statistics endpoint and its client polling call also no longer request a shared stale-while-revalidate response. The landing-page badge is refreshed directly at the component's existing 60-second polling interval.

## Fresh-rendering guard

The role-routing dashboard entry, administrator dashboard, Mathlete Home, Mathlete progress, teacher dashboard, teacher class/roster page, parent dashboard, broadcast dashboard, global leaderboard, and individual league page explicitly use `dynamic = 'force-dynamic'`. This makes their server-rendered state request-time rather than relying only on implicit dynamic behavior. The change is intentionally limited to mutable pilot operations.

## Acceptance checks

| Check | Expected result | Stop condition |
|---|---|---|
| Platform-admin console | Header has **Sign out**; posting it returns to the site home with the session cleared. | Do not continue if an account remains active after sign-out. |
| `/compete` while signed in as Mathlete | Header identifies the learner and offers **Mathlete Home** and **Sign out**. | Stop if the link points to a staff dashboard or another user’s screen. |
| `/compete` while signed in as staff | Header offers **Dashboard** and **Sign out**; it does not incorrectly call the staff account a Mathlete. | Stop if staff receive a Mathlete-only return path. |
| Operational response headers | Specified route families return `no-store`; public marketing remains unaffected. | Stop if user-specific or Heat results carry reusable shared-cache headers. |
| Heat security | `/compete` remains code entry only; `/compete/[code]` requires sign-in and then active roster admission. | Stop immediately if a valid code admits a non-rostered Mathlete. |

## Non-goals

This work does not add a global dashboard redesign, a persistent sidebar, new account roles, automatic school onboarding, a data migration, or a change to the controlled Grade 6/Math 1 content-audit gates.

## References

1. [Next.js — Caching and Revalidating (Previous Model)](https://nextjs.org/docs/app/guides/caching-without-cache-components)
2. [Next.js — Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
3. [Next.js — `staleTimes` configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes)
