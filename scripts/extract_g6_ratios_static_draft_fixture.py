#!/usr/bin/env python3
"""Extract the five named Grade 6 Ratios static candidates for draft-only tooling tests.

The output is a historical fixture, not a live certification export. It must never
be used to approve rules, verify static items, or bind a production review record.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

RATIOS_STATIC_IDS = {
    "1c68a49f-3f59-4caa-b2a3-93489e254060",
    "c25c4ff4-9035-4226-ba28-76ef19574b3d",
    "5814a4c0-0b23-4518-96fe-de63212aca39",
    "57124bd5-f00e-4c62-ac9f-971d292587d7",
    "5c4f052d-b32e-45b2-8f98-8e242bef3449",
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    items = json.loads(args.input.read_text(encoding="utf-8-sig"))
    if not isinstance(items, list):
        raise SystemExit("Expected a JSON array.")
    fixture = [item for item in items if isinstance(item, dict) and item.get("static_question_id") in RATIOS_STATIC_IDS]
    fixture.sort(key=lambda item: str(item["static_question_id"]))
    found = {item["static_question_id"] for item in fixture}
    if found != RATIOS_STATIC_IDS:
        raise SystemExit(f"Expected all five fixed Ratios IDs; found {len(found)}.")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(fixture, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"fixture_items": len(fixture), "status": "DRAFT_ONLY_NOT_LIVE_CERTIFICATION_INPUT"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
