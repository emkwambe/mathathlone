#!/usr/bin/env python3
"""Generate a guarded Grade 6 stored-text normalization proposal.

Input rows must be the user-exported Grade 6 active unverified static candidates.
The generator makes no database connection. It emits:
  * an item-ID-bound SQL migration with pre/postcondition guards;
  * a read-only SQL verification query; and
  * a JSON manifest containing before/after content fingerprints.

The only allowed normalizations are: edge-trim prompt/options/explanation,
collapse whitespace inside explanations, and add a question mark only when a
trimmed multiple-choice prompt has no clear terminal punctuation. It does not alter concepts, answers,
question types, item counts, active/verified states, or mathematical content.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

EXPECTED_ROWS = 33


def stop(message: str) -> None:
    raise SystemExit(message)


def load_rows(path: Path) -> list[dict[str, Any]]:
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        stop(f"Could not read valid JSON from {path}: {exc}")
    if not isinstance(rows, list) or len(rows) != EXPECTED_ROWS:
        stop(f"Expected exactly {EXPECTED_ROWS} input rows; received {len(rows) if isinstance(rows, list) else 'non-array'}.")
    if not all(isinstance(row, dict) for row in rows):
        stop("Every input row must be a JSON object.")
    return rows


def canonical_payload(row: dict[str, Any], *, normalized: bool) -> dict[str, Any]:
    return {
        "static_question_id": row["static_question_id"],
        "atomic_concept_id": row["atomic_concept_id"],
        "lesson_number": row["lesson_number"],
        "question_type": row["question_type"],
        "question_text": row["normalized_question_text"] if normalized else row["question_text"],
        "question_latex": row["question_latex"],
        "question_image_url": row["question_image_url"],
        "options": row["normalized_options"] if normalized else row["options"],
        "option_images": row["option_images"],
        "correct_answer": row["correct_answer"],
        "correct_answer_index": row["correct_answer_index"],
        "explanation": row["normalized_explanation"] if normalized else row["explanation"],
        "solution_steps": row["solution_steps"],
        "difficulty": row["difficulty"],
        "category": row["category"],
        "tags": row["tags"],
        "is_active": row["is_active"],
        "is_verified": row["is_verified"],
    }


def sha256(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def normalize_row(raw: dict[str, Any]) -> dict[str, Any]:
    required = (
        "static_question_id", "atomic_concept_id", "lesson_number", "topic_code", "question_type",
        "question_text", "options", "correct_answer", "explanation", "is_active", "is_verified",
    )
    for key in required:
        if key not in raw:
            stop(f"{raw.get('static_question_id', '<unknown>')}: missing required field {key!r}.")
    if raw["question_type"] != "multiple_choice":
        stop(f"{raw['static_question_id']}: expected multiple_choice, found {raw['question_type']!r}.")
    if raw["is_active"] is not True or raw["is_verified"] is not False:
        stop(f"{raw['static_question_id']}: item is not an active unverified candidate.")
    if not isinstance(raw["question_text"], str) or not raw["question_text"].strip():
        stop(f"{raw['static_question_id']}: question_text must be non-empty.")
    if not isinstance(raw["explanation"], str) or not raw["explanation"].strip():
        stop(f"{raw['static_question_id']}: explanation must be non-empty.")
    if not isinstance(raw["options"], list) or len(raw["options"]) != 4:
        stop(f"{raw['static_question_id']}: expected four options.")
    normalized_options: list[dict[str, Any]] = []
    for option in raw["options"]:
        if not isinstance(option, dict) or not isinstance(option.get("text"), str):
            stop(f"{raw['static_question_id']}: every option must be an object with text.")
        updated = dict(option)
        updated["text"] = option["text"].strip()
        normalized_options.append(updated)

    normalized_prompt = raw["question_text"].strip()
    if not normalized_prompt.endswith(("?", ":")):
        normalized_prompt += "?"

    row = dict(raw)
    row["normalized_question_text"] = normalized_prompt
    row["normalized_options"] = normalized_options
    row["normalized_explanation"] = normalize_whitespace(raw["explanation"])
    return row


def sql_text(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_json(value: Any) -> str:
    return sql_text(json.dumps(value, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def sql_nullable_text(value: Any) -> str:
    return "NULL" if value is None else sql_text(str(value))


def expected_values(rows: list[dict[str, Any]], include_new: bool = True) -> str:
    values: list[str] = []
    for row in rows:
        fields = [
            f"{sql_text(row['static_question_id'])}::uuid",
            sql_text(row["lesson_number"]),
            sql_text(row["question_type"]),
            sql_text(row["question_text"]),
            sql_json(row["options"]),
            sql_text(row["correct_answer"]),
            sql_text(row["explanation"]),
        ]
        if include_new:
            fields.extend([
                sql_text(row["normalized_question_text"]),
                sql_json(row["normalized_options"]),
                sql_text(row["normalized_explanation"]),
            ])
        values.append("(" + ", ".join(fields) + ")")
    return ",\n    ".join(values)


def migration_sql(rows: list[dict[str, Any]]) -> str:
    source_rows = [
        {
            "id": row["static_question_id"],
            "lesson_number": row["lesson_number"],
            "question_type": row["question_type"],
            "before_question_text": row["question_text"],
            "before_options": row["options"],
            "correct_answer": row["correct_answer"],
            "before_explanation": row["explanation"],
            "after_question_text": row["normalized_question_text"],
            "after_options": row["normalized_options"],
            "after_explanation": row["normalized_explanation"],
        }
        for row in rows
    ]
    payload = json.dumps(source_rows, ensure_ascii=False, separators=(",", ":"))
    return f"""-- 055_normalize_g6_static_readability.sql
--
-- Guarded Grade 6 static source normalization.
-- Generated deterministically from the live read-only 33-item export.
--
-- SQL Editor compatibility: all reviewed rows are carried inside one server-side
-- DO block. No temporary table is used, so no SQL Editor statement boundary can
-- discard the reviewed source set before its precondition checks run.
--
-- Allowed changes, and only to the exact IDs below:
--   1) trim edge whitespace from question_text and option text;
--   2) collapse repeated whitespace in explanation;
--   3) append a terminal question mark only when a trimmed prompt has no clear terminal punctuation.
--
-- No change is permitted to: concept mapping, question type, correct answer,
-- answer index, difficulty, images, solution steps, active/verified state, or
-- any item outside this exact 33-item set.
--
-- Do NOT run until the matching source manifest and read-only preflight have
-- been inspected. The block fails before update if live source text drifts.

DO $g6_static_normalization$
DECLARE
  expected_count integer := {len(rows)};
  source_rows jsonb := $g6_static_source${payload}$g6_static_source$::jsonb;
  supplied_count integer;
  distinct_id_count integer;
  matching_count integer;
  updated_count integer;
  postcondition_count integer;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT e.id)
  INTO supplied_count, distinct_id_count
  FROM jsonb_to_recordset(source_rows) AS e(
    id uuid,
    lesson_number text,
    question_type text,
    before_question_text text,
    before_options jsonb,
    correct_answer text,
    before_explanation text,
    after_question_text text,
    after_options jsonb,
    after_explanation text
  );

  IF supplied_count <> expected_count OR distinct_id_count <> expected_count THEN
    RAISE EXCEPTION 'The embedded reviewed source set is invalid: expected % unique rows, found % rows and % unique IDs. No normalization applied.', expected_count, supplied_count, distinct_id_count;
  END IF;

  SELECT COUNT(*) INTO matching_count
  FROM public.static_questions AS sq
  JOIN jsonb_to_recordset(source_rows) AS e(
    id uuid,
    lesson_number text,
    question_type text,
    before_question_text text,
    before_options jsonb,
    correct_answer text,
    before_explanation text,
    after_question_text text,
    after_options jsonb,
    after_explanation text
  ) ON e.id = sq.id
  JOIN public.atomic_concepts AS ac ON ac.lesson_number = sq.concept_id
  JOIN public.unit_topics AS ut ON ut.id = ac.unit_topic_id
  JOIN public.courses AS c ON c.id = ut.course_id
  WHERE c.code = 'G6'
    AND sq.concept_id = e.lesson_number
    AND sq.question_type = e.question_type
    AND sq.question_text IS NOT DISTINCT FROM e.before_question_text
    AND sq.options IS NOT DISTINCT FROM e.before_options
    AND sq.correct_answer IS NOT DISTINCT FROM e.correct_answer
    AND sq.explanation IS NOT DISTINCT FROM e.before_explanation
    AND sq.is_active = TRUE
    AND COALESCE(sq.is_verified, FALSE) = FALSE;

  IF matching_count <> expected_count THEN
    RAISE EXCEPTION 'Live Grade 6 static source differs from the reviewed manifest: expected % exact candidate rows, found %. No normalization applied.', expected_count, matching_count;
  END IF;

  UPDATE public.static_questions AS sq
  SET
    question_text = e.after_question_text,
    options = e.after_options,
    explanation = e.after_explanation
  FROM jsonb_to_recordset(source_rows) AS e(
    id uuid,
    lesson_number text,
    question_type text,
    before_question_text text,
    before_options jsonb,
    correct_answer text,
    before_explanation text,
    after_question_text text,
    after_options jsonb,
    after_explanation text
  )
  WHERE sq.id = e.id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> expected_count THEN
    RAISE EXCEPTION 'Expected to normalize % rows but updated %. Transaction rolled back.', expected_count, updated_count;
  END IF;

  SELECT COUNT(*) INTO postcondition_count
  FROM public.static_questions AS sq
  JOIN jsonb_to_recordset(source_rows) AS e(
    id uuid,
    lesson_number text,
    question_type text,
    before_question_text text,
    before_options jsonb,
    correct_answer text,
    before_explanation text,
    after_question_text text,
    after_options jsonb,
    after_explanation text
  ) ON e.id = sq.id
  WHERE sq.concept_id = e.lesson_number
    AND sq.question_type = e.question_type
    AND sq.question_text IS NOT DISTINCT FROM e.after_question_text
    AND sq.options IS NOT DISTINCT FROM e.after_options
    AND sq.correct_answer IS NOT DISTINCT FROM e.correct_answer
    AND sq.explanation IS NOT DISTINCT FROM e.after_explanation
    AND sq.is_active = TRUE
    AND COALESCE(sq.is_verified, FALSE) = FALSE;

  IF postcondition_count <> expected_count THEN
    RAISE EXCEPTION 'Postcondition failed: expected % normalized rows with unchanged answer/activity/verification state, found %. Transaction rolled back.', expected_count, postcondition_count;
  END IF;
END $g6_static_normalization$;
"""


def preflight_sql(rows: list[dict[str, Any]]) -> str:
    values = expected_values(rows)
    return f"""-- Read-only preflight for 055_normalize_g6_static_readability.sql
-- Run this before the guarded write migration. It makes no changes.
WITH expected (
  id, lesson_number, question_type, before_question_text, before_options,
  correct_answer, before_explanation, after_question_text, after_options,
  after_explanation
) AS (
  VALUES
    {values}
), checks AS (
  SELECT
    e.id,
    sq.id IS NOT NULL AS id_exists,
    sq.concept_id = e.lesson_number AS lesson_matches,
    sq.question_type = e.question_type AS question_type_matches,
    sq.question_text IS NOT DISTINCT FROM e.before_question_text AS prompt_matches_reviewed_source,
    sq.options IS NOT DISTINCT FROM e.before_options AS options_match_reviewed_source,
    sq.correct_answer IS NOT DISTINCT FROM e.correct_answer AS answer_matches_reviewed_source,
    sq.explanation IS NOT DISTINCT FROM e.before_explanation AS explanation_matches_reviewed_source,
    sq.is_active = TRUE AS remains_active,
    COALESCE(sq.is_verified, FALSE) = FALSE AS remains_unverified
  FROM expected AS e
  LEFT JOIN public.static_questions AS sq ON sq.id = e.id
)
SELECT
  COUNT(*) AS expected_items,
  COUNT(*) FILTER (WHERE id_exists) AS ids_found,
  COUNT(*) FILTER (
    WHERE id_exists
      AND lesson_matches
      AND question_type_matches
      AND prompt_matches_reviewed_source
      AND options_match_reviewed_source
      AND answer_matches_reviewed_source
      AND explanation_matches_reviewed_source
      AND remains_active
      AND remains_unverified
  ) AS exact_precondition_matches,
  COUNT(*) FILTER (
    WHERE NOT (
      id_exists
      AND lesson_matches
      AND question_type_matches
      AND prompt_matches_reviewed_source
      AND options_match_reviewed_source
      AND answer_matches_reviewed_source
      AND explanation_matches_reviewed_source
      AND remains_active
      AND remains_unverified
    )
  ) AS mismatched_items,
  CASE WHEN COUNT(*) = {len(rows)}
      AND COUNT(*) FILTER (
        WHERE id_exists
          AND lesson_matches
          AND question_type_matches
          AND prompt_matches_reviewed_source
          AND options_match_reviewed_source
          AND answer_matches_reviewed_source
          AND explanation_matches_reviewed_source
          AND remains_active
          AND remains_unverified
      ) = {len(rows)}
    THEN 'SAFE_TO_REVIEW_WRITE_MIGRATION'
    ELSE 'STOP_SOURCE_DRIFT_OR_STATUS_CHANGE'
  END AS preflight_decision
FROM checks;
"""


def verification_sql(rows: list[dict[str, Any]]) -> str:
    values = expected_values(rows)
    return f"""-- Read-only verification for 055_normalize_g6_static_readability.sql
-- Run only after the guarded write migration reports success.
WITH expected (
  id, lesson_number, question_type, before_question_text, before_options,
  correct_answer, before_explanation, after_question_text, after_options,
  after_explanation
) AS (
  VALUES
    {values}
)
SELECT
  sq.id AS static_question_id,
  sq.concept_id AS lesson_number,
  sq.question_text = e.after_question_text AS prompt_matches_expected_normalization,
  sq.options = e.after_options AS options_match_expected_normalization,
  sq.explanation = e.after_explanation AS explanation_matches_expected_normalization,
  sq.correct_answer = e.correct_answer AS correct_answer_unchanged,
  sq.question_type = e.question_type AS question_type_unchanged,
  sq.is_active = TRUE AS remains_active,
  COALESCE(sq.is_verified, FALSE) = FALSE AS remains_unverified,
  md5(
    jsonb_build_object(
      'static_question_id', sq.id,
      'lesson_number', sq.concept_id,
      'question_type', sq.question_type,
      'question_text', sq.question_text,
      'options', sq.options,
      'correct_answer', sq.correct_answer,
      'explanation', sq.explanation,
      'difficulty', sq.difficulty,
      'is_active', sq.is_active,
      'is_verified', sq.is_verified
    )::text
  ) AS live_postchange_md5
FROM public.static_questions AS sq
JOIN expected AS e ON e.id = sq.id
ORDER BY sq.concept_id, sq.id;
"""


def main() -> None:
    if len(sys.argv) != 7:
        stop(
            "Usage: python3 scripts/generate_g6_static_normalization_proposal.py "
            "INPUT.json MIGRATION.sql PREFLIGHT.sql VERIFY.sql MANIFEST.json NORMALIZED_EXPORT.json"
        )
    input_path, migration_path, preflight_path, verification_path, manifest_path, normalized_export_path = (
        Path(argument) for argument in sys.argv[1:]
    )
    raw_rows = load_rows(input_path)
    ids = [row.get("static_question_id") for row in raw_rows]
    if len(ids) != len(set(ids)):
        stop("Input has duplicate static_question_id values.")

    rows = [normalize_row(row) for row in raw_rows]
    rows.sort(key=lambda row: (row["topic_code"], row["lesson_number"], row["static_question_id"]))
    affected = [
        row for row in rows
        if (
            row["question_text"] != row["normalized_question_text"]
            or row["options"] != row["normalized_options"]
            or row["explanation"] != row["normalized_explanation"]
        )
    ]
    if not affected:
        stop("No item requires a deterministic normalization; no migration proposal was generated.")

    manifest_rows = []
    for row in rows:
        manifest_rows.append({
            "static_question_id": row["static_question_id"],
            "atomic_concept_id": row["atomic_concept_id"],
            "topic_code": row["topic_code"],
            "lesson_number": row["lesson_number"],
            "concept_name": row.get("concept_name"),
            "before_sha256": sha256(canonical_payload(row, normalized=False)),
            "after_sha256": sha256(canonical_payload(row, normalized=True)),
            "changes": {
                "question_text": row["question_text"] != row["normalized_question_text"],
                "options": row["options"] != row["normalized_options"],
                "explanation": row["explanation"] != row["normalized_explanation"],
            },
        })
    manifest = {
        "manifest_type": "g6_static_readability_normalization_v1",
        "status": "proposal only; database write is not performed by this generator",
        "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "source_export": str(input_path.resolve()),
        "item_count": len(rows),
        "allowed_transformations": [
            "trim question_text edge whitespace",
            "append terminal question mark only when trimmed question_text lacks clear terminal punctuation",
            "trim option text edge whitespace",
            "collapse repeated explanation whitespace to one space",
        ],
        "explicitly_unchanged_fields": [
            "atomic_concept_id", "lesson_number", "concept_name", "question_type", "correct_answer",
            "correct_answer_index", "difficulty", "question_latex", "question_image_url", "option_images",
            "solution_steps", "category", "tags", "is_active", "is_verified",
        ],
        "items": manifest_rows,
    }

    for output in (migration_path, preflight_path, verification_path, manifest_path, normalized_export_path):
        output.parent.mkdir(parents=True, exist_ok=True)
    migration_path.write_text(migration_sql(rows), encoding="utf-8")
    preflight_path.write_text(preflight_sql(rows), encoding="utf-8")
    verification_path.write_text(verification_sql(rows), encoding="utf-8")
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    normalized_rows = []
    for row in rows:
        output = dict(row)
        output["question_text"] = row.pop("normalized_question_text")
        output["options"] = row.pop("normalized_options")
        output["explanation"] = row.pop("normalized_explanation")
        normalized_rows.append(output)
    normalized_export_path.write_text(json.dumps(normalized_rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"item_count": len(rows), "affected_items": len(affected)}, indent=2))


if __name__ == "__main__":
    main()
