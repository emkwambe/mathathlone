# Live Query Results
Generated: 2026-05-31

### A1 — heats columns
24 columns confirmed. Missing: division_id, is_global, division_code, auto_scheduled, unit_topic_id.
topic_id is NOT NULL (FK to legacy topics table).
focus_violations on heat_participations is INTEGER not JSONB.

### A2 — heat_participations columns
33 columns confirmed. Key names: questions_attempted (not questions_answered), finished_at (not completed_at), total_time_ms (not avg_time_ms), accuracy_score (not accuracy), ranking_points_earned (not total_points). Has: cta_score, percentile, rank_in_heat, medal (medal_type enum). Missing: display_name, division_id, current_question.

### B — Curriculum counts
courses: 1
unit_topics: 0
atomic_concepts: 0
question_generators: 0
static_questions: 42

### Naming convention
User-facing: "Mathlete" (not athlete). DB role stays 'athlete'.