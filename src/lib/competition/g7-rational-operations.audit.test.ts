import { describe, expect, it, vi } from 'vitest';

import {
  generate_g7_add_rational,
  generate_g7_subtract_rational,
  type DifficultyLevel,
} from './generators';

type Rational = { numerator: number; denominator: number };

function normalize(raw: string): Rational {
  const text = raw.trim().replace(/[()]/g, '');
  const [numeratorText, denominatorText] = text.split('/');
  const numerator = Number(numeratorText);
  const denominator = denominatorText ? Number(denominatorText) : 1;

  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
    throw new Error(`Not a valid rational value: ${raw}`);
  }

  return { numerator, denominator };
}

function hasSameValue(left: Rational, right: Rational): boolean {
  return left.numerator * right.denominator === right.numerator * left.denominator;
}

function parseAddends(prompt: string): [Rational, Rational] {
  const match = /^Add:\s+(.+?) \+ (.+)$/.exec(prompt);
  if (!match) throw new Error(`Unexpected addition prompt: ${prompt}`);
  return [normalize(match[1]!), normalize(match[2]!)];
}

function parseSubtrahend(prompt: string): [Rational, Rational] {
  const match = /^Subtract:\s+(.+?) − (.+)$/.exec(prompt);
  if (!match) throw new Error(`Unexpected subtraction prompt: ${prompt}`);
  return [normalize(match[1]!), normalize(match[2]!)];
}

const DIFFICULTIES: DifficultyLevel[] = [1, 2, 3, 4];
const SAMPLES_PER_DIFFICULTY = 100;

function useDeterministicRandom(seed: number, testBody: () => void): void {
  let state = seed >>> 0;
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

describe('Grade 7 rational addition/subtraction audit evidence', () => {
  it('returns mathematically correct answers for 400 sampled addition instances', () => {
    useDeterministicRandom(0x7a11, () => {
      for (const difficulty of DIFFICULTIES) {
        for (let sample = 0; sample < SAMPLES_PER_DIFFICULTY; sample += 1) {
          const question = generate_g7_add_rational(difficulty);
          const [left, right] = parseAddends(question.question_text);
          const expected: Rational = {
            numerator: left.numerator * right.denominator + right.numerator * left.denominator,
            denominator: left.denominator * right.denominator,
          };

          expect(question.concept_id).toBe('M7.NS.1.2');
          expect(question.generator_type).toBe('g7_add_rational');
          expect(question.answer_type).toBe('decimal_or_fraction');
          expect(hasSameValue(normalize(question.correct_answer), expected)).toBe(true);
        }
      }
    });
  });

  it('returns mathematically correct answers for 400 sampled subtraction instances', () => {
    useDeterministicRandom(0x7b22, () => {
      for (const difficulty of DIFFICULTIES) {
        for (let sample = 0; sample < SAMPLES_PER_DIFFICULTY; sample += 1) {
          const question = generate_g7_subtract_rational(difficulty);
          const [left, right] = parseSubtrahend(question.question_text);
          const expected: Rational = {
            numerator: left.numerator * right.denominator - right.numerator * left.denominator,
            denominator: left.denominator * right.denominator,
          };

          expect(question.concept_id).toBe('M7.NS.1.4');
          expect(question.generator_type).toBe('g7_subtract_rational');
          expect(question.answer_type).toBe('decimal_or_fraction');
          expect(hasSameValue(normalize(question.correct_answer), expected)).toBe(true);
        }
      }
    });
  });
});
