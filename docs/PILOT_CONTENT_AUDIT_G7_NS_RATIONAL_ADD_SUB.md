# Pilot Content Audit — Grade 7 Rational Addition and Subtraction

**Audit ID:** `PILOT-NC7M-NS-001`
**Status:** **Source remediation complete; database remap, qualified reviewer sign-off, and production acceptance pending**
**Scope:** NC Grade 7 Math → The Number System → `M7.NS.1.1` through `M7.NS.1.4`
**Ranking cohort:** Grade 7
**Content level:** Grade 7
**Audit date:** 2026-09-07
**Author:** Manus AI

## 1. Release decision

This four-concept scope is **not approved for classroom use**. The live inventory confirms that its two conceptual nodes have active static multiple-choice items and its two procedural nodes have active generator-backed free-response items. That source-type distribution is appropriate in principle. However, the audit identified a critical mathematical defect in the active contextual rational-number generator and a separate mapping error that attached that generator to a subtraction-understanding concept outside its actual application scope.

> **Mathematical-correctness veto:** One incorrect answer, contradiction between visible prompt and stored answer, ambiguous required response, or out-of-scope source mapping halts the affected scope. Technical completion, active database flags, or a successful deployment cannot waive this requirement.

| Gate | Finding | Status |
|---|---|---|
| Source alignment | NCDPI’s Grade 7 parent guide says students should add, subtract, multiply, and divide positive and negative fractions and use those operations in real-world problems. [1] | In scope |
| Conceptual addition evidence | `M7.NS.1.1` has 3 active static MC items. | Awaiting qualified review |
| Procedural addition evidence | `M7.NS.1.2` maps to `g7_add_rational`. 400 sampled exact-arithmetic checks passed. | Source evidence favorable |
| Conceptual subtraction evidence | `M7.NS.1.3` has 2 active static MC items. | Awaiting qualified review |
| Procedural subtraction evidence | `M7.NS.1.4` maps to `g7_subtract_rational`. 400 sampled exact-arithmetic checks passed. | Source evidence favorable |
| Contextual generator | Source remediation now binds the displayed fraction to the calculation. A 4,000-item visible-prompt recomputation suite passes across all four contextual branches and difficulties. | Source pass; production deployment pending |
| Contextual generator mapping | Source remediation emits `M7.NS.4.1` (real-world rational operations), matching the versioned specification. The live database remap is pending migration `053`. | Source pass; migration pending |
| Classroom release | Qualified educator review and production worksheet/Heat evidence have not begun. | **Not ready** |

## 2. Approved concept boundary

The present audit is limited to the four source records below. It does not claim that the whole Grade 7 Number System course, the broader Grade 7 course, or a Grade 7 Heat is ready.

| Live lesson number | Intended source type | Current evidence | Audit action |
|---|---|---|---|
| `M7.NS.1.1` | Static MC | 3 active items | Review prompt accuracy, distractors, and single-best-answer validity. |
| `M7.NS.1.2` | Generator FR | `g7_add_rational` | Retain arithmetic invariant testing and verify qualified reviewer samples. |
| `M7.NS.1.3` | Static MC | 2 active items | Review additive-inverse and signed-change wording and distractors. |
| `M7.NS.1.4` | Generator FR | `g7_subtract_rational` | Retain arithmetic invariant testing and verify qualified reviewer samples. |

`g7_ns_rational_word_problem` is excluded from this four-concept scope. Its approved source specification identifies `M7.NS.4.1` as the appropriate real-world rational-operations concept. It must be corrected and remapped before it can be evaluated as its own application scope.

## 3. Confirmed findings

| ID | Severity | Finding | Required disposition | Status |
|---|---|---|---|---|
| `G7-NS-001` | Critical | In the debt-fraction branch, the fraction used by the calculation was selected independently from the fraction shown to the student. Visible-prompt recomputation found wrong stored answers, including a displayed one-half repayment of a $10 debt with stored answer `-3` rather than `-5`. | Source remediation uses one immutable fraction object for prompt text, calculation, and solution steps. The permanent 4,000-item visible-prompt recomputation suite now passes. | Source closed; deployment and qualified review pending |
| `G7-NS-002` | Major | The contextual generator is configured for a real-world rational-operations application but was tagged and live-mapped to `M7.NS.1.3`, a subtraction-understanding node. | Source now emits `M7.NS.4.1`; guarded migration `053` moves the single active database mapping and rejects unexpected database state. The generator is excluded from `M7.NS.1.3` selection until migration verification passes. | Source closed; migration pending |
| `G7-NS-003` | Major | The Grade 7 Number System selector can be broader than the audited four-concept scope. | Use explicit atomic-concept selections only; the deployed strict-scope Heat fix remains required for any production Heat acceptance. | Open production gate |

## 4. Deterministic audit evidence

The audit uses no AI-created labels, questions, answers, scoring, or release decisions. It separates exact computation checks from qualified educational review.

| Evidence | What it proves | Current result |
|---|---|---|
| Live source-type inventory | The two conceptual nodes have static MC coverage, while procedural nodes have generator FR coverage. | Confirmed from live read-only query |
| [`g7-rational-add-sub-mathematical-invariants.json`](./PILOT_CONTENT_AUDIT_EVIDENCE/g7-rational-add-sub-mathematical-invariants.json) | Recomputes visible addition, subtraction, and contextual prompts using deterministic seeds. | 4,800 / 4,800 pass after remediation |
| [`g7-rational-add-sub-qualified-review-set.json`](./PILOT_CONTENT_AUDIT_EVIDENCE/g7-rational-add-sub-qualified-review-set.json) | Retains five static MC items and 40 deterministic procedural samples, with fields for independent reviewer calculations and decisions. | Pending qualified reviewer sign-off |
| `g7-rational-operations.audit.test.ts` and `g7-rational-word-problem.audit.test.ts` | Permanent test coverage for 800 procedural and 4,000 contextual visible-prompt recomputations. | Pass |
| NCDPI Grade 7 parent guide | Confirms the course-level expectation for positive and negative fraction operations and real-world use. [1] | Reference retained |

## 5. Required next steps before educator review

1. Publish and deploy the source remediation for `G7-NS-001` and `G7-NS-002`.
2. Apply and read-only verify guarded migration `053`, which moves the active contextual-generator mapping from `M7.NS.1.3` to `M7.NS.4.1`.
3. Keep the permanent 4,800-item visible-prompt recomputation suite in the release validation path.
4. Obtain qualified Grade 7 educator sign-off on the retained 45-item review set. Any rejected prompt, distractor, answer, or representation reopens the mathematical veto.
5. Only after those gates may a separate controlled worksheet/PDF/Heat rehearsal be considered. No Grade 7 classroom-ready claim is authorized by this record.

## References

[1]: https://www.dpi.nc.gov/rethink-education-7th-grade-math-parent-guide/open "NCDPI — 7th Grade Mathematics Parent Guide"
[2]: https://www.dpi.nc.gov/districts-schools/classroom-resources/office-teaching-and-learning/standard-course-study/mathematics/standard-course-study-supporting-resources "NCDPI — Mathematics Standard Course of Study and Supporting Resources"
