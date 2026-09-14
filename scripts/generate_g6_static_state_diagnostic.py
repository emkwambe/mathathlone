#!/usr/bin/env python3
"""Generate a read-only current-state diagnostic for Grade 6 static normalization.

The SQL produced by this script has no writes. It compares the exact reviewed
source export against its explicitly planned normalized form and reports only a
summary classification: original source, intended normalized source, or
unexpected drift. It also verifies non-text preservation fields.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

EXPECTED_ROWS = 33


def stop(message: str) -> None:
    raise SystemExit(message)


def sql_text(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_json(value: Any) -> str:
    return sql_text(json.dumps(value, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def normalize_explanation(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def normalized_prompt(value: str) -> str:
    result = value.strip()
    return result if result.endswith(("?", ":")) else result + "?"


def normalized_options(options: list[dict[str, Any]]) -> list[dict[str, Any]]:
    answer: list[dict[str, Any]] = []
    for option in options:
        replacement = dict(option)
        replacement["text"] = str(option["text"]).strip()
        answer.append(replacement)
    return answer


def values(rows: list[dict[str, Any]]) -> str:
    values_sql = []
    for row in rows:
        values_sql.append(
            "(" + ", ".join([
                f"{sql_text(str(row['static_question_id']))}::uuid",
                sql_text(str(row["lesson_number"])),
                sql_text(str(row["question_type"])),
                sql_text(str(row["question_text"])),
                sql_json(row["options"]),
                sql_text(str(row["correct_answer"])),
                sql_text(str(row["explanation"])),
                sql_text(normalized_prompt(str(row["question_text"]))),
                sql_json(normalized_options(row["options"])),
                sql_text(normalize_explanation(str(row["explanation"]))),
            ]) + ")"
        )
    return ",\n    ".join(values_sql)


def main() -> None:
    if len(sys.argv) != 3:
        stop("Usage: python3 scripts/generate_g6_static_state_diagnostic.py INPUT.json OUTPUT.sql")
    input_path, output_path = (Path(value) for value in sys.argv[1:])
    try:
        rows = json.loads(input_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        stop(f"Unable to read input JSON: {exc}")
    if not isinstance(rows, list) or len(rows) != EXPECTED_ROWS:
        stop(f"Expected exactly {EXPECTED_ROWS} input rows.")
    if len({row.get("static_question_id") for row in rows if isinstance(row, dict)}) != EXPECTED_ROWS:
        stop("Input must contain 33 unique static question IDs.")
    for row in rows:
        if not isinstance(row, dict):
            stop("Input must contain only objects.")
        if row.get("question_type") != "multiple_choice":
            stop(f"{row.get('static_question_id')}: expected multiple_choice.")
        if not isinstance(row.get("options"), list) or len(row["options"]) != 4:
            stop(f"{row.get('static_question_id')}: expected four options.")
        for option in row["options"]:
            if not isinstance(option, dict) or not isinstance(option.get("text"), str):
                stop(f"{row.get('static_question_id')}: expected option objects with text.")

    query = f"""-- Read-only state diagnostic for Grade 6 static normalization.
-- Generated from the exact reviewed 33-item source export.
-- It makes no database change. It classifies current rows as original,
-- planned-normalized, unchanged-by-design, or unexpected.
WITH expected (
  id, lesson_number, question_type, before_question_text, before_options,
  correct_answer, before_explanation, after_question_text, after_options,
  after_explanation
) AS (
  VALUES
    {values(rows)}
), classified AS (
  SELECT
    e.id,
    CASE
      WHEN sq.id IS NULL THEN 'UNEXPECTED: ID_NOT_FOUND'
      WHEN sq.concept_id <> e.lesson_number
        OR sq.question_type <> e.question_type
        OR sq.correct_answer IS DISTINCT FROM e.correct_answer
        OR sq.is_active IS DISTINCT FROM TRUE
        OR COALESCE(sq.is_verified, FALSE) IS DISTINCT FROM FALSE
        THEN 'UNEXPECTED: PRESERVATION_FIELD_CHANGED'
      WHEN e.before_question_text = e.after_question_text
        AND e.before_options = e.after_options
        AND e.before_explanation = e.after_explanation
        AND sq.question_text = e.before_question_text
        AND sq.options = e.before_options
        AND sq.explanation = e.before_explanation
        THEN 'UNCHANGED_BY_DESIGN'
      WHEN sq.question_text = e.after_question_text
        AND sq.options = e.after_options
        AND sq.explanation = e.after_explanation
        THEN 'INTENDED_NORMALIZATION_PRESENT'
      WHEN sq.question_text = e.before_question_text
        AND sq.options = e.before_options
        AND sq.explanation = e.before_explanation
        THEN 'ORIGINAL_REVIEWED_SOURCE_PRESENT'
      ELSE 'UNEXPECTED: TEXT_OR_OPTION_DRIFT'
    END AS current_state
  FROM expected AS e
  LEFT JOIN public.static_questions AS sq ON sq.id = e.id
)
SELECT
  current_state,
  COUNT(*) AS item_count,
  string_agg(id::text, ', ' ORDER BY id::text) AS static_question_ids
FROM classified
GROUP BY current_state
ORDER BY current_state;
"""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(query, encoding="utf-8")
    print(f"Generated read-only diagnostic for {EXPECTED_ROWS} reviewed items: {output_path}")


if __name__ == "__main__":
    main()
