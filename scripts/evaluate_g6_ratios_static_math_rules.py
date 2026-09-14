#!/usr/bin/env python3
"""Evaluate explicit human-approved Grade 6 Ratios static math rules.

This program is deliberately narrow. It performs no natural-language inference,
does not generate an answer, and never writes to the database. A mathematical
PASS is possible only when an approved rule states the expected option and is
bound to the current exact stored source fingerprint.
"""

from __future__ import annotations

import argparse
import hashlib
import json
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


def canonical_source_sha256(item: dict[str, Any]) -> str:
    payload = {field: item.get(field) for field in FINGERPRINT_FIELDS}
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def issue(code: str, detail: str) -> dict[str, str]:
    return {"code": code, "detail": detail}


def evaluate_rule(
    rule_pack: dict[str, Any],
    rule: dict[str, Any],
    item: dict[str, Any] | None,
) -> dict[str, Any]:
    issues: list[dict[str, str]] = []
    if rule_pack.get("status") != "approved":
        issues.append(issue("RULE_PACK_NOT_APPROVED", "The rule pack status is not approved."))
    if not isinstance(rule_pack.get("approval", {}).get("approval_reference"), str) or not rule_pack["approval"]["approval_reference"].strip():
        issues.append(issue("RULE_PACK_APPROVAL_REFERENCE_MISSING", "The approved rule pack needs an evidence reference."))
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
    if expected_option not in {"A", "B", "C", "D"}:
        issues.append(issue("EXPECTED_OPTION_MISSING", "The approved rule must explicitly state one A–D expected option."))
    if rule.get("source_observation_sha256") != current_fingerprint:
        issues.append(issue("SOURCE_FINGERPRINT_MISMATCH", "The rule must be bound to the exact current source fingerprint."))
    if not isinstance(rule.get("human_mathematical_statement"), str) or not rule["human_mathematical_statement"].strip():
        issues.append(issue("MATHEMATICAL_STATEMENT_MISSING", "A qualified reviewer must record the explicit mathematical predicate."))
    if not isinstance(rule.get("evidence_reference"), str) or not rule["evidence_reference"].strip():
        issues.append(issue("RULE_EVIDENCE_REFERENCE_MISSING", "A qualified reviewer must record the evidence reference."))
    if not isinstance(rule.get("approved_by"), str) or not rule["approved_by"].strip():
        issues.append(issue("RULE_APPROVER_MISSING", "The individual rule needs an approver identifier."))
    if not isinstance(rule.get("approved_at"), str) or not rule["approved_at"].strip():
        issues.append(issue("RULE_APPROVAL_DATE_MISSING", "The individual rule needs an approval date."))
    if item.get("is_active") is not True:
        issues.append(issue("STATIC_ITEM_INACTIVE", "The source item is not active."))

    option_keys = [option.get("key") for option in item.get("options", []) if isinstance(option, dict)]
    if expected_option in {"A", "B", "C", "D"} and expected_option not in option_keys:
        issues.append(issue("EXPECTED_OPTION_NOT_RENDERED", "The expected option is not present in the rendered option set."))
    if expected_option in {"A", "B", "C", "D"} and item.get("correct_answer") != expected_option:
        issues.append(issue("STORED_ANSWER_MISMATCH", "The stored answer differs from the explicit approved mathematical rule."))

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
    parser.add_argument("--output-json", type=Path, required=True, help="Evidence JSON output path.")
    parser.add_argument("--output-md", type=Path, required=True, help="Readable evidence report output path.")
    args = parser.parse_args()

    all_items = read_json(args.items)
    rule_pack = read_json(args.rule_pack)
    if not isinstance(all_items, list):
        raise SystemExit("The item export must be a JSON array.")
    if not isinstance(rule_pack, dict) or not isinstance(rule_pack.get("rules"), list):
        raise SystemExit("The rule pack must contain a rules array.")

    items_by_id = {
        item.get("static_question_id"): item
        for item in all_items
        if isinstance(item, dict) and isinstance(item.get("static_question_id"), str)
    }
    results = [evaluate_rule(rule_pack, rule, items_by_id.get(rule.get("static_question_id"))) for rule in rule_pack["rules"] if isinstance(rule, dict)]
    pass_count = sum(result["status"] == "PASS" for result in results)
    hold_count = len(results) - pass_count
    evidence = {
        "evaluator": "evaluate_g6_ratios_static_math_rules.py",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "rule_pack_id": rule_pack.get("rule_pack_id"),
        "rule_pack_version": rule_pack.get("rule_pack_version"),
        "rule_pack_status": rule_pack.get("status"),
        "items_in_export": len(all_items),
        "rules_evaluated": len(results),
        "pass_count": pass_count,
        "hold_count": hold_count,
        "results": results,
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_md.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Grade 6 Ratios Static Mathematical Rule Evaluation",
        "",
        "**Status:** Review-only deterministic evidence. This report does not verify a static item, update a database field, activate a source, or make a concept selectable.",
        "",
        "| Measure | Result |",
        "|---|---:|",
        f"| Rule pack status | `{rule_pack.get('status')}` |",
        f"| Rules evaluated | {len(results)} |",
        f"| Mathematical PASS results | {pass_count} |",
        f"| HOLD results | {hold_count} |",
        "",
        "A PASS means only that an explicitly approved rule matched the supplied source fingerprint and stored answer. It remains insufficient by itself for source verification or availability.",
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
        "A qualified reviewer must populate and approve every explicit rule field in the template, then rerun this evaluator against a fresh read-only export. The output may be referenced in a later append-only review-ledger record only after a separate guarded verification decision.",
        "",
    ])
    args.output_md.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"rules_evaluated": len(results), "pass_count": pass_count, "hold_count": hold_count}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
