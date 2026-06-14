/**
 * One-time backfill: populate question_generators.cognitive_demand,
 * .complexity, and .context (added in migration 032, currently NULL on all
 * 213 rows) from the `three_axis` data in the 6 curriculum generator JSON
 * files.
 *
 * Why it matters: the heat delivery pipeline (src/lib/competition/
 * question-delivery.ts) filters generators per profile via PROFILE_AXIS_FILTER
 * (warmup → procedural/low/abstract, deep → reasoning/high/real_world, …).
 * Rows with any NULL axis are treated as profile-agnostic and fall through to
 * the depth-range fallback, so Warm-Up and Deep heats draw from the same pool.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/backfill-three-axis.ts
 *
 * Uses the SERVICE ROLE key so RLS does not block writes. Only the three axis
 * columns are touched — no other column, no other table, no migration. If the
 * key lacks write access the run aborts (non-zero) rather than reporting false
 * success (see the RLS guard at the end).
 *
 * MATCHING NOTE: the spec says to map by the JSON `id` and `generator_type`.
 * In practice the DB `generator_type` for the grade pools is a THIRD form —
 * `<pool>_<generator_type>` (e.g. DB "g7_add_rational" vs JSON id
 * "g7_ns_add_rational" / type "add_rational"). Exact id/type matching alone
 * resolves only ~36/213 rows and would NOT populate the verification example
 * (g7_add_rational). So each generator is also keyed by
 * `<idPrefix>_<generator_type>`, derived from its own id — which is what makes
 * g7_add_rational resolve to procedural/low/abstract. Legacy NC Math 1 rows
 * have no JSON source and correctly stay NULL (depth-range fallback).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const GENERATOR_FILES = [
  ['grade6', 'NC_Grade_6_generators.json'],
  ['grade7', 'NC_Grade_7_generators.json'],
  ['grade8', 'NC_Grade_8_generators.json'],
  ['algebra1', 'Alg1_generators.json'],
  ['math-fundamentals', 'MF_generators.json'],
  ['nc-math3', 'NCM3_generators.json'],
].map(([dir, file]) => join(process.cwd(), 'docs', 'curriculum', dir, file));

interface Axis {
  cognitive_demand: string;
  complexity: string;
  context: string;
}
interface GeneratorEntry {
  id?: string;
  generator_type?: string;
  three_axis?: Partial<Axis>;
  tags?: Partial<Axis>; // fallback shape (some pools tag axes under `tags`)
}

/**
 * Tolerant reader. In the in-memory string only (files on disk untouched):
 *   - strip a UTF-8 BOM
 *   - strip // line and / * * / block comments (spec-mandated regex; verified
 *     safe here — no '//' occurs inside any string value)
 *   - neutralize bare ± tokens (e.g. "[±1, ±2]") which only appear in fields
 *     this script never reads but otherwise break JSON.parse (NCM3)
 *   - drop trailing commas (defensive)
 */
function parseGeneratorFile(path: string): GeneratorEntry[] {
  let s = readFileSync(path, 'utf8').replace(/^﻿/, '');
  s = s.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/±\s*/g, '');
  s = s.replace(/,(\s*[}\]])/g, '$1');
  const parsed = JSON.parse(s);
  const gens = parsed?.generators;
  if (!Array.isArray(gens)) throw new Error(`No "generators" array in ${path}`);
  return gens as GeneratorEntry[];
}

/** Extract a complete axis triple from three_axis (or tags fallback), else null. */
function extractAxis(g: GeneratorEntry): Axis | null {
  const src = g.three_axis ?? g.tags;
  if (!src) return null;
  const { cognitive_demand, complexity, context } = src;
  if (
    typeof cognitive_demand === 'string' &&
    typeof complexity === 'string' &&
    typeof context === 'string'
  ) {
    return { cognitive_demand, complexity, context };
  }
  return null;
}

/** Read every page of a table (PostgREST caps responses at 1000 rows). */
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
        'Run with: npx tsx --env-file=.env.local scripts/backfill-three-axis.ts'
    );
    process.exit(1);
  }

  // 1 & 2: build map generator_key → axis, keyed by id, generator_type, and
  // <idPrefix>_<generator_type>. Conflicting keys (same key, different axis)
  // are left as-is and reported rather than silently overwritten.
  const axisByKey = new Map<string, Axis>();
  const conflicts: string[] = [];
  const addKey = (key: string | undefined, axis: Axis) => {
    if (!key) return;
    const existing = axisByKey.get(key);
    if (existing && JSON.stringify(existing) !== JSON.stringify(axis)) {
      conflicts.push(key);
      return;
    }
    axisByKey.set(key, axis);
  };
  for (const file of GENERATOR_FILES) {
    for (const g of parseGeneratorFile(file)) {
      const axis = extractAxis(g);
      if (!axis) continue;
      const prefix = (g.id ?? '').split('_')[0];
      addKey(g.id?.trim(), axis);
      addKey(g.generator_type?.trim(), axis);
      if (prefix && g.generator_type?.trim()) addKey(`${prefix}_${g.generator_type.trim()}`, axis);
    }
  }
  console.log(`Loaded ${axisByKey.size} generator keys → 3-axis from JSON files.`);
  if (conflicts.length > 0) {
    console.log(`(${conflicts.length} key(s) had conflicting axis values and were left untouched.)`);
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 3: all question_generators rows.
  const rows = await fetchAll<{
    id: string;
    generator_type: string;
    cognitive_demand: string | null;
    complexity: string | null;
    context: string | null;
  }>(supabase, 'question_generators', 'id, generator_type, cognitive_demand, complexity, context');
  console.log(`Processing ${rows.length} question_generators rows.\n`);

  // 4 & 5: update.
  let updated = 0;
  let alreadySet = 0;
  const notFound: string[] = [];
  const blocked: string[] = [];

  for (const r of rows) {
    const axis = axisByKey.get(r.generator_type);
    if (!axis) {
      notFound.push(r.generator_type);
      continue;
    }
    // Skip only when ALL three are already populated; a partial-null row is
    // refreshed from JSON across all three columns.
    if (r.cognitive_demand !== null && r.complexity !== null && r.context !== null) {
      alreadySet++;
      continue;
    }
    const { data: changed, error } = await supabase
      .from('question_generators')
      .update({
        cognitive_demand: axis.cognitive_demand,
        complexity: axis.complexity,
        context: axis.context,
      })
      .eq('id', r.id)
      .select('id');
    if (error) {
      console.error(`  FAILED ${r.generator_type}: ${error.message}`);
      continue;
    }
    if (!changed || changed.length === 0) {
      blocked.push(r.generator_type);
      continue;
    }
    updated++;
    console.log(
      `Updated ${r.generator_type} → ${axis.cognitive_demand} / ${axis.complexity} / ${axis.context}`
    );
  }

  // 6: summary + explicit not-found list.
  console.log(
    `\nUpdated ${updated} rows. ${alreadySet} already set. ${notFound.length} not found in JSON files.`
  );
  if (notFound.length > 0) {
    console.log('\nGenerator types not found in any JSON file (skipped — NULL axis, depth fallback):');
    for (const gt of notFound) console.log(`  - ${gt}`);
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
