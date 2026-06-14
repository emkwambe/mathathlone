/**
 * One-time fix: re-link question_generators.concept_id to the correct
 * atomic_concepts UUID.
 *
 * The generator JSON files are the source of truth: each generator carries a
 * text concept_id (a lesson_number like "M7.NS.1.2"). When the generators were
 * seeded, the text→UUID resolution was done incorrectly, leaving concept_id
 * pointing at the wrong atomic_concepts row. This script rebuilds the mapping
 * from the JSON files and corrects only the concept_id column.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/relink-generator-concepts.ts
 *
 * Uses the SERVICE ROLE key so RLS does not block the updates. Only
 * question_generators.concept_id is touched — no other column, no other table,
 * no migration. If the key lacks write access the run aborts (non-zero) rather
 * than reporting false success (see the RLS guard at the end).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// All 6 generator pools. Paths via join() so the spaces/slashes work on Windows.
const GENERATOR_FILES = [
  ['grade6', 'NC_Grade_6_generators.json'],
  ['grade7', 'NC_Grade_7_generators.json'],
  ['grade8', 'NC_Grade_8_generators.json'],
  ['algebra1', 'Alg1_generators.json'],
  ['math-fundamentals', 'MF_generators.json'],
  ['nc-math3', 'NCM3_generators.json'],
].map(([dir, file]) => join(process.cwd(), 'docs', 'curriculum', dir, file));

interface GeneratorEntry {
  id?: string;
  generator_type?: string;
  concept_id?: string; // lesson_number text in the JSON
}

/**
 * Tolerant JSON reader for the generator files. Handles, in the in-memory
 * string only (the files on disk are never modified):
 *   - a UTF-8 BOM
 *   - full-line `// ...` comments (Alg1 / MF / NCM3 use these as section banners)
 *   - bare ± tokens that appear in numeric pools (e.g. "[±1, ±2, ±3]") — these
 *     live only in fields this script never reads, but they must be neutralized
 *     for JSON.parse to succeed
 *   - trailing commas (defensive)
 */
function parseGeneratorFile(path: string): GeneratorEntry[] {
  let s = readFileSync(path, 'utf8').replace(/^﻿/, '');
  s = s
    .split(/\r?\n/)
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');
  s = s.replace(/±\s*/g, '');
  s = s.replace(/,(\s*[}\]])/g, '$1');
  const parsed = JSON.parse(s);
  const gens = parsed?.generators;
  if (!Array.isArray(gens)) {
    throw new Error(`No "generators" array in ${path}`);
  }
  return gens as GeneratorEntry[];
}

/** Read every page of a table (PostgREST caps each response at 1000 rows). */
async function fetchAll<T>(
  supabase: ReturnType<typeof createClient>,
  table: string,
  columns: string
): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (error) throw new Error(`Read ${table}: ${error.message}`);
    const rows = data ?? [];
    out.push(...(rows as T[]));
    if (rows.length < PAGE) break;
  }
  return out;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      'Missing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Run with: npx tsx --env-file=.env.local scripts/relink-generator-concepts.ts'
    );
    process.exit(1);
  }

  // 1 & 2: build a map from BOTH the generator `id` and `generator_type` to the
  // JSON lesson_number, so a DB row matches whichever form it stored.
  const lessonByGenKey = new Map<string, string>();
  for (const file of GENERATOR_FILES) {
    for (const g of parseGeneratorFile(file)) {
      const lesson = g.concept_id?.trim();
      if (!lesson) continue;
      if (g.id?.trim()) lessonByGenKey.set(g.id.trim(), lesson);
      if (g.generator_type?.trim()) lessonByGenKey.set(g.generator_type.trim(), lesson);
    }
  }
  console.log(`Loaded ${lessonByGenKey.size} generator keys → lesson_number from JSON files.`);

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 3: lesson_number → atomic_concepts UUID.
  const concepts = await fetchAll<{ id: string; lesson_number: string }>(
    supabase,
    'atomic_concepts',
    'id, lesson_number'
  );
  const uuidByLesson = new Map<string, string>();
  for (const c of concepts) uuidByLesson.set(c.lesson_number, c.id);
  console.log(`Loaded ${uuidByLesson.size} atomic_concepts lesson_number → UUID.`);

  // 4: all question_generators rows.
  const generators = await fetchAll<{ id: string; generator_type: string; concept_id: string | null }>(
    supabase,
    'question_generators',
    'id, generator_type, concept_id'
  );
  console.log(`Processing ${generators.length} question_generators rows.\n`);

  // 5 & 6: resolve and update.
  let relinked = 0;
  let alreadyCorrect = 0;
  const notFound: string[] = [];
  const conceptMissing: string[] = [];
  const blocked: string[] = [];

  for (const qg of generators) {
    const lesson = lessonByGenKey.get(qg.generator_type);
    if (!lesson) {
      notFound.push(qg.generator_type);
      continue;
    }
    const correctUuid = uuidByLesson.get(lesson);
    if (!correctUuid) {
      conceptMissing.push(`${qg.generator_type} (${lesson})`);
      continue;
    }
    if (qg.concept_id === correctUuid) {
      alreadyCorrect++;
      continue;
    }
    // .select() confirms the UPDATE actually changed a row; under RLS with an
    // under-privileged key PostgREST returns success with zero rows affected.
    const { data: changed, error } = await supabase
      .from('question_generators')
      .update({ concept_id: correctUuid })
      .eq('id', qg.id)
      .select('id');
    if (error) {
      console.error(`  FAILED ${qg.generator_type}: ${error.message}`);
      continue;
    }
    if (!changed || changed.length === 0) {
      blocked.push(qg.generator_type);
      continue;
    }
    relinked++;
    console.log(`Relinked ${qg.generator_type}: ${lesson} (was ${qg.concept_id} → ${correctUuid})`);
  }

  // 7: summary.
  console.log(
    `\nRelinked ${relinked} generators. ${notFound.length} generators not found in JSON files. ` +
      `${alreadyCorrect} already correct.`
  );
  if (conceptMissing.length > 0) {
    console.log(`${conceptMissing.length} generators whose lesson_number is missing from atomic_concepts.`);
  }

  // 8: list anything that couldn't be resolved.
  if (notFound.length > 0) {
    console.log('\nGenerator types not found in any JSON file (skipped):');
    for (const gt of notFound) console.log(`  - ${gt}`);
  }
  if (conceptMissing.length > 0) {
    console.log('\nGenerators whose JSON lesson_number is missing from atomic_concepts (skipped):');
    for (const cm of conceptMissing) console.log(`  - ${cm}`);
  }

  // RLS guard: silently-dropped writes mean the key lacks write access.
  if (blocked.length > 0) {
    console.error(
      `\n⚠️  ${blocked.length} updates returned 0 rows changed — writes are being blocked by RLS.\n` +
        `   SUPABASE_SERVICE_ROLE_KEY does not have write access (is it really the service_role key?).\n` +
        `   NO DATA WAS CHANGED for these rows.`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
