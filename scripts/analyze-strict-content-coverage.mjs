import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/analyze-strict-content-coverage.mjs <input-json> <output-markdown>');
}

const rows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(rows) || rows.length === 0) {
  throw new Error('Expected a non-empty JSON array of source-evidence rows.');
}

const summary = new Map();
const topicSummary = new Map();
const unavailableRows = [];
const unverifiedStaticRows = [];

function getBucket(map, key, seed) {
  const current = map.get(key);
  if (current) return current;
  const next = { ...seed };
  map.set(key, next);
  return next;
}

function classify(row) {
  const procedural = Number(row.active_generator_mapping_count ?? 0) > 0;
  const verifiedStatic = Number(row.verified_static_item_count ?? 0) > 0;
  const unverifiedStatic = Number(row.unverified_static_item_count ?? 0) > 0;

  if (procedural && verifiedStatic) return 'procedural_and_verified_static';
  if (procedural) return 'procedural_mapping';
  if (verifiedStatic) return 'verified_static_only';
  if (unverifiedStatic) return 'unverified_static_only';
  return 'no_approved_active_source';
}

function apply(bucket, state) {
  bucket.total += 1;
  bucket[state] += 1;
  if (state === 'unverified_static_only' || state === 'no_approved_active_source') {
    bucket.unavailable += 1;
  }
}

for (const row of rows) {
  const state = classify(row);
  const courseKey = `${row.course_code}|${row.course_name}`;
  const topicKey = `${courseKey}|${row.topic_code}|${row.topic_name}`;
  const seed = {
    total: 0,
    procedural_and_verified_static: 0,
    procedural_mapping: 0,
    verified_static_only: 0,
    unverified_static_only: 0,
    no_approved_active_source: 0,
    unavailable: 0,
  };
  apply(getBucket(summary, courseKey, seed), state);
  apply(getBucket(topicSummary, topicKey, seed), state);

  if (state === 'unverified_static_only' || state === 'no_approved_active_source') {
    unavailableRows.push({ ...row, deterministic_state: state });
  }
  if (state === 'unverified_static_only') {
    unverifiedStaticRows.push({ ...row, deterministic_state: state });
  }
}

const total = rows.length;
const totalUnavailable = unavailableRows.length;
const unavailablePct = ((totalUnavailable / total) * 100).toFixed(1);
const totals = {
  procedural_and_verified_static: rows.filter((row) => classify(row) === 'procedural_and_verified_static').length,
  procedural_mapping: rows.filter((row) => classify(row) === 'procedural_mapping').length,
  verified_static_only: rows.filter((row) => classify(row) === 'verified_static_only').length,
  unverified_static_only: rows.filter((row) => classify(row) === 'unverified_static_only').length,
  no_approved_active_source: rows.filter((row) => classify(row) === 'no_approved_active_source').length,
};

const courseRows = Array.from(summary.entries())
  .map(([key, value]) => {
    const [courseCode, courseName] = key.split('|');
    return { courseCode, courseName, ...value };
  })
  .sort((a, b) => b.unavailable - a.unavailable || a.courseCode.localeCompare(b.courseCode));

const topicRows = Array.from(topicSummary.entries())
  .map(([key, value]) => {
    const [courseCode, courseName, topicCode, topicName] = key.split('|');
    return { courseCode, courseName, topicCode, topicName, ...value };
  })
  .sort((a, b) => b.unavailable - a.unavailable || a.courseCode.localeCompare(b.courseCode) || a.topicCode.localeCompare(b.topicCode));

const lines = [
  '# Strict Atomic-Concept Source-Evidence Inventory',
  '',
  '> **Status:** Live read-only inventory; this is source evidence, not a classroom-readiness determination.',
  '',
  '## Portfolio Summary',
  '',
  `The inventory contains **${total}** selector-visible atomic concepts. Under the approved availability contract, **${totalUnavailable} (${unavailablePct}%)** are unavailable because they have either no approved active source or only active-but-unverified static items. Procedural mappings still require a runtime-registry check in the availability service before they may be treated as available.`,
  '',
  '| Strict source evidence state | Concepts | Interpretation |',
  '|---|---:|---|',
  `| Procedural + verified static | ${totals.procedural_and_verified_static} | Multiple mapped source families; runtime generator implementation still must be confirmed. |`,
  `| Procedural mapping only | ${totals.procedural_mapping} | Database procedural mapping exists; runtime implementation must be confirmed. |`,
  `| Verified static only | ${totals.verified_static_only} | May be available only after source-aware worksheet/Heat delivery supports the item. |`,
  `| Unverified static only | ${totals.unverified_static_only} | Unavailable until static-item verification is recorded. |`,
  `| No approved active source | ${totals.no_approved_active_source} | Unavailable; needs a mapped source or explicitly staged source. |`,
  '',
  '## Course Summary',
  '',
  '| Course | Total | Procedural + verified static | Procedural mapping | Verified static only | Unverified static only | No approved source | Unavailable |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
  ...courseRows.map((row) => `| ${row.courseCode} — ${row.courseName} | ${row.total} | ${row.procedural_and_verified_static} | ${row.procedural_mapping} | ${row.verified_static_only} | ${row.unverified_static_only} | ${row.no_approved_active_source} | ${row.unavailable} |`),
  '',
  '## Highest-Gap Topics',
  '',
  '| Course | Topic | Total | No approved source | Unverified-static only | Unavailable |',
  '|---|---|---:|---:|---:|---:|',
  ...topicRows.slice(0, 30).map((row) => `| ${row.courseCode} | ${row.topicCode} — ${row.topicName} | ${row.total} | ${row.no_approved_active_source} | ${row.unverified_static_only} | ${row.unavailable} |`),
  '',
  '## Deterministic Follow-up',
  '',
  'The availability service must perform the runtime-key check for every procedural mapping, classify verified static coverage separately, and keep unverified/static-less concepts disabled. This report does not infer visual availability because the application has no complete explicit visual-to-concept registry yet.',
  '',
  'The detailed unavailable worklist is stored alongside this report as `STRICT_ATOMIC_CONCEPT_UNAVAILABLE_WORKLIST.json`.',
  '',
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
const unavailableOutput = path.join(path.dirname(outputPath), 'STRICT_ATOMIC_CONCEPT_UNAVAILABLE_WORKLIST.json');
fs.writeFileSync(unavailableOutput, `${JSON.stringify(unavailableRows, null, 2)}\n`);
console.log(JSON.stringify({ total, totalUnavailable, unavailablePct, totals, courses: courseRows.length, topics: topicRows.length }, null, 2));
