import { GENERATORS } from '../src/lib/competition/generators';

const keys = Object.keys(GENERATORS).filter((key) => key.startsWith('m2_'));
const issues: Array<{ key: string; difficulty: number; issue: string; question: string; answer: string }> = [];
const samples: Array<{ key: string; difficulty: number; question: string; answer: string; steps: string[] }> = [];

for (const key of keys) {
  const generator = GENERATORS[key]!;
  for (const difficulty of [1, 2, 3, 4] as const) {
    for (let run = 0; run < 40; run += 1) {
      const item = generator(difficulty);
      const question = item.question_text ?? '';
      const answer = item.correct_answer ?? '';
      const serialised = JSON.stringify(item);

      if (!question.trim()) issues.push({ key, difficulty, issue: 'empty question', question, answer });
      if (!answer.trim()) issues.push({ key, difficulty, issue: 'empty answer', question, answer });
      if (!item.solution_steps?.length) issues.push({ key, difficulty, issue: 'missing solution steps', question, answer });
      if (serialised.includes('undefined') || serialised.includes('NaN') || serialised.includes('Infinity')) {
        issues.push({ key, difficulty, issue: 'invalid value leaked', question, answer });
      }
      if (/\b(?:-?1)x\b/.test(question)) {
        issues.push({ key, difficulty, issue: 'ugly 1x formatting', question, answer });
      }
      if (!/[.?!]$/.test(question.trim())) {
        issues.push({ key, difficulty, issue: 'question lacks terminal punctuation', question, answer });
      }
      if (run === 0) samples.push({ key, difficulty, question, answer, steps: item.solution_steps });
    }
  }
}

console.log(JSON.stringify({
  generator_count: keys.length,
  runs: keys.length * 4 * 40,
  issue_count: issues.length,
  issues,
  samples,
}, null, 2));

if (issues.length > 0) process.exitCode = 1;
