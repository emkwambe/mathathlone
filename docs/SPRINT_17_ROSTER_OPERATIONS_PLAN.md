# Sprint 17 — Classroom Roster Operations and Managed Mathlete Lifecycle

**Status:** Planned — implementation and deployment require explicit authorization.

## Decision

Classroom rostering is a **pilot-critical operational system**, not merely a bulk-name input. The current implementation establishes valuable foundations—teacher-owned classes, a minimal student identity, one-time temporary credentials, and active-roster Heat admission—but the controlled DEMO rehearsal exposed that its lifecycle is incomplete. Sprint 17 will make roster operations dependable before any real-school onboarding or classroom competition.

> **Release boundary:** The already published but not deployed commit `fix(roster): use managed username contract` is a narrow compatibility correction, not a roster release. It must be incorporated and tested as part of Sprint 17. Do not deploy it by itself or retry the DEMO roster import until Sprint 17’s first implementation gate is approved.

## Evidence from the controlled DEMO rehearsal

The DEMO Northstar Grade 6 teacher successfully authenticated at the intended school scope and created exactly one synthetic Grade 6 class. The first roster attempt stopped before creating any Mathlete because the API queried `public.users.managed`, an older Boolean field that is absent from the current deployed classroom schema. The roster remained empty and no temporary PIN was created or exposed.

| Confirmed asset or behavior | Current state | Sprint 17 implication |
|---|---|---|
| DEMO class | One Grade 6 class exists and remains empty. | Reuse it for the controlled re-test; do not create a duplicate. |
| Classroom schema | Migration 048 defines `managed_username` and the class/active-enrollment authorization rules. | Treat `managed_username` as the authoritative managed-classroom marker. |
| Legacy managed flag | Older migration 042 defines `users.managed`, but it is absent in the production schema. | Remove all classroom dependencies on that flag, including PIN reset—not only initial import. |
| Credential exposure | The failed import returned zero Mathletes and no usable temporary PIN. | Maintain one-time PIN delivery and never store credentials in application data, source control, documentation, screenshots, or chat. |
| Heat join protection | Class-bound Heat admission checks active `class_enrollments`. | No lifecycle change may weaken the class-specific active-enrollment check. |

## Product objective

A teacher must be able to prepare the exact students in the exact class, confirm the roster before a lesson, privately hand out only necessary credentials, handle an individual lost-card event, and keep enrollment changes from disrupting a live competition. Coordinators need appropriate visibility without being able to see student credentials. Mathletes need a reliable identity-first path into the correct class Heat.

The required operating sequence is:

```text
Teacher school scope → class → roster review/preview → confirm import → private card delivery
→ student sign-in → active class enrollment → teacher-created class Heat → roster-only admission
```

## Scope

### 1. Canonical managed Mathlete identity

Sprint 17 will establish one supported classroom managed-account contract: a minimal profile with a unique `managed_username`, a school and grade context, and a temporary credential held only by Supabase Auth. A non-null `managed_username` is the classroom managed-account marker. The older `managed` Boolean will not be required by classroom code.

The implementation will centralize username normalization, collision handling, PIN generation, profile completion, and one-time credential response handling so that class roster import and PIN reset cannot drift apart. The older league bulk-import route will be explicitly classified as legacy and excluded from the initial classroom pilot until it can use the same contract or be retired.

### 2. Roster preparation, validation, and confirmation

Teachers will be able to paste privacy-safe names, receive a local validation and duplicate summary, and confirm before any accounts are created. The import result will distinguish **created**, **enrolled existing**, **skipped**, and **failed** entries without exposing temporary PINs in error logs or later roster views.

| Capability | Required behavior | Pilot safeguard |
|---|---|---|
| Name preparation | Accept newline or comma-separated privacy-safe display names; normalize whitespace; reject blank, malformed, duplicate, and over-limit entries. | Do not request legal names, personal email, birth date, or parent contact information. |
| Preview | Show the count and validation findings before the write operation. | The preview creates no Auth account, profile, or enrollment. |
| Confirmed import | Create only missing managed identities; enroll recognized identities idempotently. | No duplicate account for a retry or a matching existing Mathlete. |
| Results | Show created/enrolled/skipped counts and actionable, non-sensitive reasons. | PINs appear only for accounts created in that confirmed request. |
| Roster reload | Immediately show active entries, username, grade, and enrollment state. | Never reveal the original PIN after the import response is dismissed. |

### 3. Enrollment lifecycle and correction

The existing `class_enrollments.status` field will be used deliberately. Removing a student from a teacher’s active roster should be a reversible **deactivation**, not a destructive delete. Reactivating an existing Mathlete in the same class should preserve their identity without issuing an unnecessary new credential.

The sprint will add teacher-facing actions to add one existing managed Mathlete by verified managed username, deactivate/reactivate an enrollment, and archive a class. A class may be archived only when it has no active or scheduled class-bound Heat. The system must not allow a teacher to change a roster during an open or lobby Heat in a way that affects participants; the teacher should instead schedule a follow-up or make-up Heat.

| Lifecycle action | Authority | Required guard |
|---|---|---|
| Create class | Assigned teacher | Explicit school scope; normalized unique name policy per teacher/school; no duplicate retry. |
| Import roster | Class teacher; scoped support role only if approved | Preview, confirmation, cap, idempotency, audit event, active-class check. |
| Add existing identity | Class teacher | Same-school identity, verified managed username, no broad student search. |
| Deactivate/reactivate enrollment | Class teacher | Block unsafe changes while an associated Heat is in lobby/open/scheduled state. |
| Archive class | Class teacher; elevated support review where necessary | Retain records; block if active/scheduled class Heat exists. |
| Issue/reset PIN | Class teacher for an active managed roster member | Individual confirmation, immediate invalidation of the prior credential, no credential persistence. |

### 4. Role and data-minimization rules

Teachers manage their own classes and may see their active roster and the managed usernames necessary to distribute cards. School coordinators may review school-scoped class and roster status without viewing a PIN. District coordinators receive aggregate operational visibility only unless a support incident requires an approved, logged escalation. Platform administrators have break-glass support capability but no routine need to create, copy, or view a student’s original PIN.

The sprint will introduce a minimal, append-only roster operations audit record. It will store the actor, action type, class, optional Mathlete identifier, timestamp, and a safe metadata summary such as counts or reason codes. It will never store a temporary PIN, raw credential, private email, or full roster pasted text.

### 5. Student entry and support path

The Mathlete Home and the teacher-led Heat-code screen remain the student’s two entry points. Managed Mathletes sign in with the username and temporary PIN printed on their card. If a card is lost, the student asks the teacher privately; teachers use the individual reset action. The student never self-registers as a workaround for a missing class enrollment and never receives access solely because they know a Heat code.

### 6. Heat integration and event safety

The class selector in Heat Builder must expose only active classes the teacher can manage, including a current active-roster count. Launch remains blocked until the selected class has at least one active member. The existing roster-only admission rule must be independently tested for: an active rostered Mathlete, an inactive/deactivated roster entry, a Mathlete from another class in the same school, and an unrelated signed-in Mathlete.

## Deliberate non-goals

Sprint 17 does not add real-school self-service onboarding, public registration of students, parent consent collection, personal-email collection, grade advancement policy, student self-service password reset, automated cross-school transfers, team scoring, scheduled interschool events, or cross-school leaderboard changes. Those require separate policy, operational, and authorization decisions after the controlled classroom model is proven.

The older league bulk-import mechanism will not be expanded in this sprint. It must be either migrated to the canonical managed identity service in a later controlled release or disabled from pilot-facing workflows to avoid two incompatible student-creation paths.

## Data and migration decisions

Sprint 17 will begin with a schema reconnaissance against the actual production database; source migrations are not substituted for evidence. If the expected `managed_username`, class, enrollment, and Heat fields are present, the basic compatibility correction remains application-only. The audit-record capability requires a new additive migration. That migration must be idempotent, must include suitable indexes and scoped read policies, and must be reviewed separately before it is run.

No legacy migration is to be rerun merely to recreate `users.managed`. Adding that Boolean would not resolve duplicated credential logic and would create an unnecessary second managed-account source of truth.

## Delivery sequence

| Gate | Deliverable | Required evidence before continuing |
|---|---|---|
| 0. Schema and flow baseline | Production-safe, read-only schema inventory; document every current class/roster/credential route. | No record changes; current DEMO class count and roster count confirmed. |
| 1. Canonical service and compatibility | One server-only managed Mathlete service used by class import and PIN reset; remove classroom legacy-column references. | TypeScript, lint, build, unit/route coverage for created/existing/duplicate/failure cases. |
| 2. Lifecycle API and UI | Preview/confirm import, status-aware enrollment changes, archive safeguards, role-specific views, safe audit events. | Authorization tests prove teacher/school/district/platform boundaries and no PIN in persistent records. |
| 3. Heat integration validation | Current class selector/counts and immutable live-event roster safeguards. | Rostered user allowed; each non-rostered or inactive case denied. |
| 4. Controlled DEMO rehearsal | Use the existing Northstar Grade 6 class; import exactly four pseudonymous Mathletes once; print cards privately. | Four active entries, no duplicate identities, one-time credential handling, sanitized evidence only. |
| 5. Worksheet and Heat acceptance | Prepare Grade 6 ratios worksheet, print/save PDF, return to Heat Builder, launch a short class-bound practice Heat. | Correct worksheet/PDF rendering, fresh Heat instances, and roster-only admission. |
| 6. Pilot release decision | Consolidated readiness record, educator review status, and operating guide updates. | Explicit approval before any real school is onboarded. |

## Acceptance criteria

The sprint is not complete until all of the following pass in production with DEMO data only:

1. The existing DEMO class appears after reload and has no duplicate class record.
2. A confirmed four-name import creates or enrolls exactly four active Mathletes and shows four one-time credential cards privately.
3. The roster API and UI do not query the unavailable legacy `users.managed` column.
4. An individual PIN reset invalidates the old temporary credential, yields one private replacement card, and produces no persistent PIN record.
5. Retrying the same import is idempotent and does not create extra Auth identities or duplicate enrollment rows.
6. A roster correction cannot make an active or scheduled class Heat unsafe.
7. A rostered Mathlete signs in from a card, reaches Mathlete Home, and joins the intended class Heat.
8. A non-rostered or inactive Mathlete is denied even with a valid Heat link/code.
9. Authorized staff see only their permitted school/class records; credentials are never visible to coordinators through normal views.
10. Sanitized operational evidence records routes, timestamp, role, result, and any Heat code—never PINs, passwords, API keys, legal names, or personal contact data.

## Release approach

Implementation will be delivered as a coherent, reviewable Sprint 17 patch series on the authoritative GitHub `main` branch. Each code patch is independently validated, then the whole series is tested against a clean checkout before the user applies it. The production deployment happens only once the canonical service, lifecycle UI, security checks, and controlled rehearsal plan pass the stated gates.

Until then, the public production site remains on the last deployed account-navigation/cache release. The un-deployed GitHub commit `9bea284` is retained as source history but should not be independently deployed.

## References

[1]: SPRINT_16C_PLAN.md "Sprint 16C — Class Rosters, Managed Mathlete Access, and Classroom Heats"
[2]: PILOT_GUIDES/02_TEACHER_CLASSROOM_GUIDE.md "Guide 2 — Teacher Classroom Guide"
[3]: PILOT_GUIDES/03_STUDENT_MATHLETE_GUIDE.md "Guide 3 — Student Mathlete Guide"
[4]: SPRINT_16F_MANAGED_ROSTER_COMPATIBILITY_FIX.md "Sprint 16F — Managed Roster Schema Compatibility Fix"
[5]: ../src/lib/competition/heat-service.ts "Class-bound Heat admission implementation"
