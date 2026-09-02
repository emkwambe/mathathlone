# Guide 1 — Platform Owner and Coordinator Onboarding

**Use this guide for:** creating the pilot organization structure, assigning staff to the correct scope, and confirming that every stakeholder has the least privilege needed for the first classroom rehearsal.

> **Authority principle:** Organization setup belongs to the platform owner. District and school coordinators manage within their assigned scope; they do not gain platform-wide access simply because they coordinate a school or district.[1]

## 1. Know the role boundaries

The three levels of staff authority are deliberately separated. A role assignment is both a workflow decision and an access-control decision. Do not assign a person to a broader scope merely for convenience.

| Stakeholder | Current responsibilities | Required scope | Do not use this role for |
|---|---|---|---|
| **Platform owner** | Creates pilot districts and schools; assigns existing staff accounts; oversees environment readiness | Platform | Teaching classes or using a school account as the owner |
| **District coordinator** | Manages district-scoped league work inside one district | One district; optional home school | Platform setup, managing another district, or creating a teacher’s class |
| **School coordinator** | Reviews and manages school/classroom league activity for one school | One school | Creating teacher-owned classes or managing another school |
| **Teacher** | Creates their own classes, imports class rosters, creates class-bound Heats, and supervises students | Exactly one school | Managing another teacher’s class or assigning staff |
| **Student / Mathlete** | Signs into assigned classroom Heats and competes | Active roster membership in the Heat’s class | Creating classes, issuing credentials, or joining another class’s Heat |

## 2. Platform owner: set up the organization hierarchy

### Action

Open the platform console at:

```text
https://mathathlone.vercel.app/dashboard/platform/pilot
```

Create the pilot district first. Then create each school beneath that district. The **Pilot Organization Status** panel is the source of truth for confirming the hierarchy.

| Console section | What to enter | Expected result | If the result is different |
|---|---|---|---|
| **1. Pilot District** | Official pilot district name and two-letter state code | A success notice appears and the district is visible in the status list | Do not create a duplicate. Refresh the status list and report the exact message. |
| **2. Pilot School** | Official school name, the correct pilot district, and state code | A success notice appears and the school is listed beneath the intended district | Stop if the district is not available in the selector. Confirm the district was created first. |
| **3. Assign Existing Staff** | A confirmed staff account email, role, and matching school/district scope | A success notice instructs the person to sign out and sign back in | Do not assign an unknown email or change the scope to make the form submit. Confirm the account first. |

For the pilot rehearsal, use names with an explicit `DEMO` prefix. Never enter a real student name merely to test organization setup. The platform console assigns existing staff accounts; it does not create student accounts or display student passwords.[1]

## 3. Assign staff in a safe order

Create or confirm the staff account before assigning its role. The account must already exist in Mathathlone. Assign coordinators before teachers, then ask all newly assigned people to sign out and sign back in so their fresh session can receive the new role metadata.[1]

| Order | Role | Form choice | Scope choice | Check after saving |
|---:|---|---|---|---|
| 1 | District coordinator | **District Coordinator** | Select the assigned district; leave home school empty unless genuinely needed | Status table shows the district coordinator as active with district/platform scope. |
| 2 | School coordinator | **School Coordinator** | Select the coordinator’s one school | Status table shows the coordinator at that school only. |
| 3 | Teacher | **Teacher** | Select the teacher’s one school | Status table shows the teacher at that school only. |

### Required re-login

Every newly assigned coordinator or teacher must sign out of Mathathlone, close the application tab, sign in again, and then open `/dashboard`. This refreshes the role signal used by the dashboard route. If a person sees the wrong dashboard after a fresh sign-in, do not change their role repeatedly; report the email, the assigned scope, and the page reached.

## 4. Coordinator responsibilities during the first rehearsal

District and school coordinators should support readiness, not bypass teacher ownership. Current functionality is school/classroom oriented; a dedicated district dashboard and cross-school event reporting are follow-on capabilities. The practical first-pilot responsibilities are therefore preparation, access confirmation, schedule coordination outside the application, and escalation to the platform owner when a scope error occurs.[1] [2]

| Coordinator | Before teachers prepare classes | During a classroom Heat | After the classroom Heat |
|---|---|---|---|
| District coordinator | Confirms every pilot school and designated coordinator is present; coordinates the agreed rehearsal window | Does not join students’ classroom Heat or alter roster entries | Collects process feedback; records cross-school comparison needs for the flexible-window phase |
| School coordinator | Confirms each teacher is assigned to the correct school and has re-logged in | Helps the teacher resolve non-sensitive access issues; does not distribute student PINs | Confirms the teacher can see results; captures local operational issues |

## 5. Readiness checklist before a class proceeds

| Check | Owner | Pass condition |
|---|---|---|
| Organization hierarchy | Platform owner | The pilot district and correct school are visible in the status panel. |
| Staff scope | Platform owner / coordinator | Each teacher is assigned to exactly one school; each coordinator is assigned only as broadly as needed. |
| New session | Each reassigned staff member | They signed out and back in after assignment. |
| Teacher access | Teacher | The teacher can open **Teacher Dashboard → Classes & Roster**. |
| Student data policy | School lead | The teacher has permission to use the school-approved, privacy-safe display names. |
| Classroom readiness | Teacher | A correct-grade class and active roster exist before the Heat is created. |

## 6. What to do when something does not match

| Symptom | First action | Do not do |
|---|---|---|
| A staff email is not found by the console | Confirm the person completed account creation and that the email was entered exactly | Create a student account to stand in for staff or assign a different person without approval |
| The wrong dashboard appears after assignment | Sign out, close the tab, sign in again, then revisit `/dashboard` | Change the database role repeatedly or assign an unnecessary school |
| A teacher cannot create a class | Confirm they are an active teacher assigned to an active school | Let a coordinator create the class in the teacher’s name |
| A student cannot join a class Heat | Confirm that student has an active enrollment in the exact selected class | Share another class’s card or create a second account for the student |

## 7. Current boundaries and forward plan

The initial pilot is appropriate for teacher-managed, class-bound practice and operational rehearsal. It is not yet the place to promise asynchronous cross-school rankings, scheduled simultaneous multi-school events, formal team scoring, or immediate school aggregate reports. Those releases must be tested separately before high-stakes comparison or recognition is introduced.[1] [2]

[1]: ../SPRINT_16B_PLAN.md "Sprint 16B — Three-School Pilot Hierarchy, Provisioning & Authorization"
[2]: ../SPRINT_16C_PLAN.md "Sprint 16C — Class Rosters, Managed Mathlete Access, and Classroom Heats"

---

**Hand-off:** Once teacher accounts show the correct school scope after re-login, give teachers [Guide 2 — Teacher Classroom Guide](02_TEACHER_CLASSROOM_GUIDE.md).
