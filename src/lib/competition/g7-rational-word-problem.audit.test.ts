import { describe, expect, it, vi } from 'vitest';

import { generate_g7_ns_rational_word_problem } from './generators';

type Branch = 'mean' | 'tax_and_split' | 'elevation' | 'debt_fraction';

function useDeterministicRandom(testBody: () => void): void {
  let state = 0x5a17;
  const random = vi.spyOn(Math, 'random').mockImplementation(() => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  });

  try {
    testBody();
  } finally {
    random.mockRestore();
  }
}

function isSameNumber(actual: string, expected: number): boolean {
  return Math.abs(Number(actual) - expected) < 0.000_001;
}

function recomputeVisiblePrompt(prompt: string): { branch: Branch; expected: number } {
  const temperature = /^The temperatures \(in °F\) recorded over 4 days were ([\d, -]+)\. What was the mean temperature\?$/.exec(prompt);
  if (temperature) {
    const values = temperature[1]!.split(', ').map(Number);
    return {
      branch: 'mean',
      expected: values.reduce((sum, value) => sum + value, 0) / values.length,
    };
  }

  const taxAndSplit = /^A meal costs \$(\d+)\. With (\d+)% tax, the total is split equally among (\d+) people\. How much does each person pay \(in dollars\)\?$/.exec(prompt);
  if (taxAndSplit) {
    const price = Number(taxAndSplit[1]);
    const taxPercent = Number(taxAndSplit[2]);
    const people = Number(taxAndSplit[3]);
    const total = Math.round(price * (1 + taxPercent / 100) * 100) / 100;
    return { branch: 'tax_and_split', expected: Math.round((total / people) * 100) / 100 };
  }

  const elevation = /^A submarine is at (-?\d+) feet relative to sea level\. It rises (\d+) feet per minute for (\d+) minutes\. What is its new depth\?$/.exec(prompt);
  if (elevation) {
    return {
      branch: 'elevation',
      expected: Number(elevation[1]) + Number(elevation[2]) * Number(elevation[3]),
    };
  }

  const debtFraction = /^A business owes \$(\d+)\. It pays off (\d+)\/(\d+) of the debt\. How much does it still owe \(as a negative number\)\?$/.exec(prompt);
  if (debtFraction) {
    const debt = -Number(debtFraction[1]);
    const numerator = Number(debtFraction[2]);
    const denominator = Number(debtFraction[3]);
    return { branch: 'debt_fraction', expected: debt - (debt * numerator) / denominator };
  }

  throw new Error(`Unexpected contextual rational-number prompt: ${prompt}`);
}

describe('Grade 7 real-world rational-number generator audit evidence', () => {
  it('recomputes 4,000 visible-prompt answers and emits only its specified application concept', () => {
    useDeterministicRandom(() => {
      const observedBranches = new Set<Branch>();

      for (const difficulty of [1, 2, 3, 4] as const) {
        for (let sample = 0; sample < 1000; sample += 1) {
          const question = generate_g7_ns_rational_word_problem(difficulty);
          const recomputed = recomputeVisiblePrompt(question.question_text);

          observedBranches.add(recomputed.branch);
          expect(question.concept_id).toBe('M7.NS.4.1');
          expect(question.generator_type).toBe('g7_ns_rational_word_problem');
          expect(isSameNumber(question.correct_answer, recomputed.expected)).toBe(true);
        }
      }

      expect([...observedBranches].sort()).toEqual([
        'debt_fraction',
        'elevation',
        'mean',
        'tax_and_split',
      ]);
    });
  });
});
