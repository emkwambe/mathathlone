# Sprint 16B — Three-School Pilot Hierarchy, Provisioning & Authorization

**Status:** Implemented and pending deployment

## Purpose

Sprint 16B establishes the organization and authorization foundation required before Mathathlone can operate a three-school pilot. It does not introduce classroom roster management, asynchronous benchmark windows, or scheduled live-event scheduling. Those are Sprint 16C–16E capabilities. This release makes the roles, school boundaries, district relationship, and league management rules explicit and enforceable first.

> A competition may be visible only to the people who have a legitimate relationship to its league, school, district, or enrollment. Management authority is always narrower: it is granted to a platform administrator, the league creator, an authorized school/district coordinator in the league's scope, or an active time-bounded delegate.

## Pilot hierarchy

| Level | Pilot responsibility | Data relationship |
|---|---|---|
| Platform administrator | Creates the pilot district and schools; assigns existing staff accounts. | Platform-scoped role; server-only setup interface. |
| District coordinator | Manages district-scoped leagues inside their assigned pilot district. | `user_roles.scope_type = 'district'`; `scope_id = districts.id`. |
| School coordinator | Manages school/classroom leagues for their assigned school. | `users.school_id` plus school-scoped `user_roles` assignment. |
| Teacher | Creates classroom leagues only within their assigned school. | `users.school_id`; class enforcement arrives in Sprint 16C. |
| Student / parent | May view only competitions in which the student is enrolled or has a permitted parent relationship. | Existing participant/parent relationships plus organization-aware league visibility. |

## Implementation

### Migration 047

`supabase/migrations/047_sprint16b_pilot_organizations.sql` is idempotent. It adds optional `school_id`, `district_id`, and `class_id` ownership fields to leagues; adds `schools.is_active`; indexes organization-scoped league reads; and confirms that `classroom` is a supported league level.

The migration creates `league_delegations` for explicit, revocable future staff delegation. It adds security-definer helper functions that derive role, school, and district scope from persisted profile and scoped-role records. The helpers replace broad legacy league and membership policies with organization-aware RLS policies.

The migration also supersedes Sprint 15's atomic bracket command after defining `can_manage_league`. The command still derives the league from the locked bracket match and performs its cohort-safe scoring in one transaction; it now permits an authorized scoped manager as well as the league creator or platform administrator.

### Server enforcement

The platform-only `/api/platform/pilot/organizations` route provisions districts and schools and assigns existing staff accounts. It uses the service role only after verifying the caller's `platform_admin` profile. The endpoint does not create student accounts, issue passwords, or expose private keys.

`/api/league/create` now derives school and district ownership from the caller's persisted role and organization. Teachers may create classroom leagues at their school; school coordinators may create classroom and school leagues at their school; district coordinators may create district leagues in their assigned district; and platform administrators may explicitly select the owning organization. Browser-supplied organization IDs cannot expand a normal staff member's scope.

Bracket generation, Swiss bracket initialization, Swiss result recording, Heat-result processing, and ranking-cohort updates use the same persisted league-management decision. Heat-result and Swiss rating updates now filter athlete ratings to the league's explicit ranking division. This preserves the Sprint 13 rule that a student's grade cohort—not their content division or another advancement slot—receives the result.

### Platform interface

`/dashboard/platform/pilot` is protected by middleware and a server-side profile check. The page provides a compact setup console for this order: create one pilot district; create three verified pilot schools; then assign existing registered accounts as teachers, school coordinators, or a district coordinator. Staff must sign out and sign in after assignment to refresh current role metadata.

## Required deployment sequence

1. Apply migration `047_sprint16b_pilot_organizations.sql` in Supabase SQL Editor.
2. Apply the source patch and run the defined verification commands.
3. Push GitHub `main` and deploy to Vercel.
4. Sign in as a platform administrator and create the pilot district.
5. Create the three pilot schools under that district.
6. Ask each coordinator and teacher to register first. Assign every teacher to exactly one school and at least one coordinator to each school. Assign one district coordinator.
7. Have each reassigned staff member sign out and sign back in.

## Acceptance criteria

| Scenario | Required result |
|---|---|
| Platform admin opens `/dashboard` | Redirects to the protected pilot organization setup console. |
| Non-platform user opens `/dashboard/platform/pilot` or its API | Receives a forbidden result or the platform's 403 route. |
| Teacher creates a league | Server accepts only a classroom league and persists the teacher's school/district IDs. |
| School coordinator creates a league | Server accepts only classroom/school level and persists their school/district IDs. |
| District coordinator creates a league | Server accepts only a district-level league in their scoped district. |
| Unrelated teacher submits another league ID to a mutation route | Receives forbidden; no bracket, cohort, Swiss, or Heat result changes. |
| A student has ratings in two divisions | Swiss/league processing changes only the rating matching the league ranking cohort. |
| A scoped school/district manager records a bracket result | The atomic function permits it only when the league belongs to their persisted scope. |

## Explicit deferrals

Sprint 16B deliberately does not create classes, class codes, rosters, roster-scoped Heat admission, benchmark windows, scheduled live-event controls, school aggregate reports, or team rankings. These depend on the organization foundation and belong to Sprint 16C, Sprint 16D, and Sprint 16E.
