# Guide 4 — Three-School Pilot Operating Playbook

**Use this guide for:** planning and running the first operational rehearsal across the model schools, collecting useful feedback, and deciding whether the platform is ready to invite real pilot classes.

> **Start narrow, validate deeply.** The current release supports organization-scoped, teacher-managed classroom Heats with roster-only entry. Use that workflow to prove access, credentials, class isolation, and the teacher/student experience before running cross-school comparison or a scheduled live event.[1] [2]

## 1. Purpose of the rehearsal

The rehearsal is not a high-stakes contest. Its purpose is to show that the organization hierarchy, staff permissions, teacher workflow, managed student onboarding, Heat entry gate, and results experience work reliably under ordinary school conditions.

| Rehearsal objective | Evidence of success |
|---|---|
| Organization isolation | A teacher sees and manages only their school-assigned classroom work. |
| Classroom ownership | Each teacher creates their own class rather than a coordinator creating it for them. |
| Managed access | Each student receives a distinct private username/PIN card and can sign in. |
| Roster-only participation | A student in one class cannot join another class’s class-bound Heat. |
| Teacher control | The teacher can share the Heat, observe joined students, and start only after a participant joins. |
| Results flow | Students and teachers see a completed outcome without a stuck lobby or missing participation. |

## 2. Recommended model-rehearsal structure

Use the dedicated `DEMO` district and schools already created for testing. Start with four teachers, one initial class per teacher, and four pseudonymous managed Mathletes per class. This creates 16 students—enough to test isolation without creating unnecessary data.

| Organization | Staff to assign | Initial classes | Managed Mathletes |
|---|---|---|---:|
| DEMO — Pilot Test District | One district coordinator | — | — |
| DEMO — Northstar Academy | One school coordinator; two teachers | Grade 6 and Grade 7, one class each | 4 per class (8 total) |
| DEMO — Riverbend Academy | One school coordinator; two teachers | Grade 6 and Grade 7, one class each | 4 per class (8 total) |

Use pseudonymous display names such as `Northstar 6A-01` or a school-approved short name. Do not use real student information during the model rehearsal.

## 3. Before the rehearsal: roles and communications

The platform owner assigns scopes. Coordinators confirm readiness. Teachers own student and Heat preparation. Students receive their cards privately. Keep any normal school consent, device, supervision, accessibility, and incident processes outside the application and follow them as usual.[1] [2]

| When | Platform owner | Coordinator | Teacher | Student |
|---|---|---|---|---|
| One week before | Confirm DEMO hierarchy and role assignments | Confirm each staff member has re-logged in | Confirm class section and device availability | — |
| One day before | Confirm support contact and observation plan | Check teacher readiness without collecting PINs | Create class; import privacy-safe roster; print cards | Receive card privately if participating in dry run |
| 15 minutes before | Remain available for escalation | Confirm the teacher has their Heat link | Create class-bound Practice Heat; share link/code | Sign in and wait in lobby |
| During Heat | Observe system issues only | Support access process | Start and supervise Heat | Complete own work fairly |
| After Heat | Record platform findings | Collect school feedback | Review results and classroom feedback | Report access problem respectfully |

## 4. Run-of-show for one classroom Heat

1. The teacher confirms the correct class is selected and has active rostered Mathletes.
2. The teacher creates a low-stakes class-bound Heat using an agreed topic, content level, question format, and duration.
3. The teacher shares the Heat link or code with the class.
4. Students sign in using the private managed username and temporary PIN on their card.
5. The teacher checks that each intended student shows as joined. A student should see **“You’re in — Waiting for your teacher to start the Heat…”**.
6. When at least one student has joined, the teacher selects **Start Heat**.
7. The teacher supervises through the monitoring view while students work.
8. After the Heat, the teacher and students wait for results, record any issue, and preserve no temporary credential in shared notes.[3]

| Stop condition | What to do |
|---|---|
| A student cannot sign in | Pause that student; verify the correct username and current PIN; reset only that student’s PIN if necessary. |
| A student is denied entry | Confirm they are enrolled in the exact selected class. Do not move them to another account during the Heat. |
| No participant is in the lobby | Do not start; the Start Heat button is intentionally disabled. |
| The wrong teacher/class appears | Stop before launching. Confirm the account’s school assignment and selected class. |
| The Heat has started before a student joins | Do not admit the student mid-Heat. Plan a separate make-up activity. |

## 5. Rehearsal acceptance record

Use one line per class. Do not place student passwords, PINs, personal details, or screenshots of questions in the record.

| School | Teacher | Class | Heat code | Students rostered | Students joined before start | Completed | Access issue? | Follow-up owner |
|---|---|---|---|---:|---:|---|---|---|
| DEMO — Northstar Academy | — | — | — | — | — | — | — | — |
| DEMO — Northstar Academy | — | — | — | — | — | — | — | — |
| DEMO — Riverbend Academy | — | — | — | — | — | — | — | — |
| DEMO — Riverbend Academy | — | — | — | — | — | — | — | — |

A rehearsal passes when each school can complete at least one class-bound Heat, each intended student can join the correct class, and no account can see or enter an unrelated class’s Heat. A single issue is not failure if it is documented and resolved; an unknown boundary violation is a stop-and-investigate condition.

## 6. Grade cohort and content-level principle

For the wider pilot design, students should be recognized and compared primarily among peers in their actual grade cohort. Teachers may use approved below-grade content for early-year review when the current-grade curriculum has not yet been taught. Students who succeed on above-grade content deserve recognition, but their opportunity should be based on demonstrated success rather than simply outperforming younger students.[4]

| Situation | Recommended interpretation |
|---|---|
| Grade 8 students complete Grade 7 review content | Compare the Grade 8 students with Grade 8 peers for the relevant activity, not against Grade 7 students. |
| Student demonstrates strong success above grade level | Offer an appropriately advanced opportunity or recognition after evidence of success. |
| Class has not covered current-grade topic yet | Use prerequisite or prior-grade material for practice; keep the student’s grade identity unchanged. |
| First technical rehearsal | Use practice results to validate operations, not formal rankings or ELO. |

## 7. Current limits and next operating phases

The initial model rehearsal should not be described as a cross-school benchmark window or a simultaneous live competition. Those operating modes require the planned reporting and scheduling capabilities. Until then, coordinate actual start times through normal school communication and treat each classroom Heat as a local operational test.[1] [2]

| Pilot stage | Current status | Operational direction |
|---|---|---|
| Teacher-owned, class-bound Heat | Available now | Run rehearsal and intraclass practice. |
| Flexible asynchronous benchmark window | Planned Sprint 16D | Use approved shared blueprint and aggregate comparisons only after reporting is delivered and tested. |
| Scheduled synchronous live event | Planned Sprint 16E | Use only after synchronized timing, immediate reporting, and multi-school rehearsal pass. |
| Formal recognition, ELO, or brackets | Deferred for operational pilot | Introduce only with explicit cohort and event rules. |

## 8. Escalation checklist

| Issue category | Capture | First owner |
|---|---|---|
| Role or dashboard mismatch | Account email, role assigned, expected page, actual page, time | Platform owner |
| School/class access boundary | Account email, school/class intended, action attempted, exact message | Platform owner; stop the affected test |
| Student sign-in/PIN | Student display name, managed username, Heat code, exact message—never the PIN | Teacher |
| Heat/lobby failure | Heat code, status shown, time, teacher account, screenshot without student PINs | Teacher with platform owner |
| Content or instructional concern | Grade, topic, question type, classroom observation | Teacher and school coordinator |

[1]: ../SPRINT_16B_PLAN.md "Sprint 16B — Three-School Pilot Hierarchy, Provisioning & Authorization"
[2]: ../SPRINT_16C_PLAN.md "Sprint 16C — Class Rosters, Managed Mathlete Access, and Classroom Heats"
[3]: ../../src/app/compete/%5Bcode%5D/page.tsx "Heat lobby and participation implementation"
[4]: ../SPRINT_13_PLAN.md "Sprint 13 ranking division and grade-cohort policy"

---

**Decision gate:** Move to real-school staff onboarding only after the model rehearsal documents the required isolation and access checks as passed, with any incident resolved and re-tested.
