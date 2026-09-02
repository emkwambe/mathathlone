# Mathathlone Three-School Pilot Guide Set

**Audience:** platform owner, district coordinator, school coordinator, teachers, students, and school-designated family contacts.

**Release basis:** Sprint 16B–16C pilot foundation, including organization scoping, protected staff assignment, teacher-owned classes, managed Mathlete accounts, and roster-bound classroom Heats. This guide set distinguishes released capabilities from planned pilot phases so that stakeholders never mistake a future workflow for a current feature.[1] [2]

> **Core pilot rule:** Teachers prepare students before the lesson. Students enter a classroom Heat with a teacher-issued managed username and temporary PIN; they do not create accounts during a live competition.[2]

## Read the guide that matches your role

| Guide | Primary reader | Use it when | Does not cover |
|---|---|---|---|
| [Platform owner and coordinators](01_PLATFORM_OWNER_AND_COORDINATORS.md) | Platform owner, district coordinator, school coordinator | Setting up schools, assigning staff, and maintaining organizational boundaries | Creating classes, student credentials, or live Heat delivery |
| [Teacher classroom guide](02_TEACHER_CLASSROOM_GUIDE.md) | Teachers | Creating a class, importing a privacy-safe roster, issuing cards, launching and supervising a class Heat | District-wide reporting or a formal live-event schedule |
| [Student Mathlete guide](03_STUDENT_MATHLETE_GUIDE.md) | Students and classroom helpers | Signing in with a managed username/PIN, joining the right Heat, competing, and reading results | Password recovery or self-registration during the lesson |
| [Pilot operating playbook](04_PILOT_OPERATING_PLAYBOOK.md) | All pilot leads | Coordinating the end-to-end rehearsal, communications, readiness checks, and issue handling | Features deferred to later releases |

## End-to-end pilot sequence

The platform owner establishes one pilot district and its participating schools, then assigns confirmed staff accounts to the appropriate district or school scope. Each affected staff member signs out and signs back in before using their new permissions. A teacher who is assigned to an active school creates their own class, adds a privacy-safe roster, and prints the one-time student access cards. The teacher then creates a class-bound Heat, shares its link or code, waits for rostered students to join, and starts after at least one participant is present.[1] [2]

| Stage | Accountable stakeholder | Required outcome before moving on |
|---|---|---|
| 1. Organization setup | Platform owner | Pilot district and schools exist; staff roles are limited to their proper scope. |
| 2. School readiness | School coordinator | Each participating teacher is assigned to exactly one school and has completed a new sign-in. |
| 3. Classroom preparation | Teacher | A class with the correct grade and an active roster exists; cards are printed or securely handed out. |
| 4. Heat preparation | Teacher | A class-bound Heat is created for the prepared class; the teacher has the share link/code. |
| 5. Student entry | Student with teacher support | Each student enters the intended Heat and sees **“You’re in”** before the Heat starts. |
| 6. Competition and review | Teacher | The teacher starts the Heat, supervises progress, and reviews the completed results. |

## Current release boundaries

The pilot foundation supports school-scoped classroom preparation and roster-only classroom Heat entry. It does **not yet** provide flexible benchmark windows with aggregate school comparisons, scheduled synchronous multi-school event controls, team scoring, school aggregate reports, or student self-service account recovery. Use the initial rehearsal for low-stakes classroom practice and operational validation; do not treat it as a formal cross-school ranking event.[1] [2]

| Safe to use now | Plan and validate later |
|---|---|
| Platform-controlled district/school/staff setup | Flexible asynchronous benchmark windows and cross-school aggregate reports |
| Teacher-owned class creation and roster import | Scheduled multi-school live-event controls and immediate school reports |
| Managed student usernames and one-time PIN cards | Team scoring and formal school recognition |
| Class-bound Heat admission for active roster members | Formal high-stakes ELO/bracket use during the operational pilot |

## Privacy, credentials, and support

A roster contains only the information needed for the classroom pilot: a teacher-approved display name, class relationship, grade context, managed username, and temporary credential. The application does not display a student’s personal email on a login card. Temporary PINs are intentionally shown only when an account is created or reset; print or hand the card to the student immediately, then dispose of any paper copy according to the school’s local policy.[2]

The platform owner must never share Supabase, hosting, or administrative API credentials with school stakeholders. Teachers should not post usernames or PINs on a board, in a public chat, or in a shared document. If a student cannot sign in, the teacher should use the **Reset PIN** control for that particular Mathlete and give the replacement card directly to the student.[2]

## Reference basis

[1]: ../SPRINT_16B_PLAN.md "Sprint 16B — Three-School Pilot Hierarchy, Provisioning & Authorization"
[2]: ../SPRINT_16C_PLAN.md "Sprint 16C — Class Rosters, Managed Mathlete Access, and Classroom Heats"
[3]: ../../src/app/compete/%5Bcode%5D/page.tsx "Heat lobby and participation implementation"

---

**Document owner:** Mathathlone platform owner
**Review point:** Before inviting a real school, and again before any cross-school benchmark or scheduled live event.
