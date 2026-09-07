import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  throw new Error('Usage: node extract-coverage-candidates.mjs <input.json> <output.md>');
}

const focusCourses = new Set(['G6', 'G7', 'G8', 'NCM1']);
const rows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const candidates = rows
  .filter((row) => focusCourses.has(row.course_code))
  .filter((row) => row.current_source_state === 'NO ACTIVE QUESTION SOURCE')
  .sort((a, b) =>
    a.course_code.localeCompare(b.course_code) ||
    a.topic_code.localeCompare(b.topic_code) ||
    a.lesson_number.localeCompare(b.lesson_number),
  );

const lines = [
  '# Candidate Content-Gap Worklist',
  '',
  '> Extracted deterministically from the submitted live coverage inventory. These concepts have neither an active procedural generator mapping nor an active static item. They are implementation candidates, not automatically approved questions or classroom-ready content.',
  '',
  '| Course | Topic | Lesson | Atomic concept |',
  '|---|---|---|---|',
  ...candidates.map((row) =>
    `| ${row.course_code} | ${row.topic_code} — ${row.topic_name} | ${row.lesson_number} | ${row.concept_name.replaceAll('|', '\\|')} |`,
  ),
  '',
  `**Total candidate gaps in G6, G7, G8, and NCM1:** ${candidates.length}`,
  '',
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, lines.join('\n'));
console.log(JSON.stringify({ candidates: candidates.length, output: outputPath }, null, 2));
