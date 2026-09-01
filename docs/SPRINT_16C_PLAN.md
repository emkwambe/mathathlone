# Sprint 16C — Class Rosters, Managed Mathlete Access, and Classroom Heats

**Status:** Implemented and pending deployment

## Purpose

Sprint 16C turns the Heat system into a classroom-ready workflow for the three-school pilot. A teacher can create the classes they teach, provision a roster of managed Mathlete accounts, provide private username-and-PIN login cards, and launch a Heat that only enrolled students may join.

> **Pilot onboarding rule:** teachers provision students before the lesson. Students use a teacher-issued username and temporary PIN rather than creating a personal account during a live classroom Heat.

## Scope

| Area | Delivered behavior |
|---|---|
| Teacher classes | A teacher assigned to an active school creates and lists only their own classes. Each class has an explicit grade and collision-resistant join code. |
| Managed Mathletes | A teacher imports privacy-safe display names. New students receive a unique managed username, a random six-digit temporary PIN, a confirmed internal sign-in address, and an active enrollment in the selected class. |
| Credentials | Temporary PINs are returned only at creation/reset time and rendered as printable private login cards. The PIN is held by Supabase Auth and is not persisted in application tables. |
| Individual recovery | A class manager can issue a new temporary PIN for a managed Mathlete. The previous PIN becomes invalid immediately. |
| Classroom Heat creation | The Heat Config Builder requires a teacher-owned class with at least one active Mathlete. The selected `class_id` is persisted on the new Heat. |
| Classroom Heat participation | A Heat with `class_id` can be read and joined only by an active enrollment in that specific class. Existing unscoped Heats retain their current behavior. |
| Student sign-in | The Mathlete form accepts either ordinary email or a managed username plus temporary PIN. A username is translated only inside the sign-in request to its internal account address. |
| Join continuity | Heat links survive login and self-registration fallback. A new account returns to the original Heat destination rather than a generic dashboard. |

## Security model

Migration `048_sprint16c_class_rosters.sql` adds the authoritative database rules. `can_manage_class(class_id)` grants class operations only to an active class teacher, their scoped school/district coordinator, or a platform administrator. `can_join_heat(heat_id)` enforces active classroom enrollment when a Heat is class-bound.

The `validate_class_bound_heat` trigger prevents a user from attaching a Heat to an unmanaged class and prevents a class from being paired with another school. The application join service repeats the roster check to produce a clear student-facing message before row-level security prevents the insert.

## Student data and privacy

The classroom workflow requests only the minimum data needed for pilot competition: a teacher-approved display name, roster relationship, class grade, managed username, and temporary credential. No personal email is displayed on a login card. A self-checked box is not treated as verifiable parental consent; formal consent must be handled by the school/guardian process before collecting data that requires it.

## Pilot teacher workflow

| Timing | Teacher action | Student experience |
|---|---|---|
| Before class | Open **Teacher Dashboard → Classes & Roster**, create the class, paste display names, and print the resulting cards. | Receives a private username and temporary PIN from the teacher. |
| Before the Heat | Open **Create a Heat**, select the prepared class, choose curriculum/settings, and launch. | Receives the teacher’s Heat link or code. |
| At sign-in | Students open the link, choose Mathlete sign-in, and enter the card username plus PIN. | Returns directly to that Heat lobby. |
| If a credential is lost | Teacher selects **Reset PIN** for that Mathlete and gives the new card privately. | Signs in with the new six-digit PIN. |
| Join gate | A student opens the Heat link. | Active class members join; non-rostered students see an actionable teacher-help message. |

## Explicit exclusions

Sprint 16C does not create team scoring, school aggregate reports, benchmark windows, scheduled live-event controls, teacher transfer flows, guardian consent capture, student self-service account recovery, or cross-school roster selection. These are follow-on pilot releases.

## Deployment prerequisites

1. Apply migration `048_sprint16c_class_rosters.sql` in Supabase before testing any new class/roster feature.
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is present only in local server environment and Vercel server environment.
3. Test with a teacher account already assigned to a school by the Sprint 16B pilot console.
4. Have the platform administrator confirm all accounts are signed out/in after role changes.

## Acceptance checklist

- A school-assigned teacher can create exactly their own class and view it after reload.
- Teacher roster import creates managed Mathletes, enrolls them, and provides printable credentials only once.
- An imported student signs in with username + PIN and returns to the shared Heat link.
- A student not in the selected class cannot join its Heat.
- A class-bound Heat cannot be attached to another school or an unmanaged class.
- PIN reset invalidates the former credential and displays the replacement only once.
- Teacher dashboard and Config Builder show a usable link/path to class setup.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` complete with no errors.
