# Sprint 15 Plan: Visual Bracket Results & Cohort-Safe Scoring

**Status:** Planned  
**Prerequisite:** GitHub `main` must include migrations `043`, `044`, and `045`.  
**Primary outcome:** A league owner can record a pending single- or double-elimination bracket result directly from the visual bracket without compromising authorization, grade-cohort ELO, standings, or bracket advancement.

## 1. Why This Sprint Comes Next

The league workflow is now strong through league creation, roster import, heat launching, bracket generation, standings, Swiss-round result entry, and student progression. The remaining operational gap is the visual elimination bracket. `LeagueDashboard` renders bracket matches and their outcome states, but a teacher cannot record a pending single- or double-elimination result from that bracket.

The server endpoint `POST /api/league/bracket/record-result` already contains the underlying match-completion, standings, head-to-head, and advancement behavior. However, it must be hardened before exposing it through a one-click teacher interface. The endpoint currently checks that the user is a teacher or platform administrator, but it does not prove that the teacher controls the particular league. It also retrieves athlete ratings only by athlete identifier, which becomes unsafe now that a student can hold distinct ratings in more than one ranking division.

> **Sprint 15 principle:** A result may be recorded only by an authorized league manager, and it may update only the rating rows belonging to that league's verified ranking cohort.

## 2. Current Foundations

| Existing foundation | Current behavior | Sprint 15 use |
|---|---|---|
| `LeagueDashboard.tsx` | Renders responsive single- and double-elimination bracket cards, winner states, CTA values, and pending matches. | Add a teacher-only result affordance without redesigning the bracket. |
| `SwissRoundView.tsx` | Provides a validated modal for winner selection and two CTA scores. | Reuse its interaction pattern and validation language; do not duplicate scoring rules. |
| `/api/league/bracket/record-result` | Completes a match, updates ELO/standings/head-to-head, and relies on the existing advancement trigger. | Harden and reuse as the sole elimination-result command. |
| `brackets` and `bracket_matches` | A bracket belongs to a league; each match references its bracket and stores participants, winner/loser, CTA scores, and advancement links. | Derive league identity from the match instead of trusting a client-supplied league ID. |
| `leagues.created_by` | Stores the teacher who owns the league. | Enforce league-specific authorization in the server route. |
| `athlete_ratings` | Has one unique row per `(athlete_id, division_id)`. | Filter every rating read and update by the resolved ranking division. |

## 3. Non-Negotiable Safety Rules

### 3.1 Do not trust browser-supplied league or player identity

The route must fetch the submitted `bracket_matches` row and join through `brackets` to its league. It must reject a request if the body `leagueId` does not match the bracket's actual league, if the submitted winner or loser is not one of that match's two participants, if either participant is absent, or if the match is already completed.

The browser may send the league ID for routing convenience, but it is not an authority source. The database relationship must be the canonical value.

### 3.2 Enforce league-scoped authorization

A `platform_admin` may record results for any league. A teacher may record a result only where `leagues.created_by = auth.uid()`. The same rule must protect the route even when an unauthorized user can see a public bracket.

### 3.3 Resolve and preserve the ranking cohort before ELO work

The league's `division_id` is the expected ranking cohort for a standard league. The result command must resolve that cohort from the verified league record and use it in every `athlete_ratings` read and write. It must never update all rating rows matching an athlete ID.

Before implementation, the executor must audit league types in the live schema. If a legitimate league can have `division_id IS NULL`, a result cannot silently choose an arbitrary athlete rating. The route must instead derive the cohort from a verified linked heat's `ranking_division_id`, or return an explicit actionable error explaining that the league needs a ranking division before an elimination result can be scored. The required behavior is a design gate, not an assumption.

### 3.4 Keep match completion and score effects consistent

A successful result changes several dependent records: the match, bracket progression, both rating rows, rating history, league standings, and head-to-head totals. Sprint 15 must audit the existing sequential write sequence and implement an atomic or safely idempotent command boundary before exposing it through the UI. A failed request must never leave a completed match with missing standings or rating updates.

The preferred design is a single transactional Supabase RPC introduced by a migration only if the existing data-access layer cannot provide equivalent all-or-nothing behavior. The migration decision follows the implementation audit; it must not be introduced merely for UI work.

## 4. Teacher Experience

### 4.1 Eligible bracket cards

For a league owner, a pending bracket match is actionable only when both participants are known and the match is not a bye, completed, or structurally unresolved. The card displays a compact **Record Result** control. Public users and non-owner teachers receive the normal read-only bracket with no hidden controls.

Completed matches remain immutable in the visual interface. A completed match visibly shows its winner and both CTA scores. A pending future match with a `TBD` participant remains read-only.

### 4.2 Result modal

The new modal follows the proven Swiss-round pattern. It displays the round context and both athletes, requires a winner selection, and requires valid numeric CTA scores of zero or greater for both athletes. The teacher receives a clear confirmation statement that submission updates the bracket, league standings, and ELO for the league's ranking cohort.

While a submission is in progress, the modal disables duplicate submission. A failed request remains open, preserves entered values, and shows the server response in plain language. A successful request closes the modal and refreshes league data so the advanced player appears in the next bracket slot.

### 4.3 Mobile and accessibility behavior

The control must remain usable when the bracket is horizontally scrollable on a narrow screen. The modal must have labelled inputs, keyboard-focusable winner choices, an Escape/cancel path, visible error text, and a disabled submit state until valid inputs are present.

## 5. Implementation Workstreams

| Workstream | Files to read first | Planned changes | Completion evidence |
|---|---|---|---|
| Server authorization and input validation | `src/app/api/league/bracket/record-result/route.ts`, `supabase/migrations/006_league_engine.sql`, `supabase/migrations/034_leagues_write_policies.sql` | Join match → bracket → league; verify actual league identity, caller authority, participants, pending status, and CTA values before any write. | Unauthorized, mismatched, duplicate, and malformed requests return the correct error and make no data changes. |
| Cohort-safe rating update | `src/app/api/league/bracket/record-result/route.ts`, `src/lib/competition/scoring-service.ts`, `supabase/migrations/043_ranking_division.sql`, `supabase/migrations/045_repair_ranking_division_schema.sql` | Resolve the ranking division from verified league/heat data. Add `division_id` criteria to every athlete-rating read and update. Define explicit handling for missing cohort/rating rows. | A student with two rating rows changes only in the applicable cohort after a bracket result. |
| Atomicity and idempotency | Result route, bracket trigger migrations, and the current `increment_standing` RPC | Audit the current sequential write path. Use the smallest safe transaction or idempotent command design necessary; add a migration only if needed. | A repeated submission returns a conflict without double-counting ELO, standings, or head-to-head. Simulated failure cannot complete only part of the result. |
| Visual result entry | `src/components/league/LeagueDashboard.tsx`, `src/components/league/SwissRoundView.tsx`, `src/app/league/[id]/page.tsx` | Add an owner-only callback and `BracketResultModal`; invoke the hardened API; refresh the route after success. | Owner can resolve a playable pending card. Public and non-owner views stay read-only. |
| Verification and regression coverage | Existing test scripts, API route, league page, and bracket component | Add focused automated tests or a repeatable test script for route invariants; run TypeScript and production build. | All required scenarios below pass before merge. |

## 6. Explicit API Contract After Hardening

The browser submits only the minimal selection and measurements:

```ts
{
  matchId: string;
  winnerId: string;
  player1Cta: number;
  player2Cta: number;
  heatId?: string;
}
```

The server derives the loser, bracket, actual league, league owner, ranking cohort, and eligible athlete-rating rows. `leagueId` should be removed from the public body if no longer necessary; otherwise, it is treated as a consistency check only.

The response remains intentionally small:

```ts
{ success: true }
```

Failures use stable status classes: `401` for no session, `403` for a user without league authority, `400` for invalid input, `404` for absent match, and `409` for completed/unscorable matches or a missing required cohort rating.

## 7. Test Matrix

| Scenario | Expected result |
|---|---|
| League owner records a valid pending match | Match completes, winner advances, standings/head-to-head update once, and only the correct cohort ratings change. |
| Platform administrator records a valid match | Same result as league owner. |
| Teacher who did not create the league submits a result | `403`; no match, rating, standing, or bracket change. |
| Client supplies a different league ID | `400` or `403`; no change. |
| Client selects a participant not in the match | `400`; no change. |
| A future match still has `TBD` | UI has no result action; direct route request is rejected. |
| CTA score is missing, non-numeric, or negative | UI blocks submission; route also returns `400`. |
| Completed match is submitted a second time | `409`; no duplicated ELO, standings, history, or advancement. |
| Athlete holds ratings in two divisions | Only the resolved league ranking-division row changes. |
| League has no resolvable ranking division | Route returns an actionable conflict; it never guesses a rating row. |
| Double-elimination loss path | Winner and loser advance/drop into the correct subsequent slots exactly once. |
| Small-screen owner flow | Result control and modal are usable without obscuring bracket navigation. |

## 8. Scope Boundaries

Sprint 15 does not redesign bracket seeding, add a new tournament format, alter Swiss round behavior, change general ELO formulas, create a public live-score feed, or upgrade dependencies. It must not refactor the Config Builder, generator system, assessment pages, or unrelated dashboard layouts.

NC Math 2 Batch 2 and the dependency-security upgrade remain separate future sprints. The first is curriculum work; the second needs deliberate compatibility testing and must never be bundled with bracket scoring changes.

## 9. Delivery Sequence

1. **Audit and decision gate:** Confirm how each supported league resolves its ranking division and decide whether an atomic RPC migration is required.
2. **Harden the server command:** Complete authorization, participant validation, cohort-specific rating access, and idempotency before changing the visual bracket.
3. **Build the owner-only interface:** Add the card action and modal using the established Swiss interaction model.
4. **Test end to end:** Test single elimination, double elimination, authorization, duplicate submission, multi-division ratings, and mobile use.
5. **Release:** Run `npx tsc --noEmit`, `npm run build`, commit the feature in focused commits, push to GitHub, deploy with `vercel --prod`, and run any required migration in Supabase.

## 10. Exit Criteria

Sprint 15 is complete only when an authorized teacher can record a valid pending elimination result directly from the visual bracket; results advance the correct athletes; no unauthorized teacher can alter another league; ELO changes are confined to the league's verified ranking cohort; repeated submissions are harmless; and TypeScript plus the production build complete with no errors.

A short deployment note must state whether a new migration was required and identify the Supabase action, if any.
