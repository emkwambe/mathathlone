#!/usr/bin/env python3
"""Render a blinded retained-sample packet for qualified Grade 6 staged-source review.

It transforms the existing deterministic audit set into a human-review document
without correct answers, solution steps, or prior decisions. It never alters
student content or writes to the database.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    source = json.loads(args.input.read_text(encoding="utf-8-sig"))
    generators = source.get("generators") if isinstance(source, dict) else None
    if not isinstance(generators, list) or len(generators) != 7:
        raise SystemExit("Expected seven staged generators in the retained review set.")

    total = 0
    lines = [
        "# Grade 6 Staged Generator — Blinded Qualified Review Packet",
        "",
        "**Status:** Review-only. All seven generator mappings remain inactive and non-selectable.",
        "",
        "> Independently solve every visible prompt before accessing any stored answer or solution. Do not use AI to calculate answers, judge alignment, decide representation adequacy, or approve a source.",
        "",
        "**Qualified reviewer:** ____________________",
        "**Review date:** ____________________",
        "**Evidence reference:** ____________________",
        "",
        "A mathematical, scope, answer-format, readability, unit, context, or representation concern holds the affected generator inactive. For rows marked **representation review required**, choose `accept`, `require mapped diagram`, or `reject/revise` for the complete generator family.",
        "",
    ]
    for generator in generators:
        lesson = generator.get("lessonNumber")
        key = generator.get("generatorType")
        representation_required = bool(generator.get("representationReviewRequired"))
        lines.extend([
            f"## `{lesson}` — `{key}`",
            "",
            f"**Representation review required:** {'Yes' if representation_required else 'No'}",
            "",
            "**Generator-family representation decision:** ☐ Accept ☐ Require mapped diagram ☐ Reject/revise ☐ Not applicable",
            "**Generator-family notes:** ____________________",
            "",
        ])
        for difficulty in generator.get("difficulties", []):
            level = difficulty.get("difficulty")
            lines.extend([f"### Difficulty {level}", ""])
            for sample in difficulty.get("samples", []):
                total += 1
                lines.extend([
                    f"#### Sample {sample.get('sample')}",
                    "",
                    str(sample.get("questionText", "")).strip(),
                    "",
                    "| Required independent review record | Reviewer entry |",
                    "|---|---|",
                    "| Calculation or reasoning | ____________________ |",
                    "| Expected answer and required format | ____________________ |",
                    "| Exactly one defensible answer? | ☐ Yes ☐ No |",
                    "| Exact lesson alignment? | ☐ Yes ☐ No |",
                    "| Readability, units, context, accessibility, or representation concern | ____________________ |",
                    "| Severity | ☐ None ☐ Minor ☐ Major ☐ Critical |",
                    "| Decision | ☐ Pass ☐ Reject ☐ Needs discussion |",
                    "",
                ])
    lines.extend([
        "## Completion Gate",
        "",
        "Every retained sample must have an independent review result. A single rejection, needs-discussion decision, unaccepted required representation, or missing record keeps the affected staged generator inactive. This packet is not an activation decision and does not change the database.",
        "",
    ])
    if total != 84:
        raise SystemExit(f"Expected 84 retained samples, rendered {total}.")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"generators": len(generators), "samples_rendered": total, "status": "BLINDED_REVIEW_PACKET_CREATED"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
