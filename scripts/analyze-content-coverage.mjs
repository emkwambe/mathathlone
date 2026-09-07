import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  throw new Error('Usage: node analyze-content-coverage.mjs <input.json> <output.md>');
}

const rows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

function increment(map, key, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

const byCourse = new Map();
const byTopic = new Map();
const noSource = [];
const staticOnly = [];
const proceduralOnly = [];
const mixed = [];

for (const row of rows) {
  const courseKey = `${row.course_code}|${row.course_name}`;
  const topicKey = `${courseKey}|${row.topic_code}|${row.topic_name}`;

  if (!byCourse.has(courseKey)) {
    byCourse.set(courseKey, {
      code: row.course_code,
      name: row.course_name,
      total: 0,
      noSource: 0,
      proceduralOnly: 0,
      staticOnly: 0,
      mixed: 0,
      visualOnly: 0,
    });
  }
  if (!byTopic.has(topicKey)) {
    byTopic.set(topicKey, {
      courseCode: row.course_code,
      courseName: row.course_name,
      topicCode: row.topic_code,
      topicName: row.topic_name,
      total: 0,
      noSource: 0,
      proceduralOnly: 0,
      staticOnly: 0,
      mixed: 0,
      visualOnly: 0,
    });
  }

  const course = byCourse.get(courseKey);
  const topic = byTopic.get(topicKey);
  course.total += 1;
  topic.total += 1;

  switch (row.current_source_state) {
    case 'NO ACTIVE QUESTION SOURCE':
      course.noSource += 1;
      topic.noSource += 1;
      noSource.push(row);
      break;
    case 'procedural mapping only':
      course.proceduralOnly += 1;
      topic.proceduralOnly += 1;
      proceduralOnly.push(row);
      break;
    case 'static items only':
      course.staticOnly += 1;
      topic.staticOnly += 1;
      staticOnly.push(row);
      break;
    case 'procedural + static':
      course.mixed += 1;
      topic.mixed += 1;
      mixed.push(row);
      break;
    case 'visual static items only — mapping and render review required':
      course.visualOnly += 1;
      topic.visualOnly += 1;
      break;
    default:
      throw new Error(`Unexpected source state: ${row.current_source_state}`);
  }
}

const courseRows = [...byCourse.values()].sort((a, b) => a.code.localeCompare(b.code));
const topicRows = [...byTopic.values()]
  .sort((a, b) => b.noSource - a.noSource || (b.noSource / b.total) - (a.noSource / a.total) || a.courseCode.localeCompare(b.courseCode) || a.topicCode.localeCompare(b.topicCode));

function percent(numerator, denominator) {
  return denominator === 0 ? '0.0%' : `${((numerator / denominator) * 100).toFixed(1)}%`;
}

const lines = [];
lines.push('# Live Atomic-Concept Coverage Inventory');
lines.push('');
lines.push('> Generated deterministically from the user-supplied read-only Supabase export. A database mapping or static item count is availability evidence only; it is not a mathematical-accuracy or classroom-readiness claim.');
lines.push('');
lines.push(`**Atomic concepts inventoried:** ${rows.length}`);
lines.push('');
lines.push('## Course Summary');
lines.push('');
lines.push('| Course | Total | No active source | Procedural only | Static only | Procedural + static | Visual static only | No-source rate |');
lines.push('|---|---:|---:|---:|---:|---:|---:|---:|');
for (const course of courseRows) {
  lines.push(`| ${course.code} — ${course.name} | ${course.total} | ${course.noSource} | ${course.proceduralOnly} | ${course.staticOnly} | ${course.mixed} | ${course.visualOnly} | ${percent(course.noSource, course.total)} |`);
}

lines.push('');
lines.push('## Topics Ranked by Missing Question Sources');
lines.push('');
lines.push('| Course | Topic | Total | No active source | No-source rate | Procedural only | Static only | Procedural + static |');
lines.push('|---|---|---:|---:|---:|---:|---:|---:|');
for (const topic of topicRows) {
  lines.push(`| ${topic.courseCode} | ${topic.topicCode} — ${topic.topicName} | ${topic.total} | ${topic.noSource} | ${percent(topic.noSource, topic.total)} | ${topic.proceduralOnly} | ${topic.staticOnly} | ${topic.mixed} |`);
}

lines.push('');
lines.push('## Concepts With No Active Question Source');
lines.push('');
lines.push('| Course | Topic | Lesson | Atomic concept |');
lines.push('|---|---|---|---|');
for (const row of noSource.sort((a, b) => a.course_code.localeCompare(b.course_code) || a.topic_code.localeCompare(b.topic_code) || a.lesson_number.localeCompare(b.lesson_number))) {
  lines.push(`| ${row.course_code} | ${row.topic_code} — ${row.topic_name} | ${row.lesson_number} | ${row.concept_name.replaceAll('|', '\\|')} |`);
}

lines.push('');
lines.push('## Coverage Interpretation');
lines.push('');
lines.push('A **No active source** concept is an implementation/worklist candidate. A **Static only** concept may be correctly covered for a definition, representation, recognition, or misconception objective, but still needs static-item accuracy and distractor review. A **Procedural only** concept needs deterministic generator arithmetic/prompt-to-answer and mapping review. A **Procedural + static** concept has multiple source types but still needs its scope-level audit. Visual static-only coverage requires explicit mapping and render/accessibility review.');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
console.log(JSON.stringify({
  atomic_concepts: rows.length,
  courses: courseRows.length,
  no_active_source: noSource.length,
  static_only: staticOnly.length,
  procedural_only: proceduralOnly.length,
  procedural_and_static: mixed.length,
  output: outputPath,
}, null, 2));
