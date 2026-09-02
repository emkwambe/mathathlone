import {
  generate_g6_rp_calculate_unit_rate,
  generate_g6_rp_ratio_table_solve,
  generate_g6_rp_ratio_word_problem,
  type DifficultyLevel,
  type GeneratedQuestion,
} from '@/lib/competition/generators';
import { generateDistinctQuestion, questionSignature } from '@/lib/competition/question-uniqueness';

type Difficulty = 1 | 2 | 3 | 4;

const UNIT_RATE_BANDS = {
  1: { denominators: [2, 3, 4], car: [25, 40], apple: [1, 2], printer: [10, 20], snack: [50, 100] },
  2: { denominators: [5, 6, 7], car: [41, 55], apple: [2, 3], printer: [21, 40], snack: [101, 150] },
  3: { denominators: [8, 9, 11], car: [56, 70], apple: [3, 4], printer: [41, 60], snack: [151, 200] },
  4: { denominators: [12, 13, 14, 15], car: [71, 85], apple: [4, 5], printer: [61, 80], snack: [201, 250] },
} as const;

const RATIO_TABLE_BANDS = {
  1: { multiplier: [2, 4], targetX: [6, 8], includesUnitRow: true },
  2: { multiplier: [5, 7], targetX: [8, 10], includesUnitRow: true },
  3: { multiplier: [6, 8], targetX: [9, 12], includesUnitRow: false },
  4: { multiplier: [9, 12], targetX: [12, 15], includesUnitRow: false },
} as const;

const RATIO_WORD_BANDS = {
  1: { pairs: ['1:1', '1:2', '2:3'], multiple: [3, 6] },
  2: { pairs: ['1:3', '2:3', '2:5', '3:4'], multiple: [7, 10] },
  3: { pairs: ['2:5', '3:4', '3:5', '4:5'], multiple: [11, 14] },
  4: { pairs: ['3:5', '4:5', '4:7', '5:7'], multiple: [15, 18] },
} as const;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function requireMatch(text: string, pattern: RegExp, label: string): RegExpMatchArray {
  const match = text.match(pattern);
  if (!match) throw new Error(`${label}: could not parse generated prompt: ${text}`);
  return match;
}

function requireNumericAnswer(question: GeneratedQuestion, expected: number, label: string): void {
  const actual = Number(question.correct_answer);
  if (!Number.isFinite(actual) || actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${question.correct_answer}; prompt: ${question.question_text}`);
  }
}

function inRange(value: number, range: readonly [number, number]): boolean {
  return value >= range[0] && value <= range[1];
}

function verifyUnitRate(question: GeneratedQuestion, difficulty: Difficulty): void {
  const text = question.question_text;
  const bands = UNIT_RATE_BANDS[difficulty];
  const templates: Array<{ pattern: RegExp; rateBand: readonly [number, number]; apple?: boolean }> = [
    { pattern: /A car drives (\d+) miles in (\d+) hours?\./, rateBand: bands.car },
    { pattern: /A box of (\d+) apples costs \$(\d+)\./, rateBand: bands.apple, apple: true },
    { pattern: /A printer prints (\d+) pages in (\d+) minutes?\./, rateBand: bands.printer },
    { pattern: /A snack contains (\d+) calories in (\d+) servings?\./, rateBand: bands.snack },
  ];

  for (const template of templates) {
    const match = text.match(template.pattern);
    if (!match) continue;
    const first = Number(match[1]);
    const second = Number(match[2]);
    const total = template.apple ? second : first;
    const units = template.apple ? first : second;
    if (!bands.denominators.includes(units as never) || total <= 0 || total % units !== 0) {
      throw new Error(`Unit rate has invalid whole-number setup for difficulty ${difficulty}: ${text}`);
    }
    const expected = total / units;
    if (!inRange(expected, template.rateBand)) {
      throw new Error(`Unit rate falls outside its difficulty-${difficulty} rate band: ${text}`);
    }
    requireNumericAnswer(question, expected, 'Unit rate');
    return;
  }

  throw new Error(`Unit rate: unexpected prompt template: ${text}`);
}

function verifyRatioTable(question: GeneratedQuestion, difficulty: Difficulty): void {
  const tableRows = question.question_text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('|'));
  if (tableRows.length !== 4 || tableRows[0] !== 'x | y') {
    throw new Error(`Ratio table has malformed visible rows: ${question.question_text}`);
  }
  const parseRow = (row: string): [number, number | null] => {
    const match = requireMatch(row, /^(\d+) \| (\d+|\?)$/, 'Ratio table row');
    return [Number(match[1]), match[2] === '?' ? null : Number(match[2])];
  };
  const knownRows = tableRows.slice(1, 3).map(parseRow) as Array<[number, number]>;
  const [targetX, targetY] = parseRow(tableRows[3]);
  const bands = RATIO_TABLE_BANDS[difficulty];
  const multiplier = knownRows[0][1] / knownRows[0][0];
  if (!Number.isInteger(multiplier) || !inRange(multiplier, bands.multiplier)) {
    throw new Error(`Ratio table has an out-of-band multiplier at difficulty ${difficulty}: ${question.question_text}`);
  }
  if (!knownRows.every(([x, y]) => y === x * multiplier) || targetY !== null || !inRange(targetX, bands.targetX)) {
    throw new Error(`Ratio table has inconsistent values for difficulty ${difficulty}: ${question.question_text}`);
  }
  if (bands.includesUnitRow !== knownRows.some(([x]) => x === 1)) {
    throw new Error(`Ratio table has the wrong representation for difficulty ${difficulty}: ${question.question_text}`);
  }
  requireNumericAnswer(question, targetX * multiplier, 'Ratio table');
  if (!question.question_latex?.includes('\\begin{array}{c|c}') || !question.question_latex.includes('\\\\')) {
    throw new Error(`Ratio table lacks structured worksheet rendering: ${question.question_text}`);
  }
}

function verifyRatioWordProblem(question: GeneratedQuestion, difficulty: Difficulty): void {
  const match = requireMatch(
    question.question_text,
    /ratio (\d+):(\d+)\. If there are (\d+) counters in total, how many are (blue|red)\?/,
    'Ratio word problem',
  );
  const blueParts = Number(match[1]);
  const redParts = Number(match[2]);
  const total = Number(match[3]);
  const askedColor = match[4];
  const totalParts = blueParts + redParts;
  const multiplier = total / totalParts;
  const bands = RATIO_WORD_BANDS[difficulty];
  if (!bands.pairs.includes(`${blueParts}:${redParts}` as never) || !Number.isInteger(multiplier) || !inRange(multiplier, bands.multiple)) {
    throw new Error(`Ratio word problem falls outside the difficulty-${difficulty} band: ${question.question_text}`);
  }
  const expected = multiplier * (askedColor === 'blue' ? blueParts : redParts);
  requireNumericAnswer(question, expected, 'Ratio word problem');
  if (question.solution_steps.some((step) => /(?:Blue|Red) = 1 parts\b/.test(step))) {
    throw new Error(`Ratio word problem has singular grammar defect: ${question.solution_steps.join(' ')}`);
  }
}

function verifyUniquenessHelper(): void {
  const used = new Set<string>();
  const base: GeneratedQuestion = {
    question_text: 'Find 2 + 2.', question_latex: 'Find 2 + 2.', correct_answer: '4',
    answer_type: 'integer', solution_steps: [], difficulty: 1, concept_id: 'test', generator_type: 'test',
  };
  const unique: GeneratedQuestion = { ...base, question_text: 'Find 3 + 3.', question_latex: 'Find 3 + 3.', correct_answer: '6' };
  used.add(questionSignature(base));
  let calls = 0;
  const returned = generateDistinctQuestion(() => (calls++ === 0 ? base : unique), 1, used, 'test');
  if (returned.question_text !== unique.question_text || calls !== 2) {
    throw new Error('Question uniqueness helper did not retry after an exact duplicate.');
  }
  let threw = false;
  try {
    generateDistinctQuestion(() => base, 1, used, 'test');
  } catch {
    threw = true;
  }
  if (!threw) throw new Error('Question uniqueness helper accepted an exhausted duplicate prompt.');
}

const tests: Array<{ name: string; generate: (difficulty: DifficultyLevel) => GeneratedQuestion; verify: (question: GeneratedQuestion, difficulty: Difficulty) => void }> = [
  { name: 'unit-rate', generate: generate_g6_rp_calculate_unit_rate, verify: verifyUnitRate },
  { name: 'ratio-table', generate: generate_g6_rp_ratio_table_solve, verify: verifyRatioTable },
  { name: 'ratio-word-problem', generate: generate_g6_rp_ratio_word_problem, verify: verifyRatioWordProblem },
];

const originalRandom = Math.random;
const results: Record<string, number> = {};

try {
  for (const test of tests) {
    for (const difficulty of [1, 2, 3, 4] as Difficulty[]) {
      const label = `${test.name}:difficulty-${difficulty}`;
      let verified = 0;
      for (let seed = 1; seed <= 1000; seed += 1) {
        Math.random = seededRandom(seed + difficulty * 100000 + tests.indexOf(test) * 1000000);
        test.verify(test.generate(difficulty), difficulty);
        verified += 1;
      }
      results[label] = verified;
    }
  }
} finally {
  Math.random = originalRandom;
}

verifyUniquenessHelper();
console.log(JSON.stringify({
  totalVerified: Object.values(results).reduce((sum, count) => sum + count, 0),
  results,
  uniquenessHelper: 'Passed bounded retry and exhaustion behavior.',
}, null, 2));
