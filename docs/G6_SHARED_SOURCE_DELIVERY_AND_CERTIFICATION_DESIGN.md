# Grade 6 Shared Source Delivery and Deterministic Certification Design

**Status:** Product rules approved for a review-only implementation package. The package still does not verify a source, activate a generator, deploy code, create a worksheet, or create a Heat.

**Goal:** Make every Grade 6 atomic concept usable in valid, explicitly scoped worksheets, reviews, and Heats only when its source has passed deterministic technical certification and the applicable content-review gate.

## Baseline and Scope

The live Grade 6 inventory contains 61 atomic concepts across five topics. Thirty-four concepts have an active procedural mapping with an implemented runtime key. Twenty concepts have only active, unverified static candidates (33 items in total); seven have an implemented but inactive staged procedural generator. No Grade 6 concept is without a recorded source candidate.

The completed stored-formatting normalization covered the 33 static candidates. The postcheck confirmed that every intended formatting change matched, all correct answers and mappings remained unchanged, all items remained active and unverified, and no selector availability changed.

> A source candidate is not an approved delivery source. No static candidate becomes usable merely because its stored text is structurally valid or normalized.

## Product Decisions Requested

The shared foundation must implement the following decisions consistently for all Grade 6 topics and later courses.

| Decision | Proposed rule | Reason |
|---|---|---|
| Exact source scope | A selected concept can receive only an exact procedural mapping, an exact reviewed static item, or a future explicit reviewed visual mapping. | Prevents neighbouring-topic and generic-pool drift. |
| Static approval | `is_verified = true` is insufficient alone. An immutable individual review record with a matching content fingerprint is also required. | Prevents a stale approval from surviving later source edits. |
| Capacity | A static item cannot repeat within a worksheet or Heat. Every selected concept must occur at least once. The requested count must be fulfilled exactly or the plan rejects before creation. | Keeps the selector’s promise honest. |
| Format mix | Requested count and exact source coverage are mandatory. FR/MC composition is a preference only and may not cause unrelated fallback. | Protects scope over a cosmetic ratio. |
| Focused practice | A static-only concept with fewer unique eligible items than the requested worksheet count rejects that focused request. It may participate in a valid mixed plan if its own exact item is represented once. | Avoids repetition and unrelated filler. |
| Visual sources | Explicit concept selection receives zero visual capacity until visual-to-concept mapping, rendering checks, and representation review are completed. | Preserves the strict-scope fix. |
| Linked preparation | A competition-preparation worksheet that uses static content creates a server-side source-use record. The later linked Heat excludes those exact static IDs and rejects if remaining exact capacity is insufficient. | Ensures a later Heat is not a repeat of the worksheet. |
| Student answer protection | Student practice and competition-preparation payloads omit answers, correct-option letters, explanations, and solution steps before browser transmission and printing. | Closes client-payload as well as print-view leakage. |

## Certification Layers

The system separates deterministic evidence from educational approval and operational activation.

| Layer | Deterministic program decides | Human sign-off decides | Result of failure |
|---|---|---|---|
| Source identity | Exact concept mapping, source type, content fingerprint, active state, supported question type | None | No source capacity. |
| Structural integrity | Required fields, four unique A–D options, answer key match, difficulty bounds, content fingerprint stability | None | Item held. |
| Readability form | Explicit punctuation, whitespace, length, placeholder, and notation-form rules | Exceptions or wording changes outside the rule pack | Item held. |
| Mathematical rule pack | Recompute an answer or evaluate an approved concept-specific predicate where the prompt grammar is formally supported | Author/approve each formal rule and resolve unsupported/ambiguous items | Item held. |
| Pedagogy and representation | Render dimensions, option display, table/diagram asset existence, source capacity | Grade-level appropriateness, distractor quality, visual meaning, ambiguity not expressed by a formal rule | Item held. |
| Operational delivery | Exact-plan count, no repeats, no fallback, answer-key policy, Heat persistence/result attribution | Controlled production acceptance | Concept remains non-selectable. |

The program must never generate, paraphrase, infer, or silently repair content. An unsupported item is `HOLD`, not a guessed pass.

## Immutable Static Review Record

Before any static candidate may be marked verified, the platform adds an append-only review ledger. The technical design uses one row per decision; correction produces a new row rather than overwriting history.

```ts
type StaticReviewDecision = 'approved' | 'hold' | 'revise' | 'retire';

interface StaticQuestionReviewRecord {
  id: string;
  staticQuestionId: string;
  atomicConceptId: string;
  contentSha256: string;
  rulePackId: string;
  rulePackSha256: string;
  deterministicResult: 'pass' | 'hold' | 'fail';
  mathematicalRuleId: string | null;
  decision: StaticReviewDecision;
  evidenceReference: string;
  reviewerUserId: string;
  reviewedAt: string;
  createdAt: string;
}
```

The database migration will make review records insert-only. The resolver accepts a static item only when its latest applicable approval matches the current canonical content fingerprint, concept mapping, and active/verified status. Changing any reviewed source field invalidates that approval automatically.

## Shared Delivery Planner

The server uses a typed source plan instead of letting worksheet and Heat paths independently choose a pool.

```ts
type DeliveryCandidate =
  | {
      kind: 'procedural';
      conceptId: string;
      generatorId: string;
      generatorType: string;
      answerType: string;
    }
  | {
      kind: 'static';
      conceptId: string;
      lessonNumber: string;
      conceptName: string;
      sourceStaticId: string;
      questionText: string;
      questionLatex: string | null;
      options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
      correctAnswer: 'A' | 'B' | 'C' | 'D';
      explanation: string;
      difficulty: 1 | 2 | 3 | 4;
      contentSha256: string;
    };

interface SourcePlan {
  requestedConceptIds: string[];
  requestedQuestionCount: number;
  candidates: DeliveryCandidate[];
  sourceCounts: { procedural: number; static: number; visual: 0 };
  excludedStaticIds: string[];
}
```

The planner resolves every source from the server-side database state, not browser-provided answers, static IDs, or generator keys. It runs before any worksheet is returned or Heat row is inserted.

### Mandatory Planner Rules

1. The selected concept set must be non-empty, unique, and within the owning course.
2. The requested question count must be at least the number of selected concepts.
3. Each selected concept receives at least one candidate from an exact approved source.
4. Static candidates require active state, `is_verified = true`, a matching immutable approval, a supported type, a valid canonical option set, and a non-excluded static ID.
5. A static item appears at most once in one source plan.
6. If the plan cannot meet its count exactly from selected-concept sources, it fails before creating a record or returning an assessment.
7. In an explicit concept selection, unmapped visual content has capacity zero. The planner never substitutes it.
8. The resolver returns internal reason codes for audit and user-safe failure text without exposing stored answers.

## Worksheet Delivery

The worksheet API passes the immutable `SourcePlan` into the assembler. The assembler receives resolved static option objects but converts them to the current ordered string representation only after verifying A–D keys and preserving the stored correct-option letter.

| Artifact type | Static-source behavior | Student answer behavior |
|---|---|---|
| Standalone Practice Review | Allowed only when the source plan meets exact coverage and count. | Answers, explanations, solution steps, correct letters, and source identifiers are removed from the API payload and print. |
| Competition-preparation review | Allowed only with a persisted source-use record and enough remaining exact static capacity for the later linked Heat. | Same student-safe redaction; teacher receives only the approved briefing labels. |
| Formal teacher assessment | Allowed after the same source checks. | Teacher-answer key is served only through an authorized teacher pathway, not embedded in a student payload. |

The actual final source mix and point total are computed from the plan, not an assumed 60/40 composition.

## Heat Delivery and Results

The Heat service builds the same source plan before inserting the Heat. Every static Heat question persists exact source metadata in `solution_steps`.

```json
{
  "kind": "static",
  "source_static_id": "<static_questions.id>",
  "concept_id": "<atomic_concepts.id>",
  "lesson_number": "<atomic_concepts.lesson_number>",
  "content_sha256": "<approved signature>",
  "options": [{ "key": "A", "text": "..." }]
}
```

The student Heat renderer already accepts keyed static options. The shared work must normalize and validate them before persistence. Teacher and student results must attribute static outcomes through the persisted exact `concept_id`, rather than the current generic static bucket.

## Required Regression and Acceptance Tests

| Test | Passing condition |
|---|---|
| Static eligibility | Reject inactive, unverified, fingerprint-mismatched, malformed, wrong-lesson, duplicate-key, and answer-mismatched rows. |
| Static capacity | Reject a focused five-question request where the selected static-only concept has fewer than five unique eligible items. |
| Mixed plan | Include every selected concept once, use only exact candidates, and meet count without repeat or fallback. |
| Worksheet rendering | Render a static MC prompt and all four keyed options correctly; calculate actual points; preserve no-answer practice payload and PDF. |
| Linked preparation | Persist worksheet-used static IDs; exclude them from the later authorized linked Heat; reject when remaining capacity is insufficient. |
| Heat delivery | Persist complete static metadata, render options, score letter responses, and attribute result to exact concept. |
| Procedural regression | Existing source-aware Grade 6 Ratio worksheet and strict explicit Heat selection tests still pass. |
| Staged-generator regression | The seven migration-054 sources remain non-selectable until independent audit and guarded activation. |

## Grade 6 Sequencing

The shared implementation is common infrastructure. It is accepted first with the Grade 6 Ratios fixture, then used to certify the rest of Grade 6 one topic at a time.

| Topic | Active procedural concepts | Static-only concepts | Inactive staged generator candidates | First certification activity |
|---|---:|---:|---:|---|
| Ratios and Proportional Relationships | 7 | 3 | 0 | Complete static mathematical rule pack and the shared delivery fixture. |
| The Number System | 12 | 3 | 1 | Certify static candidates; audit held coordinate-plane generator. |
| Expressions and Equations | 6 | 4 | 1 | Certify static candidates; audit held dependent-equation generator. |
| Statistics and Probability | 4 | 7 | 0 | Certify static candidates and decide static-bank expansion versus new deterministic sources. |
| Geometry | 5 | 3 | 5 | Certify static candidates; complete deterministic and visual representation review for held generators. |

## Implemented Review-Only Package

The approved implementation package introduces the following artifacts, all inactive until the user explicitly runs the migrations and later approves source records:

| Artifact | Purpose | Activation state |
|---|---|---|
| `056_add_static_question_review_ledger.sql` | Adds the append-only immutable review ledger, with no browser-client write policy. | Not applied by this package. |
| `057_add_worksheet_static_source_use_records.sql` | Adds the classroom-bound server-side record used to exclude linked worksheet static IDs from a later Heat. | Not applied by this package. |
| `static-source-certification.ts` | Canonical browser/server-safe SHA-256 fingerprint, option validation, and current-approval check. | No item can pass without a future ledger record and `is_verified = true`. |
| `source-delivery-plan.ts` | Exact coverage/count/no-repeat planner shared by worksheets and Heats. | Rejects unsupported, unapproved, thin, or excluded sources. |
| `source-delivery-service.ts` | Server-only database resolver; the browser never provides answers, static IDs, or approvals. | Used only after the future migrations are applied and code is deployed. |

## Non-Goals

This design does not approve a static question, alter `is_verified`, activate any mapping in migration `054`, introduce an unmapped visual fallback, lower the worksheet count policy, weaken roster admission, deploy code, or create a worksheet or Heat.

## Approval Requested

Approve the product rules in **Product Decisions Requested** before implementation of the shared foundation. Approval authorizes a repository code/migration package for review and testing only. It does not authorize running a database migration, verifying sources, activating staged mappings, deploying, or creating student-facing artifacts.

## References

- `docs/ATOMIC_CONCEPT_AVAILABILITY_CONTRACT.md`
- `docs/G6_DISABLED_CONCEPT_COMPLETION_REGISTER.md`
- `docs/G6_STATIC_SOURCE_NORMALIZATION_RUNBOOK.md`
- `src/lib/content/concept-availability.ts`
- `src/lib/assessment/assembler.ts`
- `src/app/api/assessment/generate/route.ts`
- `src/lib/competition/question-delivery.ts`
- `src/lib/competition/heat-service.ts`
- `src/components/assessment/AssessmentDoc.tsx`
- `src/components/competition/CompetitionView.tsx`
- `src/components/competition/TeacherResults.tsx`
- `src/components/competition/StudentResults.tsx`
