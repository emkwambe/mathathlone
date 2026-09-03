# Pilot Content Audit — NC Math 1 Linear Equations Progression

**Audit status:** **Source-level content gates passed — not yet classroom-ready.**

**Scope:** NC Math 1 → Equations & Inequalities → `M1.EQN.2.2` through `M1.EQN.2.5`.

**Audit date:** 2026-09-02/03

**Audit standard:** [`PILOT_CONTENT_AUDIT_REFERENCE_CHECKLISTS.md`](./PILOT_CONTENT_AUDIT_REFERENCE_CHECKLISTS.md)

> **Mathematical veto:** Any incorrect answer, contradictory prompt, invalid solution set, ambiguous required answer, or answer-key mismatch halts the affected concept. Mathematical correctness, announced-skill fidelity, and automated difficulty controls now pass for this source version. A qualified NC Math 1 teacher review and controlled production workflow evidence remain required before classroom release.

## 1. Approved instructional window

| Standard | Announced student-facing skill | Generator type | Live mapping result |
|---|---|---|---|
| M1.EQN.2.2 | Solve one-step addition/subtraction equations | `linear_eq_one_step_add` | Active; NC Math 1 → Equations & Inequalities |
| M1.EQN.2.3 | Solve one-step multiplication/division equations | `linear_eq_one_step_mult` | Active; NC Math 1 → Equations & Inequalities |
| M1.EQN.2.4 | Solve two-step linear equations | `linear_eq_two_step` | Active; NC Math 1 → Equations & Inequalities |
| M1.EQN.2.5 | Solve multi-step linear equations | `linear_eq_multi_step` | Active; NC Math 1 → Equations & Inequalities |

The live Supabase inventory returned one active generator row for every expected generator type. All four mappings align to course code `NCM1`, course name **NC Math 1**, and topic **Equations & Inequalities**.

## 2. Final evidence and method

The maintained retained evidence is [`m1-linear-first-scope-samples.json`](./PILOT_CONTENT_AUDIT_EVIDENCE/m1-linear-first-scope-samples.json). It contains five deterministically seeded, nonrepeating instances for each of four generators at each of four difficulty levels: **80 retained samples** in total. The multiplication/division retained set includes both explicit forms at every difficulty level.

The maintained invariant test is [`audit-m1-linear-first-scope.ts`](../scripts/audit-m1-linear-first-scope.ts). It generated **16,000** additional seeded items—1,000 for every generator/difficulty pair—and parsed each visible equation from `question_text`. It recomputed the answer by substitution rather than trusting the generated answer field or solution steps. It also verifies nonzero required terms, nontrivial higher-level coefficients, explicit difficulty-band requirements, both multiplication/division forms, and 12-question same-session uniqueness through the shared bounded-retry helper.

The final independent review is retained in [`m1-linear-final-independent-review.json`](./PILOT_CONTENT_AUDIT_EVIDENCE/m1-linear-final-independent-review.json).

| Evidence measure | Final result |
|---|---:|
| Active production generator mappings | 4 / 4 pass |
| Retained samples | 80 |
| Retained sample groups | 16 |
| Unique retained prompts within each group | 5 / 5 in all 16 groups |
| Independent mathematical-invariant runs | 16,000 / 16,000 pass |
| Same-session uniqueness checks | 12 / 12 in all 16 groups |
| Final independently reviewed groups | 16 / 16 pass |
| Mathematical-answer defects found | 0 |

## 3. Mathematical correctness decision

All independent checks passed. The verifier evaluates the printed equation, not the generator’s stored answer: it recomputes addition/subtraction relations, multiplication/division relations including explicit `x ÷ a = q` items, two-step equations, and multi-step distribution/combination equations.

> **Decision:** The mathematical-correctness veto is **clear for the four audited generators in this source version**. No incorrect answer, algebraically invalid equation, contradictory prompt, or solution mismatch was found in the 16,000-item invariant population, the 80 retained samples, or the final independent review. Regression evidence is required after any later change to these generators.

## 4. Remediation completed

The prior audit held calibrated classroom release because three source controls were incomplete. Each finding is closed in the current source and automated evidence.

| Former finding | Completed correction | Verification |
|---|---|---|
| `M1-CAL-01`: one-step add/sub levels overlapped | Level 1 uses positive addition; level 2 uses positive-number subtraction; level 3 uses a negative solution with positive addition; level 4 uses subtraction of a negative with larger signed values. | Explicit invariant assertions plus final 16-group review. |
| `M1-REP-02`: multiplication/division lacked division form | The generator now produces both coefficient equations and explicit division-form equations at each level. Higher levels use signed, nonunit factors. | Every 1,000-item level population contains both forms; every retained level group includes both forms. |
| `M1-CAL-03`: multi-step ignored difficulty and allowed zero inner terms | Each level now has its own numeric/structural band. Inner and outer constants are nonzero; level 3 uses a negative distributive coefficient; level 4 adds a second `x` term for combination after distribution. | Explicit invariant assertions plus final 16-group review. |
| Higher-level trivial notation | Higher-level two-step and multi-step generators reject unit coefficients where that would undermine intended complexity. | Invariant assertions and retained samples. |

## 5. Current release status

| Gate | Status | Closure condition |
|---|---|---|
| Live mapping and active generator coverage | **Pass** | Recheck if database mappings change. |
| Mathematical correctness | **Pass** | Re-run invariant evidence after any generator change. |
| Announced-skill fidelity | **Pass** | Preserve both multiplication and division representations for `M1.EQN.2.3`. |
| Difficulty calibration | **Pass** | Preserve the documented level 1–4 structures and invariant assertions. |
| Variation and same-session duplicates | **Pass** | Keep shared bounded-retry uniqueness in worksheet and Heat assembly. |
| Qualified NC Math 1 teacher review | **Pending** | Teacher signs the retained 80-item review set or records required edits. |
| Printable worksheet/PDF review | **Pending** | Practice worksheet preserves fractions, signs, negatives, parentheses, and division notation in browser and saved PDF. |
| Worksheet-to-Heat independence | **Pending** | Teacher uses one announced blueprint; the Heat generates fresh instances. |
| Roster/class operational check | **Pending** | Controlled DEMO teacher/class/Mathlete workflow passes. |

The scope may accurately be described as **mathematically validated and source-calibrated**. It must **not** yet be described as classroom-ready, official EOC preparation, or an EOC score predictor.

## 6. Remaining controlled acceptance sequence

1. Give a qualified NC Math 1 teacher the retained 80-item set for instructional review and document any edits.
2. In a controlled DEMO class, generate a student-facing Practice Review for this exact four-skill blueprint.
3. Save it as PDF and verify fractions, negative signs, parentheses, and answer fields render correctly; the Practice Review must not include an answer key.
4. Return to Heat Builder and confirm the exact class and four-skill blueprint persist.
5. Launch a short class-bound Heat and confirm its new equation instances do not duplicate worksheet prompts.
6. Confirm a Mathlete outside the selected class cannot join.

## 7. Scope and external assessment boundary

NC Math 1 is an EOC-tested course in North Carolina. This audit supports original, standards-linked practice and competition preparation; it does not establish official-test alignment, predict EOC performance, or permit copying/rehosting NCDPI released items.[1] [2]

## References

[1]: https://www.dpi.nc.gov/documents/accountability/testing/eoc/eoc-nc-math-1-and-nc-math-3-test-specifications "North Carolina Department of Public Instruction — EOC NC Math 1 and NC Math 3 Test Specifications"

[2]: https://www.dpi.nc.gov/districts-schools/accountability-and-testing/state-tests/end-course-eoc "North Carolina Department of Public Instruction — End-of-Course (EOC)"
