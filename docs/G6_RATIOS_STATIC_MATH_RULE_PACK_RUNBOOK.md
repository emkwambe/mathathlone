# Grade 6 Ratios Static Mathematical Rule-Pack Runbook

**Status:** Review-only workflow. This runbook does not approve a rule, verify a static question, update a database field, activate a source, or make a concept selectable.

## Purpose

This workflow lets a qualified reviewer state the mathematical rule for each of the five named Grade 6 Ratios static questions in a form a deterministic program can check reproducibly. The program does not solve the English prompt, select an option, rewrite content, or infer the intended standard. It only compares an explicitly approved rule with the exact current stored item.

> A blank, incomplete, changed, or unsupported rule is a **HOLD**. The evaluator must never convert uncertainty into a pass.

## Template Scope

The template at `config/g6_ratios_static_math_rule_pack.template.json` contains exactly five rule records and no more.

| Static item | Lesson | Required review decision |
|---|---|---|
| `1c68a49f-3f59-4caa-b2a3-93489e254060` | `M6.RP.1.1` | Confirm the exact part-to-total ratio interpretation and the one correct option. |
| `c25c4ff4-9035-4226-ba28-76ef19574b3d` | `M6.RP.1.1` | Confirm the ordered ratio-notation interpretation and the one correct option. |
| `5814a4c0-0b23-4518-96fe-de63212aca39` | `M6.RP.1.2` | Confirm the unit-rate definition predicate and the one correct option. |
| `57124bd5-f00e-4c62-ac9f-971d292587d7` | `M6.RP.3.1` | Confirm the rate-per-100 predicate and the one correct option. |
| `5c4f052d-b32e-45b2-8f98-8e242bef3449` | `M6.RP.3.1` | Confirm the part-per-hundred-to-percent predicate and the one correct option. |

## Reviewer Inputs

The qualified reviewer independently solves the stored prompt and then completes the following fields for each rule. The reviewer must use a new, read-only source export from the live database when binding the final rule.

| Field | Who supplies it | Required value |
|---|---|---|
| `atomic_concept_id` | Deterministic binding from the live export | Exact UUID of the atomic concept mapped to the item. |
| `source_observation_sha256` | Deterministic evaluator from the live export | Fingerprint of the current stored prompt, choices, answer, explanation, and related scored fields. |
| `expected_correct_option` | Qualified reviewer | One explicit letter: `A`, `B`, `C`, or `D`. |
| `human_mathematical_statement` | Qualified reviewer | A concise, formal predicate explaining why that letter is correct. |
| `evidence_reference` | Qualified reviewer | Reference to the dated review packet, calculation sheet, or approved curriculum record. |
| `approved_by`, `approved_at` | Qualified reviewer or authorized curriculum approver | Traceable individual and date. |
| Rule and pack `status` | Authorized reviewer | Both must be `approved` only after every required field is complete. |

## Deterministic Evaluation

The evaluator is:

```text
scripts/evaluate_g6_ratios_static_math_rules.py
```

It accepts a read-only item export and a completed rule pack. A `PASS` requires all of the following conditions:

1. The pack and the individual rule are marked `approved` and have approval references.
2. The static item ID, atomic-concept UUID, and lesson number match exactly.
3. The current live-source fingerprint equals the approved observed fingerprint.
4. The explicit expected option is one of `A`–`D`, is displayed, and matches the stored answer key.
5. The reviewer has recorded a mathematical statement, evidence reference, approver, and approval date.
6. The item remains active.

A deterministic `PASS` is **mathematical-rule evidence only**. It remains insufficient by itself for static verification. The later verification decision must also consider the existing structural/readability results, exact-source delivery capacity, pedagogical/presentability decision, and a separate guarded ledger/`is_verified` action.

## Prohibited Actions

The following actions are prohibited in this workflow:

- Do not use AI to select an expected answer, write a mathematical predicate, classify the content, or approve a rule.
- Do not copy a stored answer into `expected_correct_option` without independent qualified review.
- Do not set a rule or pack to `approved` merely to make the evaluator pass.
- Do not set `is_verified = true`, insert a review-ledger approval, activate migration-054 generators, deploy code, or create student artifacts from this runbook.

## Current Draft Result

The unfilled template was evaluated against the 33-item Grade 6 source export and correctly produced **0 passes and 5 holds**. This confirms the evaluator fails closed until explicit qualified-review inputs exist.

## Later Guarded Sequence

After a qualified reviewer completes the rule pack, the later sequence remains:

1. Run a fresh read-only static-item export and bind the completed rules to that exact source state.
2. Run the evaluator and preserve its JSON/Markdown evidence.
3. Obtain a separate explicit decision about whether each item is pedagogically acceptable and whether the source pool is sufficient.
4. Insert append-only review-ledger records and update `is_verified` only through a separately approved, item-ID-bound guarded migration.
5. Re-run source availability and delivery-capacity checks.
6. Perform controlled worksheet and Heat acceptance before claiming the concept operational.
