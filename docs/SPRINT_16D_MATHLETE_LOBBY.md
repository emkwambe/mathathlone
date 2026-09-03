# Sprint 16D — Mathlete Home and Class-Heat Entry

## Purpose

This change gives signed-in Mathletes a clear, identity-first home while retaining the short Heat-code workflow that teachers use to start a supervised class competition. It corrects an experience problem without altering classroom-roster authorization, Heat creation, student data, or database policy.

> **Product boundary:** A Mathlete account belongs to the learner across the platform. A Heat code is only an invitation to a particular teacher-led class session; possession of a code never grants participation.

## Student routes

| Route | Role in the experience | Expected result |
|---|---|---|
| `/auth/login?role=mathlete` | School-issued Mathlete sign-in | A successful ordinary sign-in opens `/dashboard/athlete`, the Mathlete Home. |
| `/dashboard/athlete` | Mathlete Home | Displays the learner's existing profile, progress, results, and one unambiguous action: **Enter class Heat code**. |
| `/compete` | Teacher-led class-Heat invitation | Accepts an `MA-XXXX` code, checks that the Heat is joinable, preserves the target across sign-in, and continues to the particular Heat. |
| `/compete/[code]` | Specific Heat lobby | Applies the existing authentication and active-roster admission rules. A non-rostered Mathlete must be denied. |

## Entry logic

A learner who signs in from the Mathlete sign-in card without a protected destination goes to the Mathlete Home. The standalone `/compete` code-entry screen is intentionally reachable before sign-in, so a teacher may distribute the code before students authenticate. Once a valid code is selected, the learner retains `?next=/compete/[code]` and returns to that same Heat after authentication. This is deliberate: identity comes first for normal entry, while a teacher-led classroom invitation retains its session continuity.

Only the exact `/compete` entry route is public. A direct Heat lobby such as `/compete/MA-7X4K` remains protected; it redirects through sign-in and preserves that exact destination. The existing specific-Heat roster check remains the authority on whether a signed-in Mathlete may participate.

The optional Heat-code field was removed from the Mathlete sign-in card. It combined two distinct decisions—establishing the learner's identity and entering a specific competition—and made the application appear to have no student home. The standalone `/compete` route remains available for the teacher's code, link, or QR-based instruction.

## Pilot acceptance criteria

| Check | Expected evidence | Stop condition |
|---|---|---|
| Managed-Mathlete sign-in without an invitation | The account lands at `/dashboard/athlete`; no Heat code is requested on the sign-in card. | Stop if sign-in returns to `/compete` or a learner cannot reach the home. |
| Mathlete Home terminology | The page identifies itself as **Mathlete Home** and offers only **Enter class Heat code** for this pilot. | Stop if the UI implies an unassigned independent “Practice Heat.” |
| Code-entry continuity | An unauthenticated learner can open `/compete`, enter a valid code, sign in, and return to the intended `/compete/[code]` lobby. | Stop if `/compete` forces sign-in before code entry, the destination is lost, or an arbitrary code can skip authentication. |
| Roster enforcement | A managed Mathlete outside the active class roster is refused at the specific Heat. | Stop immediately if a code admits a non-rostered learner. |
| Teacher flow | The existing teacher Heat Builder and class-bound Heat flow remain unchanged. | Stop if a teacher cannot create or share a roster-bound class Heat. |

## Non-goals

This patch does not create an independently launchable student practice mode, change cross-class or cross-school competition policy, modify ratings or rankings, expose credentials, create students, or make any real-school onboarding changes. Those require their own approved pilot gates.

## Files changed

| File | Change |
|---|---|
| `src/app/auth/login/page.tsx` | Removes the optional Heat-code field from Mathlete sign-in and routes ordinary Mathlete sign-ins to the Mathlete Home. Protected `next` destinations remain intact. |
| `src/app/dashboard/athlete/page.tsx` | Labels the dashboard as Mathlete Home and replaces duplicate code/practice links with one class-Heat invitation action. |
| `src/app/compete/page.tsx` | Clarifies the page as a teacher-led class-Heat invitation and links learners back to, or into, the Mathlete Home. |
| `src/lib/supabase/middleware.ts` | Allows only the exact `/compete` code-entry route before authentication; direct Heat routes remain protected. |

## Release note

This is a code-only interface and routing change. It requires standard type, lint, production-build, and controlled DEMO acceptance checks; it requires **no Supabase migration and no live-data change**.
