# Grade 6 Static Source Normalization — Runbook

**Status:** Prepared deterministic proposal; no database change is made by this repository content alone.

This package repairs only visible-text formatting defects identified by the Grade 6 static-candidate readability check. It applies no mathematical rewrite, does not verify any static item, and does not make any concept selectable.

## Scope

The guarded migration `055_normalize_g6_static_readability.sql` contains exactly 33 active, unverified Grade 6 static candidates as its reviewed source set. It changes only 32 rows because one already-clear answer-choice stem ends with a colon and is retained unchanged.

| Proposed normalization | Affected records |
|---|---:|
| Trim prompt edge whitespace and add clear terminal punctuation where absent | 31 prompts receive the question-mark form; one colon-ended stem is retained |
| Trim option edge whitespace | 1 item |
| Collapse accidental repeated whitespace in explanations | 3 items |
| Changes to correct answers, concept mappings, activity, or verification | 0 |

## Required order

First, run the read-only preflight query. In Windows PowerShell, from the repository root:

```powershell
Get-Content "docs\PILOT_CONTENT_AUDIT_EVIDENCE\g6-static-normalization-preflight.sql" -Raw | Set-Clipboard
```

Paste it in a **new Supabase SQL Editor query** and select **Run**. Continue only when the single result row is exactly:

| Field | Required value |
|---|---:|
| `expected_items` | `33` |
| `ids_found` | `33` |
| `exact_precondition_matches` | `33` |
| `mismatched_items` | `0` |
| `preflight_decision` | `SAFE_TO_REVIEW_WRITE_MIGRATION` |

If any value differs, stop. Do not run the migration; the live source may have changed since the manifest was built.

Second, after a passing preflight and only after an explicit decision to make the formatting-only change, copy the guarded migration:

```powershell
Get-Content "supabase\migrations\055_normalize_g6_static_readability.sql" -Raw | Set-Clipboard
```

Paste it into a new Supabase SQL Editor query and select **Run** once. It runs in one transaction and aborts rather than partially changing rows if any exact precondition or postcondition fails.

Third, run the read-only postcheck:

```powershell
Get-Content "docs\PILOT_CONTENT_AUDIT_EVIDENCE\g6-static-normalization-postcheck.sql" -Raw | Set-Clipboard
```

Paste it into a new Supabase SQL Editor query and select **Run**. Every returned row must have `true` for all preservation and expected-normalization columns.

## What this does not approve

This formatting normalization does **not** approve the static questions mathematically or pedagogically. It leaves `is_verified = false`, leaves every affected concept non-selectable, and does not activate any staged generator. Further deterministic mathematical certification, exact-source capacity work, shared static delivery support, and controlled rendering acceptance remain separate gates.

## Evidence

The exact source fingerprints and transformation scope are in `PILOT_CONTENT_AUDIT_EVIDENCE/g6-static-normalization-manifest.json`. The readability rule pack is `config/g6_readability_rules.json`, and the corresponding deterministic evaluator is `scripts/check_g6_static_readability.py`.

> The stored-source correction is deliberately limited to transparent normalization. Any wording, notation, distractor, answer, or mathematical change requires a separate reviewed source revision rather than this migration.
