# Grade 6 Static Candidate — Deterministic Readability Evidence

**Status:** Read-only readability-form evaluation. A pass proves only the explicit form rules in the listed rule pack; it is not a mathematical, curriculum, verification, activation, or release approval.
**Source export:** `/home/ubuntu/upload/pasted_content_12.txt`.
**Rule pack:** `g6-readable-multiple-choice-v1` (`SHA-256: f41eb75e926a3f6bf832f7cf8a591ce2452b0f97b878ed0562e6adfe2daf3fb6`).
**Generated:** 2026-09-13T17:47:53+00:00.
**Evaluator:** `scripts/check_g6_static_readability.py` (standard-library Python only; no AI and no text rewriting).

## Summary

| Result | Count |
|---|---:|
| Input static candidates | 33 |
| Readability passes | 1 |
| Readability holds | 32 |
| Concepts with every current candidate passing | 1 |
| Concepts with at least one readability hold | 19 |

## Failed Explicit Rules

| Rule | Count | Meaning |
|---|---:|---|
| `explanation_repeated_whitespace` | 3 | Explanation contains repeated whitespace. |
| `option_1_leading_trailing_whitespace` | 1 | Configured readability form rule. |
| `option_2_leading_trailing_whitespace` | 1 | Configured readability form rule. |
| `option_3_leading_trailing_whitespace` | 1 | Configured readability form rule. |
| `option_4_leading_trailing_whitespace` | 1 | Configured readability form rule. |
| `prompt_leading_trailing_whitespace` | 31 | Prompt has unintended edge whitespace. |
| `prompt_terminal_punctuation` | 32 | A student-facing prompt must finish with an approved visible terminal punctuation mark. |

## Concept Readability Register

| Topic | Lesson | Concept | Candidates | Pass | Hold | Failed rules |
|---|---|---|---:|---:|---:|---|
| G6.EE | M6.EE.1.3 | Identifying Parts of an Algebraic Expression | 3 | 0 | 3 | prompt_leading_trailing_whitespace (3), prompt_terminal_punctuation (3) |
| G6.EE | M6.EE.3.1 | Understanding What it Means to Solve an Equation or Inequality | 2 | 0 | 2 | explanation_repeated_whitespace (2), prompt_leading_trailing_whitespace (2), prompt_terminal_punctuation (2) |
| G6.EE | M6.EE.4.1 | Writing Inequalities to Represent Constraints (x>c, x<c, etc.) | 2 | 0 | 2 | prompt_leading_trailing_whitespace (2), prompt_terminal_punctuation (2) |
| G6.EE | M6.EE.5.1 | Using Variables to Represent Two Quantities in a Real-World Relationship | 2 | 0 | 2 | prompt_leading_trailing_whitespace (2), prompt_terminal_punctuation (2) |
| G6.GEO | M6.GEO.2.1 | Understanding Polyhedra and Nets | 2 | 0 | 2 | prompt_leading_trailing_whitespace (2), prompt_terminal_punctuation (2) |
| G6.GEO | M6.GEO.3.1 | Understanding Volume of Right Rectangular Prisms | 1 | 0 | 1 | prompt_leading_trailing_whitespace (1), prompt_terminal_punctuation (1) |
| G6.GEO | M6.GEO.4.2 | Solving Real-World Problems Involving Surface Area | 1 | 0 | 1 | prompt_leading_trailing_whitespace (1), prompt_terminal_punctuation (1) |
| G6.NS | M6.NS.2.1 | Understanding Fraction Division (Conceptually) | 3 | 0 | 3 | explanation_repeated_whitespace (1), prompt_leading_trailing_whitespace (2), prompt_terminal_punctuation (3) |
| G6.NS | M6.NS.4.1 | Understanding Positive and Negative Numbers in Context | 2 | 0 | 2 | prompt_leading_trailing_whitespace (2), prompt_terminal_punctuation (2) |
| G6.NS | M6.NS.4.2 | Understanding Integers and Opposites | 2 | 0 | 2 | prompt_leading_trailing_whitespace (2), prompt_terminal_punctuation (2) |
| G6.RP | M6.RP.1.1 | Understanding Ratios (Definition and Different Forms) | 2 | 0 | 2 | prompt_leading_trailing_whitespace (2), prompt_terminal_punctuation (2) |
| G6.RP | M6.RP.1.2 | Understanding Rates and Unit Rates | 1 | 0 | 1 | prompt_leading_trailing_whitespace (1), prompt_terminal_punctuation (1) |
| G6.RP | M6.RP.3.1 | Understanding Percentages as Rates Per 100 | 2 | 0 | 2 | prompt_leading_trailing_whitespace (2), prompt_terminal_punctuation (2) |
| G6.SP | M6.SP.1.1 | Understanding Statistical Questions | 1 | 0 | 1 | option_1_leading_trailing_whitespace (1), option_2_leading_trailing_whitespace (1), option_3_leading_trailing_whitespace (1), option_4_leading_trailing_whitespace (1), prompt_leading_trailing_whitespace (1), prompt_terminal_punctuation (1) |
| G6.SP | M6.SP.1.2 | Understanding Data Distributions and Data Sets | 1 | 0 | 1 | prompt_leading_trailing_whitespace (1), prompt_terminal_punctuation (1) |
| G6.SP | M6.SP.2.1 | Representing Data on Dot Plots and Histograms | 1 | 0 | 1 | prompt_leading_trailing_whitespace (1), prompt_terminal_punctuation (1) |
| G6.SP | M6.SP.4.1 | Describing the Overall Shape of Data Distributions (Symmetry, Skew, Peaks) | 1 | 1 | 0 | — |
| G6.SP | M6.SP.4.2 | Identifying Outliers in Data Distributions | 1 | 0 | 1 | prompt_leading_trailing_whitespace (1), prompt_terminal_punctuation (1) |
| G6.SP | M6.SP.5.1 | Summarizing Numerical Data Sets in Relation to their Context (Part 1) | 1 | 0 | 1 | prompt_leading_trailing_whitespace (1), prompt_terminal_punctuation (1) |
| G6.SP | M6.SP.5.2 | Summarizing Numerical Data Sets in Relation to their Context (Part 2) | 2 | 0 | 2 | prompt_leading_trailing_whitespace (2), prompt_terminal_punctuation (2) |

## Item Hold Register

| Item ID | Lesson | Readability status | Failed explicit rules |
|---|---|---|---|
| `2acb712d-db45-457c-9089-a7869a416460` | M6.EE.1.3 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `68c88803-4aa2-46a6-b979-ec3ec2fd8579` | M6.EE.1.3 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `d7da2c15-29df-4f94-9fe9-adac8f4b0ad8` | M6.EE.1.3 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `3f8c370e-4f71-4d1b-bdf4-2200ea59a3db` | M6.EE.3.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation, explanation_repeated_whitespace |
| `966d9d5f-125c-4d97-bf04-a4fa043b76b7` | M6.EE.3.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation, explanation_repeated_whitespace |
| `3146a26b-c379-4120-b918-40684f040d9f` | M6.EE.4.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `c5ed474f-bc4f-4148-9592-edad53276dcc` | M6.EE.4.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `5cbcccce-1ffb-4577-a6d3-1a62c8a91fbd` | M6.EE.5.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `f62048af-75b9-4579-b7f5-3891d0bea086` | M6.EE.5.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `84d14d9f-b4a0-473c-81be-5df5beb469f7` | M6.GEO.2.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `d89b310b-a522-4e3d-b4d0-4b4596178953` | M6.GEO.2.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `f238dda9-5470-4d12-8f15-e4ee78c72c6a` | M6.GEO.3.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `f0c26925-0703-4ed7-abb7-3dd1dbd5b95d` | M6.GEO.4.2 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `398bf61a-25a7-433d-bd1e-81844a291cf4` | M6.NS.2.1 | READABILITY_HOLD | prompt_terminal_punctuation |
| `cc4dc9f7-4dca-4431-a135-4bb783c689b1` | M6.NS.2.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `d59e9723-3806-4bbb-b432-379c9ae5ae30` | M6.NS.2.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation, explanation_repeated_whitespace |
| `2ece3a90-b00b-4b19-ae45-6fb61aab7571` | M6.NS.4.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `a36b625c-f582-4582-aa52-fb1d52dd5a4b` | M6.NS.4.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `0e3f26e7-7c76-4546-8fb7-d1bb24e28292` | M6.NS.4.2 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `40969ff7-0930-40e6-b31d-ca0687d47185` | M6.NS.4.2 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `1c68a49f-3f59-4caa-b2a3-93489e254060` | M6.RP.1.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `c25c4ff4-9035-4226-ba28-76ef19574b3d` | M6.RP.1.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `5814a4c0-0b23-4518-96fe-de63212aca39` | M6.RP.1.2 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `57124bd5-f00e-4c62-ac9f-971d292587d7` | M6.RP.3.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `5c4f052d-b32e-45b2-8f98-8e242bef3449` | M6.RP.3.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `6387be34-849b-49b0-b391-e5ddee875bcb` | M6.SP.1.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation, option_1_leading_trailing_whitespace, option_2_leading_trailing_whitespace, option_3_leading_trailing_whitespace, option_4_leading_trailing_whitespace |
| `81a06b69-e403-4f04-ba95-4bcd7bf2720b` | M6.SP.1.2 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `5a9025c6-eddb-4937-816f-7ea50e079529` | M6.SP.2.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `95a88626-1bcc-41b9-94eb-b7cf3e64668c` | M6.SP.4.1 | READABILITY_PASS | — |
| `e508b24a-6785-4e23-ab96-12b784a90a76` | M6.SP.4.2 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `04984eaa-b3dd-497e-b39d-6d0534fcfd04` | M6.SP.5.1 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `606c8082-2025-4982-a376-eed6d95c4cd2` | M6.SP.5.2 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |
| `90b231df-485f-476c-aae3-188fe002fda3` | M6.SP.5.2 | READABILITY_HOLD | prompt_leading_trailing_whitespace, prompt_terminal_punctuation |

## Release Discipline

This evaluator does not correct text automatically. A readability hold requires a source correction or a documented exception under an explicitly approved rule. Even a readability pass does not make a static item selectable: structural validation, mathematical/curriculum certification, exact-source capacity, and shared worksheet/Heat delivery validation still remain required.

## Reproducibility

```text
python3 scripts/check_g6_static_readability.py \
  /home/ubuntu/upload/pasted_content_12.txt \
  /home/ubuntu/mathathlone-main-status/config/g6_readability_rules.json \
  docs/PILOT_CONTENT_AUDIT_EVIDENCE/g6-static-readability-report.md \
  docs/PILOT_CONTENT_AUDIT_EVIDENCE/g6-static-readability-evidence.json
```
