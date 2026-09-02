# Grant-to-Pilot Institutional Transition Checklist

**Purpose:** This checklist governs the transition from the current `DEMO` institutional rehearsal to approved real school participation. It also defines the product requirements for a streamlined, no-cost partner onboarding path and a defensible decision on whether to include NC Math 1 and NC Math 3 in the grant-supported pilot.

> **Decision rule:** A real school becomes active only after an authorized partnership approval, a privacy-safe onboarding review, platform-owner approval, and a verified organization/staff scope. A test identity, test class, test student, or test event never becomes real merely by renaming it.

## 1. Core transition policy

The current DEMO district and schools are **provisional institutional placeholders**, not real activity records. They may be renamed to approved institutional names only when the preflight confirms that no DEMO classroom, managed Mathlete, worksheet assignment, or completed Heat would become misleadingly associated with the real institution. If such records exist, retain the DEMO organizations for audit history and create new real institution records instead.

| Data category | Rename/reuse for a real partner? | Required handling |
|---|---|---|
| `DEMO — Pilot Test District` | Yes, conditionally | Rename only after written institutional approval and clean preflight. Preserve the database ID only if it has no misleading model activity. |
| `DEMO — Northstar Academy` / `DEMO — Riverbend Academy` | Yes, conditionally | Same rule: a clean institutional placeholder may be renamed; otherwise create a new school record. |
| `demo.*@mathathlone.test` staff | No | Remain synthetic. Create separate real staff accounts and assign them through the protected platform workflow. |
| DEMO classes, managed Mathletes, credentials, practice documents, and Heats | No | Retain as test evidence or archive. Never relabel, transfer, or report them as real-school activity. |
| Real school course access | Yes, after approval | Grant sponsored; no fee is collected. Record course-level worksheet access separately from the school identity. |

## 2. Grant application and partner approval gate

Before naming a school as a partner in a grant application, obtain its permission to be named and state its expected role accurately. Until then, describe it as a **prospective pilot school** rather than an active platform user. The application must not claim EOC prediction, official NCDPI affiliation, or use of copied/rehosted NCDPI released items.[1] [2]

| Approval item | Owner | Evidence to retain | Pass condition |
|---|---|---|---|
| Partnership interest | School/district contact | Email, letter, or signed partner form | Contact agrees to be named and to consider participation if funded. |
| Named-school authority | School/district contact | Role/title and approval date | Contact is authorized to represent the institution or routes approval to an authorized leader. |
| No-cost access statement | Platform owner | Grant/application note | School understands that pilot worksheet access is grant-sponsored and has no charge. |
| Privacy boundary | School/district and platform owner | Data-use acknowledgement | No student data is submitted until the institution approves the classroom onboarding process. |
| Content scope | Teacher/course lead | Selected course and concept window | Requested content is a defined, audit-ready scope—not an entire course by default. |

### Grant-safe language

> “Mathathlone has a configured three-school pilot operating model. Participating institutions will receive grant-sponsored access to printable, standards-linked practice worksheets for their selected course scopes. Real staff and student accounts will be onboarded only after institutional approval, privacy review, and platform readiness checks.”

## 3. Read-only preflight before an institutional rename

The platform owner completes the following checks before renaming a DEMO district or school. A nonzero classroom, roster, student, worksheet, or completed-Heat result means **do not rename**; preserve the DEMO record and create a new real organization.

| Preflight check | Object | Required outcome | If the outcome differs |
|---|---|---|---|
| Model institutional history | Target DEMO school/district | No model classes, active rosters, generated student credentials, or completed events associated with the record. | Create a new real organization; do not overwrite the DEMO name. |
| Current scoped staff | Target DEMO school/district | No synthetic account would appear to belong to the real organization after renaming. | Deactivate or move DEMO staff scopes first; never rename their identities. |
| Existing real organization | Proposed real school/district name | No duplicate approved school/district exists. | Use the existing approved record; do not create or rename a duplicate. |
| Approval evidence | Proposed real institution | Required partnership and privacy approvals are stored outside student data tables. | Leave the organization in prospective status. |

The current Pilot Organization Setup console provisions districts, schools, and existing staff but does not expose a public rename action. Any approved placeholder promotion must therefore be an auditable platform-owner operation with a before/after record, never an ad hoc browser or database edit.

## 4. Recommended real-school onboarding infrastructure

The goal is **as straightforward as the DEMO setup, but not self-provisioning**. A public or invite-only form should collect a request; it must never directly create an active school, grant staff access, or create students.

### 4.1 Partner onboarding request form

| Form section | Minimum fields | Data rule |
|---|---|---|
| Institution | School name, district/LEA name, state, school website or NC identifier if available | Do not request student names, student IDs, dates of birth, or classroom rosters. |
| Primary contact | Name, role/title, work email, optional work phone | Collect only a business contact needed for follow-up. |
| Participation request | Expected grades/courses, selected course(s), approximate class count band, preferred start window | Collect ranges rather than student counts when possible. |
| Worksheet access | Selected courses, intended teacher users, acknowledgement that access is grant-sponsored and no-cost | Course choice becomes a proposed entitlement, not immediate access. |
| Authority and privacy | Authority confirmation, data-minimization acknowledgement, school/district approval contact | No student data submission before approval. |
| Submission | Submitter timestamp, status, platform review notes | Use a separate onboarding-request record; do not create a user role or school automatically. |

### 4.2 Required approval workflow

| Status | Who acts | Allowed action | Prohibited action |
|---|---|---|---|
| `draft` | Prospective contact | Save or revise the request. | Create organizations, accounts, or student records. |
| `submitted` | Platform owner | Review completeness and duplicate risk. | Treat the school as an active partner. |
| `approved_pending_setup` | Platform owner | Choose **create new** or **promote clean DEMO placeholder**; invite/create real staff accounts. | Provision students or issue credentials. |
| `onboarded` | Platform owner and designated school lead | Assign real staff scopes and enable approved course worksheet access. | Activate content outside the approved entitlement. |
| `paused` / `declined` | Platform owner | Document the reason and retain minimal administrative record. | Reassign staff or reuse school data without renewed approval. |

### 4.3 Minimum implementation controls

The future form should be protected by rate limiting and bot resistance, server-side validation, a human platform-owner approval queue, audit timestamps, and a duplicate check on school/district identifiers. It should use a separate `partner_onboarding_requests` record with status history rather than write directly to `districts`, `schools`, `users`, or `user_roles`.

Grant-sponsored printable worksheet access should be represented through a separate school-course entitlement record, for example `school_course_entitlements`. Its minimum fields should be `school_id`, `course_id`, `access_type`, `status`, `access_basis = grant_sponsored`, `starts_at`, `ends_at`, `approved_by`, and `approved_at`. The record must not store card, invoice, or payment data. Teachers can generate printable worksheets only for active approved course entitlements at their assigned school; parents remain limited to their existing standalone-practice boundary.

## 5. NC Math 1 and NC Math 3: pilot inclusion decision

Including one high-school course can make the pilot more informative because the platform will be tested with higher-grade instructional workflows, not merely middle-school practice. Both NC Math 1 and NC Math 3 have North Carolina EOC assessments, and NCDPI states that EOC results count as at least 20 percent of a student’s final course grade under applicable policy.[2] However, Mathathlone must not present itself as official EOC preparation, predict EOC performance, or copy/rehost NCDPI items. NCDPI notes that interim-assessment correlation is not evidence of prediction and restricts re-use of released items in third-party applications.[1] [3]

| Decision factor | NC Math 1 | NC Math 3 | Recommendation |
|---|---|---|---|
| External relevance | EOC-tested course; calculator-inactive and calculator-active sections.[2] | EOC-tested course; calculator-active items only.[2] | Both are grant-relevant. |
| Source generator inventory | 54 standards-linked source generator sections are present. | 71 exported `m3` generator functions are present; live database mapping must be audited. | Inventory is promising, not a readiness claim. |
| Initial pilot complexity | Earlier high-school sequence; narrow algebra/function scope can be selected. | More advanced functions, logarithms, polynomials, rational expressions, trigonometry, geometry, and statistics raise rendering/calculator/notation risk. | Start with **NC Math 1**, not both simultaneously. |
| Assessment-mode fit | Requires a deliberate calculator-policy decision because the state EOC has both inactive and active sections. | Requires graphing-calculator-aware practice and more advanced response/representation review. | Do not claim EOC simulation in the current Heat format. |
| First proposed audit scope | A 3–4 concept algebra/function window selected with the participating teacher. | Defer until NC Math 1 passes the full content audit and a Math 3 teacher requests a narrow scope. | **Pilot Math 1 first; hold Math 3 as Phase 2.** |

### Recommended high-school sequence

1. Ask an interested NC Math 1 teacher to select one three-to-four-concept instructional window that students have already been taught.
2. Perform the same mathematical-veto audit used for the Grade 6 ratio scope: live mapping, generator coverage, independent invariant checks, qualified review, printable rendering, and production worksheet-to-Heat evidence.
3. Use teacher-owned, grant-sponsored Practice Reviews to explain the announced skills. Generate fresh original Heat instances for any practice event.
4. Keep early high-school Heats low stakes: no official-test claim, EOC prediction, ELO, brackets, or school ranking.
5. Evaluate NC Math 3 only after its own live mapping/coverage audit, qualified course-teacher review, calculator/notation plan, and an approved narrow concept window.

## 6. Go/no-go checklist for each real school

| Check | Owner | Required result |
|---|---|---|
| Written institutional approval | School/district and platform owner | School can be named and intended participation is documented. |
| Onboarding request reviewed | Platform owner | Request is complete, unique, and appropriately scoped. |
| DEMO preflight | Platform owner | Clear decision: promote clean placeholder or create new real record. |
| Real staff identities | Platform owner and school lead | Real accounts exist separately from `demo.*` accounts and have least-privilege scopes. |
| Course entitlement | Platform owner and course lead | Grant-sponsored worksheet access is active only for approved course(s) and dates. |
| Content readiness | Qualified course teacher and platform owner | Announced scope passes mathematical-veto content audit and production rendering checks. |
| Student onboarding approval | School/district | Approved minimal-data roster process is in place before student accounts are created. |
| First event boundary | Teacher and coordinator | Class-bound, low-stakes event; no untested interschool/ELO claims. |

## 7. Recommended next implementation decision

The next product implementation should be the **Partner Onboarding Request and Approval workflow**, not direct public institution provisioning. It can reuse the protected organization provisioning service after platform-owner approval, while adding a reviewable request queue, entitlement storage, school-safe course selection, and an auditable placeholder-promotion path.

The recommended content sequence is: finish the Grade 6 production acceptance check; identify one real or prospective NC Math 1 teacher and narrow instructional window; perform the complete NC Math 1 content audit; then decide whether Math 3 adds enough additional learning value to justify its separate high-complexity audit.

## References

[1]: https://www.dpi.nc.gov/districts-schools/accountability-and-testing/state-tests/end-course-eoc "North Carolina Department of Public Instruction — End-of-Course (EOC)"

[2]: https://www.dpi.nc.gov/documents/accountability/testing/eoc/eoc-nc-math-1-and-nc-math-3-test-specifications "North Carolina Department of Public Instruction — EOC NC Math 1 and NC Math 3 Test Specifications"

[3]: https://www.dpi.nc.gov/documents/accountability/testing/nccheckin/nc-check-ins-20-nc-math-1-and-3-specifications "North Carolina Department of Public Instruction — NC Check-Ins 2.0 NC Math 1 and 3 Specifications"
