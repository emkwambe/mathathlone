# Mathathlone Pilot Content Audit — Reference Checklists

**Status:** Reference standard for pre-pilot content review
**Applies to:** Every course and concept set that will be announced, practiced, or assessed during the three-school pilot
**Owner:** Platform owner, with curriculum-review and teacher-review evidence recorded per course
**Author:** Manus AI

## 1. Purpose and decision rule

This reference set establishes the evidence required before a Mathathlone course is used in a real pilot classroom. The audit is not a count of questions alone. It verifies that the curriculum selection, procedural generators, student-facing practice worksheet, and later Heat all implement the same declared **skill blueprint** accurately and understandably.

> **Pilot fairness rule:** Students may be told the course, topic, concepts, expected difficulty band, and format in advance. They may practice with independently generated items from that blueprint. A later Heat must generate different question instances and must not reveal or reuse the worksheet answer set.

The audit applies only to the content scope selected for the pilot. Courses not scheduled for pilot use may remain outside the release gate, but they must not be presented as pilot-ready. A course is **pilot-ready** only when every required checklist below passes or when an approved limitation is documented and prevents the affected concept from being selected.

> **Mathematical-correctness veto:** A technically functioning screen, worksheet, or Heat is never sufficient for release. One incorrect answer, contradictory prompt, invalid diagram/table, ambiguous required response, or unintended second correct option is a **critical defect**. It immediately halts release of the affected concept and its announced blueprint until a correction, new generated evidence, and qualified teacher/curriculum reviewer sign-off are recorded.

| Release status | Meaning | Permitted use |
|---|---|---|
| **Ready** | All required checks pass; no unresolved critical or major defect remains. | May be offered as a pilot practice worksheet and classroom Heat blueprint. |
| **Ready with stated limits** | Non-critical limitations are documented; unavailable concepts are blocked or hidden from selection. | May be used only within the documented concept subset. |
| **Not ready** | A critical or major defect remains, including any mathematical-validity defect, or evidence is incomplete. | Must not be announced, used in worksheets, or used in a Heat. |
| **Mathematical hold** | A mathematical-validity defect affects a shared generator, renderer, or answer-validation rule used by more than one planned course. | Halt every dependent course/blueprint until impact review and re-test evidence are complete. |

## 2. Audit scope register

Create one audit record for each pilot course, even if two courses share a grade band. The course record is the source of truth for the announced preparation blueprint and the launch decision.

| Field | Required entry |
|---|---|
| Audit ID | Stable identifier, for example `PILOT-NC6M-2026-01` |
| Course name and code | Canonical Mathathlone course record |
| Ranking cohort | Grade-level peer cohort used for recognition and comparison |
| Content level | The course/grade material actually practiced and assessed; may be one grade below the ranking cohort for early-year warm-up use |
| Pilot topics and concept IDs | Exact selectable subset; never use broad course names alone |
| Planned use | Practice only, intraclass classroom Heat, or later pilot phase |
| Audit owners | Curriculum reviewer, teacher reviewer, and final platform approver |
| Evidence location | Links or file names for sampled worksheets, Heat captures, and defect log |
| Release decision | Ready, Ready with stated limits, or Not ready |

## 3. Pre-audit configuration checklist

Complete this checklist before sampling content. It prevents an audit from reviewing a course that is not actually enabled or from confusing grade-level ranking with the material level.

| Check | Pass condition | Evidence to record | Status |
|---|---|---|---|
| Canonical course exists | Course name, code, division, and curriculum relationship are present and consistent. | Course record export or screenshot. | ☐ |
| Pilot blueprint is bounded | The course has a named, finite set of selected topics and concepts. | Topic/concept list with IDs. | ☐ |
| Ranking and content levels are explicit | The ranking cohort and content level are recorded separately when they differ. | Scope register entry. | ☐ |
| Classroom eligibility is defined | The class and managed roster that will receive the worksheet/Heat are known. | Class identifier and roster count; no student names in the audit document. | ☐ |
| Generator availability is known | Every selected concept has at least one active, implemented generator before sampling begins. | Generator coverage query or inventory. | ☐ |
| Assessment mode is confirmed | The intended pilot use is stated; do not mix asynchronous practice with a synchronized event claim. | Scope register entry. | ☐ |

A course fails pre-audit if any selected concept lacks a usable generator. Do not substitute a neighbouring concept or broaden the blueprint without recording a revised scope and notifying the participating teacher.

## 4. Curriculum and concept alignment checklist

Review every selected topic and concept against the stated course level. The question is not whether an item is generally mathematical; it is whether it assesses the announced skill at the intended grade/content level.

| Check | Pass condition | Review notes |
|---|---|---|
| Topic naming | The displayed topic is intelligible to teachers and age-appropriate for students. | ☐ |
| Concept definition | Each concept describes one assessable mathematical skill, not a vague strand label. | ☐ |
| Course placement | The concept belongs to the selected course and content division. | ☐ |
| Grade-level appropriateness | Required vocabulary, prerequisite knowledge, numerical range, and representation fit the intended material level. | ☐ |
| Blueprint transparency | The student worksheet can list the topic/concept without revealing a future answer or exact item. | ☐ |
| Exclusions are explicit | Adjacent or advanced skills that are not part of the announced preparation scope are excluded. | ☐ |
| Above-grade recognition boundary | Students may excel on higher-level material only when the higher content level is expressly selected; performance is still reported by the defined ranking cohort. | ☐ |

## 5. Generator coverage and independence checklist

Complete this checklist per selected concept and per active generator. A passing generator must provide enough variation for practice and competition without depending on repeated static wording or fixed values.

| Check | Pass condition | Minimum evidence |
|---|---|---|
| Generator mapping | Generator type maps to the exact canonical concept ID. | Generator inventory row. |
| Active and implemented state | Generator is active and callable in the current runtime. | Inventory result plus generated sample. |
| Minimum concept coverage | Every selected concept has one or more viable generator types. | Coverage matrix. |
| Variation | Repeated invocations produce materially different values, representations, or scenarios while testing the same skill. | Five human-reviewed instances at each supported difficulty, including boundary cases. |
| Answer determinacy | Every generated instance has one unambiguous correct answer or a defined valid-answer set. | Independent reviewer calculation; generator-supplied answer is not proof. |
| Distractor quality | Multiple-choice distractors are plausible, unique, and not accidentally correct. | Five generated instances per generator. |
| Difficulty control | The requested difficulty changes reasonable features of the item without changing the underlying standard unexpectedly. | Low/middle/high sample comparison when supported. |
| Practice/Heat separation | Worksheet and later Heat are independently generated; no stored worksheet question or answer is sent to the Heat. | Before/after capture and implementation review. |
| Fallback safety | If a selected concept cannot generate, the system rejects or clearly reports the request rather than silently substituting unrelated content. | Negative test result. |

### Generator coverage matrix

Use this table for each course. Add one row for every selected concept-generator pair.

| Course | Topic | Concept ID and name | Generator type | Active | Five samples checked | Answer check | Variation check | Rendering check | Result |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  | ☐ | ☐ | ☐ | ☐ | ☐ |  |

## 6. Mathematical validity checklist

Mathematical validity is a release gate, not an optional quality review. A qualified teacher or curriculum reviewer must independently solve each retained sample before it is considered release evidence. Do not treat a generator’s supplied answer as proof that the question is correct.

For every generator with a machine-verifiable mathematical invariant, run at least **1,000 independently seeded invocations at each supported difficulty level**. The verification must recompute the answer from the visible prompt values, not repeat the generator’s answer calculation. Automated verification finds recurrence defects; it does not replace human review of wording, instructional appropriateness, diagrams, tables, or ambiguity.

| Check | Pass condition |
|---|---|
| Arithmetic/algebra | Values, equations, units, conversions, and simplification are correct. |
| Invariant stress check | At least 1,000 independently seeded invocations per supported difficulty recompute the answer from parsed visible prompt values; every run passes. |
| Qualified reviewer sign-off | A teacher/curriculum reviewer independently solves retained samples across low, middle, and high difficulty, including special representations and boundaries. |
| Domain constraints | Division by zero, impossible geometry, negative measures, non-integer count contexts, and invalid probability conditions are avoided unless intentionally taught and clearly stated. |
| Diagram/table fidelity | Labels, axes, data values, proportions, and visual relations match the prompt and answer. |
| Single intended answer | The prompt gives sufficient information and does not support multiple equally valid interpretations. |
| Multiple-choice integrity | Exactly one option is correct; no duplicate options; the answer letter matches the displayed option. |
| Free-response integrity | Expected format and acceptable equivalent answers are clear. |
| Worked rationale quality | The answer key explains the intended method accurately enough for teacher review. |
| No answer leakage | The student copy has no hidden answer, answer-letter cue, solution artifact, or filename that reveals an answer. |

Record each mathematical defect in the discrepancy log, preserve a screenshot or generated instance, and mark the generator/concept unavailable until the defect is resolved and re-sampled.

> **No waiver rule:** Mathematical defects cannot be waived for schedule, pilot pressure, a technically successful deployment, or a small expected class size. A release may reduce its concept scope only when the affected concept is removed from the announced worksheet and blocked from the Heat blueprint. If the defect is in shared rendering, answer checking, or a shared generator utility, assess and hold every dependent scope before resuming release work.

## 7. Student wording, accessibility, and fairness checklist

The pilot should measure mathematics, not unnecessary reading complexity, cultural familiarity, device fluency, or ambiguity.

| Check | Pass condition |
|---|---|
| Plain instructions | Students can identify what is being asked and how to respond. |
| Readable language | Vocabulary is appropriate to the content level or is explicitly taught by the item. |
| Neutral contexts | Names, money, units, and scenarios are respectful and do not assume a specific family income, culture, or prior experience. |
| No accidental hints | Wording, option length, option order, or visual placement does not signal the answer. |
| Accommodation-ready format | Text is selectable/readable, answer spaces are usable, and critical meaning is not conveyed by color alone. |
| Time fairness | Expected reading and computation time are reasonable for the planned Heat duration. |
| Preparation disclosure | The worksheet lists only the approved skills blueprint, not test items, answer patterns, or scoring thresholds. |

## 8. Worksheet production and printable-rendering checklist

Run this checklist for at least three independently generated worksheets per pilot course. At least one sample must include every special format the course can generate, such as ratio tables, fractions, exponents, graphs, geometry diagrams, or multi-line response spaces.

| Check | Pass condition |
|---|---|
| Correct practice identity | Header calls the document a practice worksheet or competition preparation worksheet, not the later competition itself. |
| Course and blueprint header | Course, topics, and concepts displayed to students match the teacher-selected approved blueprint. |
| Fresh-instance statement | Preparation worksheet states that the later Heat uses new generated question instances. |
| Structured math rendering | Tables render as tables; fractions, powers, symbols, equations, and diagrams render correctly rather than as raw markup or flattened pipes. |
| Question numbering | Numbering begins at 1, increments once per question, and does not duplicate across sections/pages. |
| Page budget | Standard pilot worksheet stays within the agreed target: normally no more than four student-question pages and no more than two answer-key pages when a key is included. |
| No spurious blank page | Practice Review without an answer key does not create a trailing blank key page. |
| Page-break integrity | A question, table, answer area, or diagram is not split in a way that prevents reading or responding. |
| Print/PDF check | Chrome print preview and saved PDF preserve layout, fonts, tables, and page count. |
| Teacher-only key handling | Answer-key content appears only for document types that are supposed to include it; preparation worksheets do not include it. |

## 9. Heat readiness and worksheet-to-Heat alignment checklist

The purpose of the preparation flow is alignment, not duplication. Run this checklist for every intended classroom Heat blueprint.

| Check | Pass condition | Evidence |
|---|---|---|
| Class roster precondition | Teacher selects a class with at least one rostered Mathlete before preparing or launching a classroom Heat. | Teacher setup capture. |
| Shared blueprint | The Heat Builder and preparation worksheet show the same course and selected concepts. | Side-by-side capture. |
| Return continuity | Returning from worksheet preview restores the original class, course, concepts, mode, profile, timing, and content-division choice. | Return-flow capture. |
| Practice/Heat distinction | Preparation worksheet uses Practice Review and contains no answer key; Heat is not launched automatically. | Worksheet and builder capture. |
| New item instances | A later Heat produces fresh examples from the same concept generators; it does not retrieve worksheet items. | Sample comparison. |
| Roster-only access | A managed Mathlete outside the selected class cannot join the class-bound Heat. | Negative join test. |
| Teacher supervision | Teacher can see the Heat lobby and manage launch/monitoring according to the current classroom workflow. | Teacher capture. |
| Reporting scope | Pilot use follows the stated intraclass result/reporting model; do not label it interclass or interschool until those tested event layers are released. | Event record. |

## 10. Access and privacy checklist

| Check | Pass condition |
|---|---|
| Teacher worksheet creation | A teacher can create both standalone practice and a class Heat-linked preparation worksheet. |
| Parent worksheet creation | A parent can create standalone practice only; a parent cannot request a class Heat-linked preparation worksheet or access class data. |
| Non-author access | Mathletes, coordinators, and platform owners cannot use the worksheet authoring/preview routes unless separately granted the teacher/parent role under the approved model. |
| Student account privacy | Teacher-issued student cards use managed username and temporary PIN; no student password is displayed in worksheets, pilot-console views, or guides. |
| Minimum data in audit evidence | Screenshots and logs use DEMO data or redact real student names, emails, usernames, PINs, and access tokens. |
| No browser secret exposure | Only the Supabase Publishable key may be browser-visible; server Secret keys remain server-only. |

## 11. Discrepancy log and remediation rules

Every defect receives a course, concept, generator, severity, owner, and re-test decision. Do not close a defect based only on a code change; regenerate and review the affected item type.

| Severity | Definition | Release effect | Required response |
|---|---|---|---|
| **Critical** | Incorrect answer, answer leakage, unauthorized access, student-data exposure, broken join control, or a question that cannot be completed. | Blocks the course. | Disable the affected course/concept or fix immediately; re-test all related samples. |
| **Major** | Wrong/ambiguous standard alignment, malformed essential math/table/diagram, missing concept coverage, or a workflow defect that changes preparation fairness. | Blocks the affected concept; blocks the course if scope cannot be reduced safely. | Fix or remove the concept from the announced blueprint, then re-sample. |
| **Minor** | Cosmetic inconsistency, non-essential spacing issue, or wording improvement without a validity/fairness effect. | Does not block if documented. | Schedule before broader rollout; verify no student impact. |

| Defect ID | Course | Concept/generator | Severity | Evidence | Owner | Fix/mitigation | Re-test result | Closed by/date |
|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |

## 12. Course release checklist and sign-off

Complete this final checklist only after all selected concepts have evidence in the coverage matrix.

| Gate | Required finding | Status |
|---|---|---|
| Scope complete | Every course, topic, and concept to be announced in the pilot has a bounded audit record. | ☐ |
| Coverage complete | Every selected concept has active, validated generator support. | ☐ |
| Mathematical review complete | Five qualified-reviewer samples per supported difficulty and the required invariant stress checks have independently verified answers and unambiguous prompts. | ☐ |
| Mathematical veto clear | No unresolved mathematical defect affects the released concept, its shared generator, rendering, or answer validation. | ☐ |
| Rendering complete | Three representative worksheets, including special formats, pass print/PDF review. | ☐ |
| Heat linkage complete | The shared blueprint/independent-instance flow passes the Heat readiness checklist. | ☐ |
| Access/privacy complete | Teacher/parent boundaries and managed-student protections pass. | ☐ |
| Defect gate clear | No critical or major issue remains open for the released scope. | ☐ |
| Pilot release statement | Approved scope and all stated limits are recorded for teacher communication. | ☐ |

> **Release statement template:** “The following Mathathlone content is approved for the pilot: [course and concept list]. Students will receive a practice worksheet naming these skills. Classroom Heats will use new generated question instances from the same blueprint. The following limits apply: [limits or ‘none’].”

## 13. Minimum pilot evidence package

Maintain one folder or document set per released course with the following artifacts:

1. Completed course scope register and generator coverage matrix.
2. Five qualified-reviewer instances at every supported difficulty for every active generator used in the released concept set, plus saved automated invariant-stress results where applicable.
3. Three saved practice worksheet PDFs, including special math formats where applicable.
4. One completed worksheet-to-Heat linkage capture showing the shared blueprint and return continuity.
5. One roster-only join negative test for a class-bound Heat.
6. Completed discrepancy log and release sign-off.

This evidence package supports internal pilot readiness. It does not replace teacher judgment, accessibility review, curriculum approval by a district, or formal psychometric validation.

## 14. Recommended audit order

Audit only the actual first pilot content sets before broadening scope. Start with one course that will be used for the first classroom rehearsal, resolve shared renderer/generator defects there, then proceed course by course.

| Order | Audit unit | Why this order is efficient |
|---:|---|---|
| 1 | First announced pilot course and its initial concept set | Validates the end-to-end worksheet → Heat flow with real pilot conditions. |
| 2 | Other courses used in the same grade/class pilot window | Reuses the validated process while checking course-specific generators. |
| 3 | Below-grade warm-up content used by older ranking cohorts | Confirms content-level/ranking-cohort separation is correctly communicated. |
| 4 | Later interclass or interschool content | Audit only after the flexible-window and live-event reporting layers have their own readiness criteria. |

The checklist becomes a living release standard. Update it only through a documented review when a new generator family, visual item type, reporting layer, or event model changes what students see or how results are interpreted.
