# Worksheet Competition-Preparation Plan

**Status:** Proposed for approval
**Scope:** Clean up and strengthen the existing printable assessment generator so a teacher can tell students **which concepts and topics** they will practice and compete on, while the actual Heat uses independently generated question instances.

## 1. Product decision

A worksheet becomes the transparent **preparation layer** for a competition blueprint. It tells students the course, topics, concepts, skill profile, and expected format. It does **not** disclose a future Heat code, competition answers, question text, or a reusable answer key.

> **Fair-preparation rule:** Students should know the mathematical material and skill expectations before they compete. They should practice different generated instances of the same concepts; they should not receive the actual competition items in advance.

The procedural generator library already makes this direction practical. The current worksheet builder selects active generator types for selected concept IDs and renders fresh instances server-side. The Heat delivery service separately generates and stores fresh question instances for its selected concept IDs. Consequently, a worksheet and a later Heat can share a mathematical blueprint without intentionally reusing a question instance.[1] [2]

This is a strong but not absolute randomness guarantee: independently generated values can theoretically coincide. The initial pilot promise must therefore be **“same skills, newly generated questions”**, not an unprovable claim that two independent random draws can never match character-for-character.

## 2. Current-state audit

| Area | Current behavior | Gap to close | Priority |
|---|---|---|---|
| Teacher workflow | **Generate Assessment** is positioned as a standalone document with “No heat required.” | It does not explain how a worksheet prepares students for a particular Heat blueprint. | High |
| Concept selection | Teacher selects topics and atomic concepts, but the worksheet only carries topic names and generator types forward. | The student document does not list the exact selected concepts, and generation does not explicitly guarantee at least one practice item per selected concept. | High |
| Heat alignment | Heats already persist `unit_topic_id`, `concept_ids`, `question_profile`, content division, and grade ranking division. | The worksheet builder cannot accept or return a canonical Heat blueprint. | High |
| Question separation | Worksheet procedural questions are created by server-side generators; Heat questions are generated separately. | The product language does not clearly explain independent instances, and there is no visible blueprint summary for students. | High |
| Access control | The page/API/client list inconsistent roles. The edge route guard excludes parents although the page/API currently list parents; it permits district admins while the API rejects them. | Establish one explicit policy: **teachers and parents only** for worksheet generation, consistent across guard, page, API, and preview. | High |
| Input validation | The API trusts `docType`, `difficulty`, course name, topic names, and concept IDs too broadly. | Validate allowed document types, difficulty range, unique IDs, concept-course relationship, generator availability, and request size. | High |
| Printing | The renderer always forces a page break after the student copy, even when no answer key exists. | Prevent trailing blank pages; retain the target of ≤4 question pages and ≤2 teacher-key pages. | High |
| Preview/reprint | Generated JSON exists only in browser `sessionStorage`. | Refreshing or opening the preview on another device loses it; teacher cannot reprint a generated worksheet from history. | Medium |
| Question coverage | The assembler shuffles distinct generator types, then takes up to the document question count. | Selected concepts may be skipped when generator availability is uneven. | Medium |
| Legacy tooling | `scripts/generate_worksheet.py` is no longer called by the application. | Retain only as a developer fixture or retire it from active guidance. | Low |

## 3. Role and privacy policy

The user requirement is that **only teachers and parents** may create worksheets. The cleaned workflow will apply that policy consistently.

| Role | Worksheet access | Competition-blueprint access | Reason |
|---|---|---|---|
| Teacher | Yes | Yes, for classes the teacher manages | Creates instructional preparation for their own class Heat. |
| Parent | Yes | Independent practice only; no class/Heat prefill or class data | Supports home practice without exposing a classroom roster or competition configuration. |
| School/district/platform coordinator | No direct worksheet creation by default | May oversee pilot operations through existing role-specific workflows | Keeps educational content authoring limited and avoids scope creep. |
| Student / Mathlete | No | Receives only teacher-issued worksheet and Heat link | Prevents answer-key and generator access. |

No worksheet screen or document will include a managed student username, temporary PIN, full roster, personal student email, platform secret, or competition answer key. A student-facing practice worksheet will not show a teacher key.

## 4. Target teacher workflow

### A. From Heat Builder: prepare, then compete

1. The teacher creates or selects the classroom Heat blueprint: class, grade cohort, content division/course, topics, concepts, question profile, format, and integrity level.
2. Before creating the Heat, the teacher selects **Create Practice Worksheet for These Skills**.
3. The generator opens with the same canonical blueprint already selected.
4. The teacher chooses a low-stakes practice document format and generates/prints the worksheet.
5. The student copy visibly states the topics and concepts to practice plus the message: **“Your Heat will assess these skills using new question instances.”**
6. The teacher returns to the Heat Builder with the selection intact, confirms the class and configuration, then creates the Heat.
7. The Heat generator creates fresh question instances from the same selected concept set and profile.

### B. Standalone practice

A teacher may still start at the worksheet tool first. A parent may generate independent home practice. In either case, the document is clearly labelled **Practice Worksheet**, not “competition” unless it was started from a teacher Heat blueprint.

| Workflow choice | Allowed actor | Student-facing label | Link to Heat |
|---|---|---|---|
| Competition preparation | Teacher | **Competition Preparation Worksheet** | Prefills the same teacher-owned Heat blueprint; student question instances are new. |
| Classroom practice | Teacher | **Classroom Practice Worksheet** | No required Heat. |
| Independent home practice | Parent | **Independent Practice Worksheet** | No class or Heat information. |

## 5. Shared competition blueprint

No duplicate curriculum model is needed. The existing Heat fields remain canonical.

| Blueprint attribute | Existing Heat source | Worksheet behavior |
|---|---|---|
| Ranking cohort | `ranking_division_id` | Teacher-facing context only; never changes because review material is below or above grade level. |
| Content division | `content_division_id` | Displays the content source used for practice and later question generation. |
| Course/topic | `unit_topic_id` and resolved course/topic hierarchy | Displays a human-readable scope at the top of the worksheet. |
| Concepts | `concept_ids` | Displays the selected concept names; drives coverage-aware question selection. |
| Skill profile | `question_profile` | Displays Warm-Up, Standard, Challenge, or Deep; drives generator filtering. |
| Heat format | `type`, question count, duration, MC/FR mix | Optionally gives a student-safe expectations summary, without revealing answer keys or item wording. |
| Class scope | `class_id` | Never shown on a parent worksheet; shown only as a teacher internal context. |

The minimal first implementation uses an encrypted same-browser preparation handoff through `sessionStorage`, not a new database table. It is sufficient for the teacher’s immediate **prepare → print → return → create Heat** workflow. A later durable history feature can save a teacher-owned, printable blueprint record without saving student credentials or competition items.

## 6. Generation and coverage rules

The worksheet generator will receive a validated canonical blueprint, resolve only active generator types connected to the selected concepts, and build a concept-aware practice set.

| Rule | Required behavior |
|---|---|
| Minimum selected concepts | Preserve the current minimum of three. |
| Maximum selected concepts | Require no more concepts than the selected document can cover, or show a clear warning and require a larger format / narrower selection. |
| Coverage pass | Deal one eligible procedural generator from each selected concept before filling remaining slots. |
| Variety pass | Avoid repeating a generator type until the eligible pool is exhausted. |
| Failure message | If a selected concept has no active implemented generator, name that concept and stop rather than silently omitting it. |
| Student visibility | List selected topics and concepts; do not list generator IDs, correct answers, or the heat code. |
| Competition difference | Generate worksheet and Heat instances independently. Do not copy worksheet question text, answers, or generated parameters into `heat_questions`. |

The existing Heat delivery service already honors explicit concept IDs when loading generator and static pools. The strengthened worksheet must use the same concept IDs and profile semantics, but it will remain procedural-generator based for practice items.[2]

## 7. Print and document cleanup

The cleanup focuses on the real pilot standard: **no more than four student-question pages and two teacher-answer-key pages**, no blank trailing student page, and no apparent duplicate page numbering on a representative school device.[3]

| Change | Purpose |
|---|---|
| Force the student→answer-key page break only when an answer key exists | Eliminates the likely blank trailing page for practice reviews/homework. |
| Keep a forced key separation for quiz/test/makeup documents | Prevents teacher answers sharing a student page. |
| Add a compact “Skills you will practice” block | Makes topics and atomic concepts visible without consuming a full extra page. |
| Add document purpose label | Distinguishes practice worksheet from a graded assessment. |
| Preserve existing compact question budgets | Review/homework: 8; quiz: 12; test/makeup: 16. |
| Render and inspect representative PDFs | Verify page count, blank pages, long math wrapping, answer-key separation, and no duplicate page labels. |
| Document browser print setting | In the school browser print dialog, turn off headers/footers if the browser injects URL/date/page labels; the app will not add its own page-number counter. |

## 8. Implementation slices

### Slice 1 — Safety and clarity (required before pilot use)

1. Align route middleware, client gate, preview access, and API authorization to **teacher and parent only**.
2. Add server-side request validation and concept/course/generator verification.
3. Rename teacher-facing copy from a generic assessment-first framing to a practice-preparation framing where appropriate.
4. Fix the unconditional student-copy page break and reproduce the pilot print test.
5. Add the student-safe topic/concept blueprint header and independent-instance statement.

### Slice 2 — Teacher preparation handoff (required for “worksheet then competition” flow)

1. Add a teacher-only **Create Practice Worksheet for These Skills** action in Heat Builder once course/concepts/profile are selected.
2. Prefill the worksheet builder from the canonical blueprint.
3. Add **Return to Heat Builder** on preview after printing, retaining the exact selected blueprint.
4. Require the teacher to make the final class/Heat creation decision after returning; worksheet creation never auto-launches a competition.

### Slice 3 — Coverage and quality hardening (required before real pilot use)

1. Replace blind shuffled generator selection with coverage-aware dealing by concept.
2. Show a specific missing-generator error instead of generating a partial document.
3. Add deterministic unit tests for configuration validation, selected-concept coverage, answer-key visibility, and page-break class selection.
4. Test at least three representative course/topic sets on the production-like browser/PDF path.

### Slice 4 — Optional durable preparation history (post-rehearsal)

Save teacher-owned worksheet blueprint records, not student credentials or future Heat questions. The history view can support reprint, version tracking, and a clear link from preparation plan to the later Heat, after the pilot proves the immediate handoff.

## 9. Acceptance criteria

| Scenario | Required result |
|---|---|
| Teacher opens worksheet generation | Teacher can create a practice worksheet. |
| Parent opens worksheet generation | Parent can create independent practice but sees no class or Heat controls. |
| Student opens worksheet route/API/preview | Student is denied; no answer key or generator output is exposed. |
| Teacher starts from Heat Builder | Worksheet receives exactly the selected course, topic(s), concept IDs, and question profile. |
| Worksheet student copy | Clearly lists the selected topics/concepts and says Heat questions will be newly generated. |
| Worksheet coverage | Every selected concept with available generator coverage appears in the practice document before any concept repeats. |
| Missing coverage | A concept with no active generator produces an actionable error, not an incomplete silent worksheet. |
| Return to Heat Builder | The original concept/profile selection remains intact; the teacher still chooses class and launches manually. |
| Heat questions | New Heat records use the same concept IDs but fresh generator instances. |
| Print review/homework | No blank answer-key page; student questions remain within the designated page target. |
| Print quiz/test | Teacher key starts after the student copy and total page count stays within six. |
| Scope safety | A teacher cannot use the handoff to create a Heat for another teacher’s class; parent has no Heat handoff. |

## 10. Deferred items

This plan does not add flexible benchmark-window reporting, scheduled multi-school events, school aggregate reporting, formal cross-school ranking, or automatic assignment delivery. Those remain later pilot phases and must not be implied by a preparation worksheet.

## References

[1]: `src/app/api/assessment/generate/route.ts` — current server-side worksheet request and active-generator lookup.
[2]: `src/lib/competition/heat-service.ts` and `src/lib/competition/question-delivery.ts` — canonical Heat blueprint and independent question generation.
[3]: `src/lib/assessment/assembler.ts`, `src/components/assessment/AssessmentDoc.tsx`, and `docs/MATHATHLONE_PILOT_TEST_GUIDE.md` — existing document budgets, print behavior, and pilot print acceptance bar.
