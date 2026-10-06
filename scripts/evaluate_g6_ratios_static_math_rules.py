#!/usr/bin/env python3
"""Evaluate explicit human-approved Grade 6 Ratios static math rules.

This program is deliberately narrow. It performs no natural-language inference,
does not generate an answer, and never writes to the database. A mathematical
PASS is possible only when an approved rule states the expected option and is
bound to the current exact stored source fingerprint from an explicitly marked
live export.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

FINGERPRINT_FIELDS = (
    "question_type",
    "question_text",
    "question_latex",
    "question_image_url",
    "options",
    "option_images",
    "correct_answer",
    "correct_answer_index",
    "explanation",
    "solution_steps",
    "difficulty",
)
EXPECTED_RULE_COUNT = 5
OPTION_KEYS = ("A", "B", "C", "D")


def canonical_source_sha256(item: dict[str, Any]) -> str:
    payload = {field: item.get(field) for field in FINGERPRINT_FIELDS}
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def issue(code: str, detail: str) -> dict[str, str]:
    return {"code": code, "detail": detail}


def valid_iso_datetime(value: Any) -> bool:
    if not isinstance(value, str) or not value.strip():
        return False
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False
    return True


def validate_options(item: dict[str, Any], issues: list[dict[str, str]]) -> list[str]:
    options = item.get("options")
    if not isinstance(options, list):
        issues.append(issue("OPTIONS_MALFORMED", "The static item options must be a JSON array."))
        return []
    if len(options) != 4 or any(not isinstance(option, dict) for option in options):
        issues.append(issue("OPTIONS_NOT_EXACTLY_FOUR", "The rendered source must contain exactly four option objects."))
    keys = [option.get("key") for option in options if isinstance(option, dict)]
    if len(keys) != len(set(keys)):
        issues.append(issue("DUPLICATE_OPTION_KEYS", "The rendered option set contains duplicate option keys."))
    if set(keys) != set(OPTION_KEYS):
        issues.append(issue("OPTION_KEYS_NOT_A_TO_D", "The rendered option keys must be exactly A, B, C, and D."))
    return keys


def evaluate_rule(
    rule_pack: dict[str, Any],
    rule: dict[str, Any],
    item: dict[str, Any] | None,
    *,
    source_kind: str,
) -> dict[str, Any]:
    issues: list[dict[str, str]] = []
    approval = rule_pack.get("approval")
    if not isinstance(approval, dict):
        approval = {}
        issues.append(issue("RULE_PACK_APPROVAL_MALFORMED", "The rule-pack approval object is missing or malformed."))
    if rule_pack.get("status") != "approved":
        issues.append(issue("RULE_PACK_NOT_APPROVED", "The rule pack status is not approved."))
    if not isinstance(approval.get("approval_reference"), str) or not approval["approval_reference"].strip():
        issues.append(issue("RULE_PACK_APPROVAL_REFERENCE_MISSING", "The approved rule pack needs an evidence reference."))
    if not isinstance(approval.get("approved_by"), str) or not approval["approved_by"].strip():
        issues.append(issue("RULE_PACK_APPROVER_MISSING", "The rule pack needs an approver identifier."))
    if not valid_iso_datetime(approval.get("approved_at")):
        issues.append(issue("RULE_PACK_APPROVAL_DATE_INVALID", "The rule-pack approved_at must be a valid ISO date or timestamp."))
    if source_kind != "live_export":
        issues.append(issue("SOURCE_NOT_MARKED_LIVE", "Only an explicitly marked live_export may produce mathematical PASS evidence."))
    if rule.get("status") != "approved":
        issues.append(issue("RULE_NOT_APPROVED", "The individual mathematical rule status is not approved."))
    if not item:
        issues.append(issue("STATIC_ITEM_NOT_FOUND", "The named static item was not present in the supplied export."))
        return {"rule_id": rule.get("rule_id"), "status": "HOLD", "issues": issues}

    current_fingerprint = canonical_source_sha256(item)
    if rule.get("rule_type") != "expected_correct_option":
        issues.append(issue("UNSUPPORTED_RULE_TYPE", "Only expected_correct_option is supported by this evaluator."))
    if rule.get("atomic_concept_id") != item.get("atomic_concept_id"):
        issues.append(issue("ATOMIC_CONCEPT_MISMATCH", "The approved rule must name the exact exported atomic concept UUID."))
    if rule.get("lesson_number") != item.get("lesson_number"):
        issues.append(issue("LESSON_NUMBER_MISMATCH", "The approved rule lesson number does not match the exported source."))
    expected_option = rule.get("expected_correct_option")
    if expected_option not in OPTION_KEYS:
        issues.append(issue("EXPECTED_OPTION_MISSING", "The approved rule must explicitly state one A–D expected option."))
    if rule.get("source_observation_sha256") != current_fingerprint:
        issues.append(issue("SOURCE_FINGERPRINT_MISMATCH", "The rule must be bound to the exact current source fingerprint."))
    if not isinstance(rule.get("human_mathematical_statement"), str) or not rule["human_mathematical_statement"].strip():
        issues.append(issue("MATHEMATICAL_STATEMENT_MISSING", "A qualified reviewer must record the explicit mathematical predicate."))
    if not isinstance(rule.get("evidence_reference"), str) or not rule["evidence_reference"].strip():
        issues.append(issue("RULE_EVIDENCE_REFERENCE_MISSING", "A qualified reviewer must record the evidence reference."))
    if not isinstance(rule.get("approved_by"), str) or not rule["approved_by"].strip():
        issues.append(issue("RULE_APPROVER_MISSING", "The individual rule needs an approver identifier."))
    if not valid_iso_datetime(rule.get("approved_at")):
        issues.append(issue("RULE_APPROVAL_DATE_INVALID", "The individual rule approved_at must be a valid ISO date or timestamp."))
    if item.get("is_active") is not True:
        issues.append(issue("STATIC_ITEM_INACTIVE", "The source item is not active."))

    option_keys = validate_options(item, issues)
    if expected_option in OPTION_KEYS and expected_option not in option_keys:
        issues.append(issue("EXPECTED_OPTION_NOT_RENDERED", "The expected option is not present in the rendered option set."))
    if expected_option in OPTION_KEYS and item.get("correct_answer") != expected_option:
        issues.append(issue("STORED_ANSWER_MISMATCH", "The stored answer differs from the explicit approved mathematical rule."))

    answer_index = item.get("correct_answer_index")
    if answer_index is not None:
        if not isinstance(answer_index, int) or isinstance(answer_index, bool) or not 0 <= answer_index < len(option_keys):
            issues.append(issue("ANSWER_INDEX_INVALID", "The stored correct_answer_index must be a valid zero-based option index."))
        elif option_keys[answer_index] != item.get("correct_answer"):
            issues.append(issue("ANSWER_INDEX_MISMATCH", "The stored correct_answer_index does not identify the stored answer key."))

    return {
        "rule_id": rule.get("rule_id"),
        "static_question_id": item.get("static_question_id"),
        "atomic_concept_id": item.get("atomic_concept_id"),
        "lesson_number": item.get("lesson_number"),
        "current_source_observation_sha256": current_fingerprint,
        "status": "PASS" if not issues else "HOLD",
        "issues": issues,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--items", type=Path, required=True, help="JSON array exported read-only from static_questions.")
    parser.add_argument("--rule-pack", type=Path, required=True, help="Human-authored rule-pack JSON.")
    parser.add_argument("--source-kind", choices=("fixture", "live_export"), default="fixture", help="Explicitly identify the item source; only live_export can pass.")
    parser.add_argument("--output-json", type=Path, required=True, help="Evidence JSON output path.")
    parser.add_argument("--output-md", type=Path, required=True, help="Readable evidence report output path.")
    args = parser.parse_args()

    try:
        all_items = read_json(args.items)
        rule_pack = read_json(args.rule_pack)
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Input read failure: {exc}") from exc
    if not isinstance(all_items, list):
        raise SystemExit("The item export must be a JSON array.")
    if not isinstance(rule_pack, dict) or not isinstance(rule_pack.get("rules"), list):
        raise SystemExit("The rule pack must contain a rules array.")

    item_ids = [item.get("static_question_id") for item in all_items if isinstance(item, dict)]
    duplicate_item_ids = sorted({item_id for item_id in item_ids if item_id and item_ids.count(item_id) > 1})
    rule_records = [rule for rule in rule_pack["rules"] if isinstance(rule, dict)]
    rule_ids = [rule.get("rule_id") for rule in rule_records]
    duplicate_rule_ids = sorted({rule_id for rule_id in rule_ids if rule_id and rule_ids.count(rule_id) > 1})

    items_by_id = {
        item.get("static_question_id"): item
        for item in all_items
        if isinstance(item, dict) and isinstance(item.get("static_question_id"), str)
    }
    results = [evaluate_rule(rule_pack, rule, items_by_id.get(rule.get("static_question_id")), source_kind=args.source_kind) for rule in rule_records]
    global_issues: list[dict[str, str]] = []
    if len(rule_records) != EXPECTED_RULE_COUNT:
        global_issues.append(issue("RULE_COUNT_MISMATCH", f"Expected exactly {EXPECTED_RULE_COUNT} rule records."))
    if duplicate_item_ids:
        global_issues.append(issue("DUPLICATE_STATIC_ITEM_IDS", "Duplicate static question IDs were found in the item export."))
    if duplicate_rule_ids:
        global_issues.append(issue("DUPLICATE_RULE_IDS", "Duplicate rule IDs were found in the rule pack."))
    if global_issues:
        for result in results:
            result["issues"].extend(global_issues)
            result["status"] = "HOLD"

    pass_count = sum(result["status"] == "PASS" for result in results)
    hold_count = len(results) - pass_count
    evidence = {
        "evaluator": "evaluate_g6_ratios_static_math_rules.py",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_kind": args.source_kind,
        "source_provenance": {
            "items_path": str(args.items),
            "items_sha256": file_sha256(args.items),
            "rule_pack_path": str(args.rule_pack),
            "rule_pack_sha256": file_sha256(args.rule_pack),
        },
        "rule_pack_id": rule_pack.get("rule_pack_id"),
        "rule_pack_version": rule_pack.get("rule_pack_version"),
        "rule_pack_status": rule_pack.get("status"),
        "items_in_export": len(all_items),
        "rules_evaluated": len(results),
        "pass_count": pass_count,
        "hold_count": hold_count,
        "global_issues": global_issues,
        "results": results,
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_md.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# Grade 6 Ratios Static Mathematical Rule Evaluation",
        "",
        "**Status:** Review-only deterministic evidence. This report does not verify a static item, update a database field, activate a source, or make a concept selectable.",
        "",
        "| Measure | Result |",
        "|---|---:|",
        f"| Source kind | `{args.source_kind}` |",
        f"| Rule pack status | `{rule_pack.get('status')}` |",
        f"| Rules evaluated | {len(results)} |",
        f"| Mathematical PASS results | {pass_count} |",
        f"| HOLD results | {hold_count} |",
        "",
        "A PASS means only that an explicitly approved rule matched the supplied live source fingerprint and stored answer. It remains insufficient by itself for source verification or availability.",
        "",
        "## Per-Item Results",
        "",
        "| Rule | Static item | Lesson | Status | Deterministic holds |",
        "|---|---|---|---|---|",
    ]
    for result in results:
        issue_codes = ", ".join(entry["code"] for entry in result["issues"]) or "—"
        lines.append(
            f"| `{result.get('rule_id')}` | `{result.get('static_question_id', '—')}` | `{result.get('lesson_number', '—')}` | **{result['status']}** | {issue_codes} |"
        )
    lines.extend([
        "",
        "## Required Next Gate",
        "",
        "A qualified reviewer must populate and approve every explicit rule field in the template, then rerun this evaluator against a fresh read-only live export. The output may be referenced in a later append-only review-ledger record only after a separate guarded verification decision.",
        "",
    ])
    args.output_md.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"rules_evaluated": len(results), "pass_count": pass_count, "hold_count": hold_count}, indent=2))
    return 0 if pass_count == len(results) and not global_issues else 1


if __name__ == "__main__":
    raise SystemExit(main())
