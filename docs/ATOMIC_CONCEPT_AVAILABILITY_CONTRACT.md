# Atomic-Concept Availability Contract

**Status:** Proposed deterministic safeguard; not a classroom-release approval
**Applies to:** Every selector-visible `public.atomic_concepts` record

## Purpose

MathAthlone maintains a broader curriculum catalogue than its currently verified question-delivery catalogue. This contract prevents a catalogue record from being represented as usable merely because it is visible in a teacher picker. An atomic concept is **available for a worksheet or Heat only when it has an approved active question source mapped to that exact concept**.

This is a deterministic content-delivery rule. It does not use AI and does not calculate scores, create questions, select winners, determine eligibility, or make audit decisions.

## Required Source States

| Availability state | Deterministic requirement | Builder treatment | Classroom-ready claim? |
|---|---|---|---|
| `procedural` | An active `question_generators` row points to the atomic-concept UUID and its `generator_type` exists in the runtime `GENERATORS` registry. | Selectable. | No; source and scope audit gates still apply. |
| `static` | At least one active, verified `static_questions` row uses the atomic concept’s exact `lesson_number` in `static_questions.concept_id`. | Recognized as valid source evidence; remains non-selectable until the delivery path can meet the requested format/count entirely from mapped static items. | No; source and scope audit gates still apply. |
| `visual` | An active, verified registry entry explicitly maps a versioned visual source to the atomic-concept UUID and the source passes representation review. | Recognized as valid source evidence; remains non-selectable until the renderer/print path supports the source. | No; source and scope audit gates still apply. |
| `mixed` | More than one approved active source state applies to the same atomic concept. | Selectable only when at least one mapped source supports the requested delivery path. | No; source and scope audit gates still apply. |
| `unavailable` | No source meets the applicable active, implementation, verification, and mapping requirements. | Visible for curriculum planning but disabled for worksheet and Heat selection. | No. |

> A source’s **availability** is not its **approval**. Availability answers whether a particular concept can be delivered without substituting unrelated content. Audit and qualified-educator gates separately decide whether that source may be used in a classroom.

## Required Data Contracts

| Source family | Current authoritative mapping | Availability check | Limitation to correct |
|---|---|---|---|
| Procedural | `question_generators.concept_id` → `atomic_concepts.id` | `is_active = true` plus an implemented runtime key | Existing preflight already applies this rule. |
| Static | `static_questions.concept_id` → `atomic_concepts.lesson_number` | `is_active = true` and `is_verified = true` | Current preflight and worksheet assembler ignore these items. |
| Visual | No complete explicit concept registry exists | A new explicit registry must map source key to atomic-concept UUID, record activation/verification, and identify supported render targets | Generic visual fallback is never availability evidence for an explicit concept selection. |

No caller may infer coverage from topic membership, course existence, labels, a generic visual pool, a missing database error, or a non-empty question table.

## Builder and Server Rules

Both the Practice Worksheet Builder and Heat Builder must obtain availability from the same server-side source-aware service. Their behavior must be identical:

1. Load all atomic concepts to preserve the course catalogue.
2. Display delivery availability without claiming an audit outcome.
3. Begin every standalone selection empty. Selection helpers may select only concepts whose mapped source supports the requested delivery target.
4. Disable an unsupported concept and explain: **“Not yet available for worksheet or Heat practice.”**
5. Reject any submitted selection containing a concept without a source supported by the current delivery path at the secure server boundary, even if a stale browser state submits it.
6. Preserve an explicit teacher selection without silently substituting or broadening content.
7. Permit a worksheet or Heat only when the requested item type can be fulfilled entirely from sources explicitly mapped to every selected atomic concept.

## Source-Quality and Activation Gates

A new or remediated source must remain inactive until the applicable deterministic tests, mapping checks, source-level audit record, and qualified-educator review are complete. A later guarded activation migration must identify exact concept IDs and source keys. No bulk “activate all” action is permitted.

| Event | Required response |
|---|---|
| Prompt/answer mismatch, wrong concept mapping, or out-of-scope fallback | Deactivate or keep the source inactive; correct, test, and re-review. |
| Static item lacks verified status | Treat as unavailable for builder selection until an auditable verification decision is recorded. |
| Visual item lacks an explicit concept mapping or supported print/Heat representation | Treat as unavailable. |
| Selected source pool cannot meet an explicit concept blueprint | Fail closed; do not backfill with another concept. |

## Coverage Completion Definition

A course’s **coverage inventory is complete** only after every selector-visible atomic concept is classified as `procedural`, `static`, `visual`, `mixed`, or `unavailable`, with the classification reproducible from live data and versioned source registries. A course’s **delivery coverage is complete** only when every selector-visible concept has a mapped source supported by the relevant delivery target; source-evidence states alone are insufficient when the current delivery path cannot fulfill them.

Neither definition alone permits a course-wide classroom-ready claim. Scope-specific mathematical review, qualified educator sign-off, and controlled production worksheet/PDF/Heat acceptance remain separate no-waiver gates.

## References

This contract operationalizes the repository’s `DETERMINISTIC_FIRST_CONTENT_AND_ANALYTICS_POLICY.md`, `PILOT_CONTENT_COVERAGE_PROGRAM.md`, and `PILOT_CONTENT_AUDIT_REFERENCE_CHECKLISTS.md`.
