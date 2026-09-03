# Pilot Content Audit — NC Math 1 Linear Equations Progression

**Audit status:** **Not ready for classroom release — mathematical correctness passed; calibration and representation remediation required.**

**Scope:** NC Math 1 → Equations & Inequalities → M1.EQN.2.2 through M1.EQN.2.5.

**Audit date:** 2026-09-02/03

**Audit standard:** [`PILOT_CONTENT_AUDIT_REFERENCE_CHECKLISTS.md`](./PILOT_CONTENT_AUDIT_REFERENCE_CHECKLISTS.md)

> **Mathematical veto:** Any incorrect answer, contradictory prompt, invalid solution set, ambiguous required answer, or answer-key mismatch halts the affected concept. Mathematical validity passed in this audit; the remaining blockers are difficulty calibration and announced-skill representation, not answer correctness.

## 1. Approved instructional window

| Standard | Announced student-facing skill | Generator type | Live mapping result |
|---|---|---|---|
| M1.EQN.2.2 | Solve one-step addition/subtraction equations | `linear_eq_one_step_add` | Active; NC Math 1 → Equations & Inequalities |
| M1.EQN.2.3 | Solve one-step multiplication/division equations | `linear_eq_one_step_mult` | Active; NC Math 1 → Equations & Inequalities |
| M1.EQN.2.4 | Solve two-step linear equations | `linear_eq_two_step` | Active; NC Math 1 → Equations & Inequalities |
| M1.EQN.2.5 | Solve multi-step linear equations | `linear_eq_multi_step` | Active; NC Math 1 → Equations & Inequalities |

The live Supabase inventory returned one active generator row for every expected generator type. All four mappings align to course code `NCM1`, course name **NC Math 1**, and topic **Equations & Inequalities**.

## 2. Evidence and methodology

The retained evidence file is [`m1-linear-first-scope-samples.json`](./PILOT_CONTENT_AUDIT_EVIDENCE/m1-linear-first-scope-samples.json). It contains five deterministically seeded instances for each of four generators at each of four difficulty levels: **80 retained samples** in total.

The independent invariant test generated **16,000** additional seeded items: 1,000 items for every generator/difficulty pair. The verifier parsed the visible equation from `question_text`, substituted the reported answer, and tested the equation independently rather than trusting the generator’s solution steps or answer field. It also required an integer answer type and a nonempty solution-step array.

| Evidence measure | Result |
|---|---:|
| Active production generator mappings | 4 / 4 pass |
| Retained samples | 80 |
| Retained sample groups | 16 |
| Unique retained prompts within each group | 5 / 5 in all 16 groups |
| Independent mathematical-invariant runs | 16,000 / 16,000 pass |
| Independently reviewed groups | 16 / 16 |
| Mathematical-answer defects found | 0 |

## 3. Mathematical correctness decision

All independent checks passed. For one-step addition/subtraction and two-step equations, the verifier recomputed the relation `a*x + b = c` from the printed coefficients and constants. For one-step multiplication/division equations, it verified `a*x = c` with nonzero `a`. For multi-step equations, it parsed and verified `a(x + b) + c = result` with the signs displayed in the student-visible prompt.

> **Decision:** The audit found no incorrect answer, algebraically invalid equation, contradictory prompt, or solution mismatch in the 16,000-item invariant population or 80 retained samples. The mathematical-correctness veto is therefore **clear for the four audited generators**, subject to regression testing after any later generator change.

## 4. Independent review findings

The independent review found no critical or major mathematical defect. It did find calibration and scope-representation issues that prevent a classroom-ready claim.

| ID | Finding | Severity | Affected scope | Release decision | Required remediation |
|---|---|---|---|---|---|
| M1-CAL-01 | `linear_eq_one_step_add` permits difficulty-2 and difficulty-4 prompts that overlap introductory positive-number examples. A difficulty-4 sample can remain simpler than a lower-level subtraction case. | Minor | M1.EQN.2.2 | Hold calibrated multi-level release | Define non-overlapping representation/range rules; require sign/operation complexity appropriate to each difficulty. |
| M1-REP-02 | `linear_eq_one_step_mult` currently emits only coefficient equations such as `ax = c`; it does not represent division-form equations despite the announced “multiplication/division” skill. Coefficient `1x` can also produce an overly simple prompt at higher levels. | Major instructional-scope defect | M1.EQN.2.3 | Hold release of this announced four-skill window | Add explicit division-form instances and eliminate coefficient-1 prompts at higher difficulties; calibrate all four difficulty levels. |
| M1-CAL-03 | `linear_eq_multi_step` does not use its `difficulty` parameter. It can emit `(x + 0)`, and levels 1–4 retain the same structure/ranges. | Major calibration defect | M1.EQN.2.5 | Hold calibrated multi-level release | Define explicit level 1–4 numeric/structural bands; avoid zero inner term; ensure higher levels add justified complexity. |

The two-step generator (`M1.EQN.2.4`) passed its retained cross-level review: the progression introduces larger values and negative coefficients/constants as intended, while retaining a unique integer solution.

## 5. Current release status

| Gate | Status | Closure condition |
|---|---|---|
| Live mapping and active generator coverage | Pass | Remains pass unless database mapping changes. |
| Mathematical correctness | Pass | Re-run invariant evidence after generator remediation. |
| Variation within retained samples | Pass | Maintain same-session duplicate protection. |
| Difficulty calibration | **Hold** | Close M1-CAL-01 and M1-CAL-03 with explicit level 1–4 tests. |
| Announced-skill fidelity | **Hold** | Close M1-REP-02 by representing both multiplication and division forms, or rename/narrow the announced skill with course-teacher approval. |
| Qualified NC Math 1 teacher review | Pending | Teacher signs retained corrected review set after remediation. |
| Printable worksheet/PDF review | Pending | Practice worksheet preserves equations, signs, negatives, and multi-step parentheses in browser and saved PDF. |
| Worksheet-to-Heat independence | Pending | Teacher uses same announced blueprint; Heat generates new instances. |
| Roster/class operational check | Pending | Controlled DEMO teacher/class/Mathlete workflow passes. |

## 6. Recommended remediation sequence

1. Correct M1-CAL-01, M1-REP-02, and M1-CAL-03 in the generator layer; do not alter standards, course mappings, or student records.
2. Add maintained invariant tests that prove correct answers, nonzero coefficients, no forbidden trivial identities, appropriate displayed syntax, and difficulty-band boundaries for all four generators.
3. Regenerate the 80-sample retained set and repeat independent group review.
4. Obtain a qualified NC Math 1 teacher review of the corrected retained examples.
5. Complete the production worksheet/PDF and Heat-independence tests using a controlled DEMO class before announcing this scope to students.

Until these gates close, the audit may accurately report **mathematical correctness passed in sampled and invariant-tested evidence**, but it may not describe the linear-equations window as pilot-ready or as calibrated across four difficulty levels.

## 7. Scope and external assessment boundary

NC Math 1 is an EOC-tested course in North Carolina. This audit supports original, standards-linked practice and competition preparation; it does not establish official-test alignment, predict EOC performance, or permit copying/rehosting NCDPI released items.[1] [2]

## References

[1]: https://www.dpi.nc.gov/documents/accountability/testing/eoc/eoc-nc-math-1-and-nc-math-3-test-specifications "North Carolina Department of Public Instruction — EOC NC Math 1 and NC Math 3 Test Specifications"

[2]: https://www.dpi.nc.gov/districts-schools/accountability-and-testing/state-tests/end-course-eoc "North Carolina Department of Public Instruction — End-of-Course (EOC)"
