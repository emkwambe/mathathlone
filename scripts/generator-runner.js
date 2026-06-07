// generator-runner.js — runs a generator N times at each difficulty
// Usage: node scripts/generator-runner.js '{"generatorType":"g7_add_rational","samples":5,"difficulties":[1,2,3,4]}'

const { execSync } = require('child_process');
const args = JSON.parse(process.argv[2] || '{}');
const { generatorType, samples = 5, difficulties = [1,2,3,4] } = args;

const code = `
import { GENERATORS } from './src/lib/competition/generators';
const fn = (GENERATORS as any)['${generatorType}'];
if (!fn) { console.log(JSON.stringify([{error:'not found'}])); process.exit(0); }
const results: any[] = [];
for (const d of ${JSON.stringify(difficulties)}) {
  for (let i = 0; i < ${samples}; i++) {
    try {
      const q = fn(d);
      results.push({ generator_type:'${generatorType}', difficulty:d,
        question:q.question, answer:String(q.answer),
        answer_type:q.answer_type, concept_name:q.concept_name||'',
        solution_steps:q.solution_steps||[] });
    } catch(e:any) {
      results.push({ generator_type:'${generatorType}', difficulty:d, error:e.message });
    }
  }
}
console.log(JSON.stringify(results));
`.replace(/'/g, "'\\''");

try {
  const result = execSync(
    `npx tsx -e '${code}'`,
    { cwd: process.cwd(), encoding: 'utf8', timeout: 30000 }
  );
  process.stdout.write(result.trim());
} catch (e) {
  console.log(JSON.stringify([{ error: e.message }]));
}
