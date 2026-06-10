// sample-generators.ts
// Run: npx tsx scripts/sample-generators.ts G7 5
// Outputs JSON array of generator samples

import { GENERATORS } from '../src/lib/competition/generators';

const prefix = process.argv[2] || '';
const samplesPerDiff = parseInt(process.argv[3] || '5');
const difficulties = [1, 2, 3, 4];

const genTypes = Object.keys(GENERATORS).filter(k =>
  prefix === '' || k.startsWith(prefix)
);

const results: any[] = [];

for (const gt of genTypes) {
  for (const diff of difficulties) {
    for (let i = 0; i < samplesPerDiff; i++) {
      try {
        const fn = (GENERATORS as any)[gt];
        const q = fn(diff);
        results.push({
          generator_type: gt,
          difficulty: diff,
          question: q.question,
          answer: String(q.answer),
          answer_type: q.answer_type,
          concept_name: q.concept_name || '',
          solution_steps: (q.solution_steps || []).slice(0, 3),
        });
      } catch (e: any) {
        results.push({
          generator_type: gt,
          difficulty: diff,
          error: e.message,
        });
      }
    }
  }
}

console.log(JSON.stringify(results));
