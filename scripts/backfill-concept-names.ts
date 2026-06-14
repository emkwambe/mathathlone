/**
 * One-time backfill: restore the correct `name` on atomic_concepts rows whose
 * `name` was seeded with the lesson_number value instead of the concept name.
 *
 * Affected courses: Algebra 1, NC Math 2, AP Precalculus, NC 8th Grade Math,
 * NC 6th Grade Math, Math Fundamentals, and NC Math 3. The correct names come
 * from the original curriculum JSON files.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/backfill-concept-names.ts
 *
 * Uses the SERVICE ROLE key so RLS does not block the updates. This script
 * only updates rows where name === lesson_number; it touches no other rows or
 * tables, and writes no migration. If the key lacks write access, the run
 * aborts (non-zero) rather than reporting false success — see the RLS guard.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// The 7 curriculum files come in THREE different shapes, so the reader below
// normalizes all of them to { lesson, concept } pairs:
//   A. Flat array of { "Lesson Number", "Atomic Concept" }
//        → Algebra 1, NC Math 2, Math Fundamentals, NC Math 3
//   B. { units: [ { concepts: [ { lessonNumber, atomicConcept } ] } ] }
//        → NC 8th Grade Math, NC 6th Grade Math
//   C. { units: [ { lessons: [ { id, concept } ] } ] }  (id == lesson number)
//        → AP Precalculus
const CURRICULUM_DIR = join(process.cwd(), 'docs', 'curriculum', 'original curricula');
const CURRICULUM_FILES = [
  'Algebra 1.json',
  'NC Math 2.json',
  'AP Precalculus.json',
  'NC 8th Grade Math.json',
  'NC 6th Grade Math.json',
  'Math Fundamentals.json',
  'NC Math 3.json',
].map((f) => join(CURRICULUM_DIR, f));

type Pair = { lesson: string; concept: string };

/**
 * Read one curriculum JSON (UTF-8, BOM-stripped) and return its
 * lesson→concept pairs, transparently handling all three schemas (A/B/C).
 */
function readConceptPairs(path: string): Pair[] {
  const raw = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const parsed: unknown = JSON.parse(raw);
  const pairs: Pair[] = [];
  const push = (lesson: unknown, concept: unknown) => {
    const l = typeof lesson === 'string' ? lesson.trim() : '';
    const c = typeof concept === 'string' ? concept.trim() : '';
    if (l && c) pairs.push({ lesson: l, concept: c });
  };

  // Schema A: flat array of Title-Case entries.
  if (Array.isArray(parsed)) {
    for (const e of parsed as Record<string, unknown>[]) {
      push(e['Lesson Number'], e['Atomic Concept']);
    }
    return pairs;
  }

  // Schemas B & C: object with a `units` array.
  const units = (parsed as { units?: unknown })?.units;
  if (Array.isArray(units)) {
    for (const u of units as Record<string, unknown>[]) {
      // B: units[].concepts[] { lessonNumber, atomicConcept }
      if (Array.isArray(u.concepts)) {
        for (const c of u.concepts as Record<string, unknown>[]) {
          push(c.lessonNumber, c.atomicConcept);
        }
      }
      // C: units[].lessons[] { id, concept }
      if (Array.isArray(u.lessons)) {
        for (const l of u.lessons as Record<string, unknown>[]) {
          push(l.id, l.concept);
        }
      }
    }
    return pairs;
  }

  throw new Error(`Unrecognized curriculum JSON structure in ${path}`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      'Missing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Run with: npx tsx --env-file=.env.local scripts/backfill-concept-names.ts'
    );
    process.exit(1);
  }

  // 1 & 2: build lessonNumber → atomicConcept map from all files combined.
  const nameByLesson = new Map<string, string>();
  for (const file of CURRICULUM_FILES) {
    for (const { lesson, concept } of readConceptPairs(file)) {
      nameByLesson.set(lesson, concept);
    }
  }
  console.log(`Loaded ${nameByLesson.size} lesson → concept names from curriculum JSONs.\n`);

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  // 3: find rows where name was seeded with the lesson_number. PostgREST can't
  // compare two columns, so fetch all rows (paginated) and filter client-side.
  const PAGE = 1000;
  const broken: { id: string; lesson_number: string; name: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('atomic_concepts')
      .select('id, lesson_number, name')
      .range(from, from + PAGE - 1);
    if (error) {
      console.error('DB read error:', error.message);
      process.exit(1);
    }
    const rows = data ?? [];
    for (const r of rows as { id: string; lesson_number: string; name: string }[]) {
      if (r.name === r.lesson_number) broken.push(r);
    }
    if (rows.length < PAGE) break;
  }
  console.log(`Found ${broken.length} rows where name = lesson_number.\n`);

  // 4 & 5: update each from the map.
  let updated = 0;
  const notFound: string[] = [];
  const blocked: string[] = [];
  for (const row of broken) {
    const correctName = nameByLesson.get(row.lesson_number);
    if (!correctName) {
      notFound.push(row.lesson_number);
      continue;
    }
    // .select() so we can confirm the UPDATE actually changed a row. With RLS
    // and an under-privileged key, PostgREST returns success with zero rows
    // affected rather than an error — that must NOT count as an update.
    const { data: changed, error } = await supabase
      .from('atomic_concepts')
      .update({ name: correctName })
      .eq('id', row.id)
      .select('id');
    if (error) {
      console.error(`  FAILED ${row.lesson_number}: ${error.message}`);
      continue;
    }
    if (!changed || changed.length === 0) {
      blocked.push(row.lesson_number);
      continue;
    }
    updated++;
    console.log(`Updated ${row.lesson_number} → ${correctName}`);
  }

  // 7: summary.
  console.log(
    `\nUpdated ${updated} rows. ${notFound.length} lesson_numbers not found in curriculum JSONs.`
  );

  // If updates were silently dropped, the key lacks write access (RLS) — most
  // likely SUPABASE_SERVICE_ROLE_KEY is not actually the service_role key.
  if (blocked.length > 0) {
    console.error(
      `\n⚠️  ${blocked.length} updates returned 0 rows changed — writes are being blocked by RLS.\n` +
        `   SUPABASE_SERVICE_ROLE_KEY does not have write access (is it really the service_role key?).\n` +
        `   NO DATA WAS CHANGED for these rows.`
    );
    process.exit(1);
  }

  // 8: list any lesson_numbers we couldn't resolve.
  if (notFound.length > 0) {
    console.log('\nLesson numbers not found in curriculum JSONs (investigate):');
    for (const ln of notFound) console.log(`  - ${ln}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
