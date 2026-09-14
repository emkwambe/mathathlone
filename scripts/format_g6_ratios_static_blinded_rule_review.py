#!/usr/bin/env python3
"""Format a blinded Grade 6 Ratios static-review form from a fixed source export.

The form intentionally excludes correct_answer, explanation, solution_steps, and
any approval decision. It is a presentation transform only; it never rewrites
question content or writes to a database.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--items", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    items = json.loads(args.items.read_text(encoding="utf-8-sig"))
    if not isinstance(items, list):
        raise SystemExit("The source fixture must be a JSON array.")
    sorted_items = sorted(
        (item for item in items if isinstance(item, dict)),
        key=lambda item: (str(item.get("lesson_number", "")), str(item.get("static_question_id", ""))),
    )
    if len(sorted_items) != 5:
        raise SystemExit("Expected exactly five Grade 6 Ratios static items.")

    lines = [
        "# Grade 6 Ratios — Blinded Mathematical Rule Review Form",
        "",
        "**Status:** Qualified-review worksheet only. It deliberately omits stored answers, explanations, solution steps, and approval decisions.",
        "",
        "> Independently solve each prompt before consulting any stored answer or explanation. Do not use AI to supply the expected option, mathematical statement, or approval decision.",
        "",
        "**Reviewer:** ____________________",
        "**Review date:** ____________________",
        "**Evidence reference:** ____________________",
        "",
    ]
    for number, item in enumerate(sorted_items, start=1):
        lines.extend([
            f"## Item {number}",
            "",
            f"**Static item ID:** `{item.get('static_question_id')}`",
            f"**Atomic concept:** `{item.get('lesson_number')}` — {item.get('concept_name')}",
            f"**Difficulty:** {item.get('difficulty')}",
            "",
            "### Student-Facing Prompt",
            "",
            str(item.get("question_text", "")).strip(),
            "",
            "### Options",
            "",
            "| Key | Option text |",
            "|---|---|",
        ])
        for option in item.get("options", []):
            if isinstance(option, dict):
                lines.append(f"| {option.get('key', '')} | {str(option.get('text', '')).strip()} |")
        lines.extend([
            "",
            "### Reviewer Record",
            "",
            "| Required independent determination | Reviewer entry |",
            "|---|---|",
            "| Expected correct option (`A`–`D`) | ____________________ |",
            "| Formal mathematical statement supporting that option | ____________________ |",
            "| Exactly one displayed option is correct | ☐ Yes ☐ No |",
            "| Exact lesson alignment | ☐ Yes ☐ No |",
            "| Readability, language, accessibility, or presentation concern | ____________________ |",
            "| Finding severity | ☐ None ☐ Minor ☐ Major ☐ Critical |",
            "| Suggested rule status | ☐ Approve ☐ Revise ☐ Retire ☐ Hold |",
            "",
        ])

    lines.extend([
        "## Handoff",
        "",
        "A qualified reviewer supplies the independent entries above. An authorized curriculum approver may then transfer the approved fields into the versioned rule-pack template, bind them to a fresh live source fingerprint, and run the deterministic evaluator. This form itself is not an approval, review-ledger record, or verification action.",
        "",
    ])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"items_formatted": len(sorted_items), "status": "BLINDED_REVIEW_FORM_CREATED"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
