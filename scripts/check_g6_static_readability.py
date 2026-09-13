#!/usr/bin/env python3
"""Apply explicit readability-form checks to Grade 6 static multiple-choice items.

This script is deterministic and read-only. It checks visible text form only; it
never judges mathematical truth, edits question text, writes to a database, or
changes an item verification/activation status.

Usage:
  python3 scripts/check_g6_static_readability.py INPUT.json RULE_PACK.json REPORT.md EVIDENCE.json
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def stop(message: str) -> None:
    raise SystemExit(message)


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        stop(f"Could not read JSON from {path}: {exc}")


def text(value: Any) -> str:
    return value if isinstance(value, str) else ""


def normal(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def fingerprint_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def apply_text_rules(
    *,
    label: str,
    value: str,
    rules: dict[str, Any],
    is_prompt: bool,
) -> list[dict[str, str]]:
    checks: list[dict[str, str]] = []

    def check(rule: str, passed: bool, detail: str) -> None:
        checks.append({"rule": rule, "result": "PASS" if passed else "FAIL", "detail": detail})

    stripped = value.strip()
    normalized = normal(value)
    check(f"{label}_present", bool(stripped), f"{label.replace('_', ' ').capitalize()} is non-empty.")
    check(
        f"{label}_leading_trailing_whitespace",
        value == stripped,
        "Visible text has no leading or trailing whitespace.",
    )
    check(
        f"{label}_repeated_whitespace",
        re.search(r"\s{2,}", value) is None,
        "Visible text contains no repeated whitespace.",
    )
    if stripped:
        minimum = int(rules["minimum_visible_characters"])
        maximum = int(rules["maximum_visible_characters"])
        check(
            f"{label}_length",
            minimum <= len(normalized) <= maximum,
            f"Normalized visible length is {len(normalized)}; permitted range is {minimum}–{maximum}.",
        )

    if is_prompt:
        check(
            "prompt_terminal_punctuation",
            any(stripped.endswith(punctuation) for punctuation in rules.get("accepted_terminal_punctuation", ["?"])),
            "Question prompt ends with a configured readable terminal punctuation mark.",
        )
        placeholders = [str(entry).lower() for entry in rules.get("forbid_unresolved_placeholders", [])]
        check(
            "prompt_no_unresolved_placeholder",
            all(token not in stripped.lower() for token in placeholders),
            "Question prompt contains no configured unresolved placeholder token.",
        )
        operators = [str(entry) for entry in rules.get("flag_ascii_comparison_operators", [])]
        found = [operator for operator in operators if operator in stripped]
        check(
            "prompt_no_ascii_comparison_operator",
            not found,
            "No configured ASCII comparison operator is visible." if not found else f"Found: {', '.join(found)}.",
        )
        # This deliberately counts only literal parentheses. It reports a form
        # hold, not a mathematical claim, when parentheses do not balance.
        check(
            "prompt_balanced_parentheses",
            stripped.count("(") == stripped.count(")"),
            "Literal opening and closing parentheses are balanced.",
        )
    return checks


def evaluate(row: dict[str, Any], rule_pack: dict[str, Any]) -> dict[str, Any]:
    prompt = text(row.get("question_text")) or text(row.get("question_latex"))
    explanation = text(row.get("explanation"))
    options = row.get("options")
    checks = apply_text_rules(
        label="prompt", value=prompt, rules=rule_pack["prompt"], is_prompt=True
    )
    checks.extend(
        apply_text_rules(
            label="explanation", value=explanation, rules=rule_pack["explanation"], is_prompt=False
        )
    )

    option_texts: list[str] = []
    if isinstance(options, list) and all(isinstance(option, dict) for option in options):
        option_texts = [text(option.get("text")) for option in options]
        for index, option_text in enumerate(option_texts, start=1):
            checks.extend(
                apply_text_rules(
                    label=f"option_{index}",
                    value=option_text,
                    rules=rule_pack["options"],
                    is_prompt=False,
                )
            )
        normalized_options = [normal(option).lower() for option in option_texts]
        checks.append({
            "rule": "options_unique_normalized_text",
            "result": "PASS" if len(normalized_options) == len(set(normalized_options)) else "FAIL",
            "detail": "Options have unique normalized visible text.",
        })
    else:
        checks.append({
            "rule": "options_readable_object_array",
            "result": "FAIL",
            "detail": "Options cannot be evaluated because the stored value is not an object array.",
        })

    failures = [check["rule"] for check in checks if check["result"] == "FAIL"]
    prompt_failures = [rule for rule in failures if rule.startswith("prompt_")]
    option_failures = [rule for rule in failures if rule.startswith("option_") or rule.startswith("options_")]
    explanation_failures = [rule for rule in failures if rule.startswith("explanation_")]
    return {
        "static_question_id": row.get("static_question_id"),
        "atomic_concept_id": row.get("atomic_concept_id"),
        "topic_code": row.get("topic_code"),
        "topic_name": row.get("topic_name"),
        "lesson_number": row.get("lesson_number"),
        "concept_name": row.get("concept_name"),
        "readability_status": "READABILITY_PASS" if not failures else "READABILITY_HOLD",
        "prompt_failure_count": len(prompt_failures),
        "option_failure_count": len(option_failures),
        "explanation_failure_count": len(explanation_failures),
        "failed_rules": failures,
        "checks": checks,
    }


def md(value: Any) -> str:
    return str(value or "").replace("|", "\\|").replace("\n", " ")


def main() -> None:
    if len(sys.argv) != 5:
        stop(__doc__.strip())
    input_path, rule_path, report_path, evidence_path = (Path(arg) for arg in sys.argv[1:])
    rows = load_json(input_path)
    rule_pack = load_json(rule_path)
    if not isinstance(rows, list) or not rows:
        stop("Input must be a non-empty JSON array of static-question records.")
    if not isinstance(rule_pack, dict):
        stop("Rule pack must be a JSON object.")
    for field in ("prompt", "options", "explanation"):
        if not isinstance(rule_pack.get(field), dict):
            stop(f"Rule pack lacks required {field!r} object.")

    ids = [row.get("static_question_id") for row in rows if isinstance(row, dict)]
    duplicates = sorted(str(key) for key, count in Counter(ids).items() if count > 1)
    if duplicates:
        stop(f"Duplicate static question IDs: {', '.join(duplicates)}")
    evaluations = [evaluate(row, rule_pack) for row in rows if isinstance(row, dict)]

    by_concept: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for evaluation in evaluations:
        by_concept[str(evaluation["atomic_concept_id"])].append(evaluation)
    concept_rows = []
    for group in by_concept.values():
        first = group[0]
        concept_rows.append({
            "topic_code": first["topic_code"],
            "topic_name": first["topic_name"],
            "lesson_number": first["lesson_number"],
            "concept_name": first["concept_name"],
            "candidate_count": len(group),
            "readability_pass_count": sum(item["readability_status"] == "READABILITY_PASS" for item in group),
            "readability_hold_count": sum(item["readability_status"] == "READABILITY_HOLD" for item in group),
            "failed_rule_counts": dict(Counter(
                rule for item in group for rule in item["failed_rules"]
            )),
        })
    concept_rows.sort(key=lambda item: (str(item["topic_code"]), str(item["lesson_number"])))

    summary = {
        "input_rows": len(evaluations),
        "readability_pass_items": sum(item["readability_status"] == "READABILITY_PASS" for item in evaluations),
        "readability_hold_items": sum(item["readability_status"] == "READABILITY_HOLD" for item in evaluations),
        "concepts_with_all_candidates_readable": sum(item["readability_hold_count"] == 0 for item in concept_rows),
        "concepts_with_readability_hold": sum(item["readability_hold_count"] > 0 for item in concept_rows),
        "failed_rule_counts": dict(Counter(rule for item in evaluations for rule in item["failed_rules"])),
    }
    evidence = {
        "evidence_type": "deterministic_g6_static_readability_check",
        "source_export": str(input_path.resolve()),
        "rule_pack": {
            "path": str(rule_path.resolve()),
            "id": rule_pack.get("rule_pack_id"),
            "sha256": fingerprint_file(rule_path),
        },
        "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "database_writes": False,
        "uses_ai": False,
        "automatic_content_edits": False,
        "summary": summary,
        "concepts": concept_rows,
        "items": evaluations,
    }

    report_lines = [
        "# Grade 6 Static Candidate — Deterministic Readability Evidence",
        "",
        "**Status:** Read-only readability-form evaluation. A pass proves only the explicit form rules in the listed rule pack; it is not a mathematical, curriculum, verification, activation, or release approval.",
        f"**Source export:** `{evidence['source_export']}`.",
        f"**Rule pack:** `{evidence['rule_pack']['id']}` (`SHA-256: {evidence['rule_pack']['sha256']}`).",
        f"**Generated:** {evidence['generated_at_utc']}.",
        "**Evaluator:** `scripts/check_g6_static_readability.py` (standard-library Python only; no AI and no text rewriting).",
        "",
        "## Summary",
        "",
        "| Result | Count |",
        "|---|---:|",
        f"| Input static candidates | {summary['input_rows']} |",
        f"| Readability passes | {summary['readability_pass_items']} |",
        f"| Readability holds | {summary['readability_hold_items']} |",
        f"| Concepts with every current candidate passing | {summary['concepts_with_all_candidates_readable']} |",
        f"| Concepts with at least one readability hold | {summary['concepts_with_readability_hold']} |",
        "",
        "## Failed Explicit Rules",
        "",
        "| Rule | Count | Meaning |",
        "|---|---:|---|",
    ]
    rule_descriptions = {
        "prompt_terminal_punctuation": "A student-facing prompt must finish with an approved visible terminal punctuation mark.",
        "prompt_leading_trailing_whitespace": "Prompt has unintended edge whitespace.",
        "prompt_repeated_whitespace": "Prompt contains repeated whitespace.",
        "prompt_no_ascii_comparison_operator": "Prompt uses `<=` or `>=`; source needs approved readable notation or documented exception.",
        "prompt_balanced_parentheses": "Literal parentheses do not balance.",
        "prompt_length": "Prompt is outside the configured visible-length range.",
        "explanation_leading_trailing_whitespace": "Explanation has unintended edge whitespace.",
        "explanation_repeated_whitespace": "Explanation contains repeated whitespace.",
        "explanation_length": "Explanation is outside the configured visible-length range.",
    }
    for rule, count in sorted(summary["failed_rule_counts"].items()):
        report_lines.append(f"| `{md(rule)}` | {count} | {md(rule_descriptions.get(rule, 'Configured readability form rule.'))} |")

    report_lines.extend([
        "",
        "## Concept Readability Register",
        "",
        "| Topic | Lesson | Concept | Candidates | Pass | Hold | Failed rules |",
        "|---|---|---|---:|---:|---:|---|",
    ])
    for concept in concept_rows:
        failure_summary = ", ".join(
            f"{rule} ({count})" for rule, count in sorted(concept["failed_rule_counts"].items())
        ) or "—"
        report_lines.append(
            f"| {md(concept['topic_code'])} | {md(concept['lesson_number'])} | {md(concept['concept_name'])} | {concept['candidate_count']} | {concept['readability_pass_count']} | {concept['readability_hold_count']} | {md(failure_summary)} |"
        )

    report_lines.extend([
        "",
        "## Item Hold Register",
        "",
        "| Item ID | Lesson | Readability status | Failed explicit rules |",
        "|---|---|---|---|",
    ])
    for item in evaluations:
        failures = ", ".join(item["failed_rules"]) or "—"
        report_lines.append(
            f"| `{md(item['static_question_id'])}` | {md(item['lesson_number'])} | {item['readability_status']} | {md(failures)} |"
        )

    report_lines.extend([
        "",
        "## Release Discipline",
        "",
        "This evaluator does not correct text automatically. A readability hold requires a source correction or a documented exception under an explicitly approved rule. Even a readability pass does not make a static item selectable: structural validation, mathematical/curriculum certification, exact-source capacity, and shared worksheet/Heat delivery validation still remain required.",
        "",
        "## Reproducibility",
        "",
        "```text",
        "python3 scripts/check_g6_static_readability.py \\",
        f"  {input_path.resolve()} \\",
        f"  {rule_path.resolve()} \\",
        "  docs/PILOT_CONTENT_AUDIT_EVIDENCE/g6-static-readability-report.md \\",
        "  docs/PILOT_CONTENT_AUDIT_EVIDENCE/g6-static-readability-evidence.json",
        "```",
        "",
    ])

    report_path.parent.mkdir(parents=True, exist_ok=True)
    evidence_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(report_lines), encoding="utf-8")
    evidence_path.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
