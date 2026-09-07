import { describe, expect, it } from 'vitest';
import {
  generate_g6_ee_write_dependent_equation,
  generate_g6_geo_area_composite_6,
  generate_g6_geo_area_real_world_6,
  generate_g6_geo_surface_area_prism_6,
  generate_g6_geo_surface_area_pyramid_net_6,
  generate_g6_geo_volume_word_6,
  generate_g6_ns_identify_coordinate_plane_point_6,
  GENERATORS,
  type DifficultyLevel,
  type GeneratedQuestion,
} from './generators';

type Difficulty = 1 | 2 | 3 | 4;

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

function withSeed<T>(seed: number, operation: () => T): T {
  const originalRandom = Math.random;
  Math.random = seededRandom(seed);
  try {
    return operation();
  } finally {
    Math.random = originalRandom;
  }
}

function numericAnswer(question: GeneratedQuestion): number {
  const answer = Number(question.correct_answer);
  expect(Number.isFinite(answer)).toBe(true);
  return answer;
}

function expectConcept(question: GeneratedQuestion, conceptId: string): void {
  expect(question.concept_id).toBe(conceptId);
  expect(question.generator_type).toMatch(/^g6_/);
  expect(question.question_text).not.toContain('<svg');
}

function verifyRateEquation(question: GeneratedQuestion): void {
  expectConcept(question, 'M6.EE.5.2');
  const rateMatch = question.question_text.match(/(?:travels at |earns \$|makes )(\d+) (?:miles per hour|per hour|pages per minute)/);
  expect(rateMatch).not.toBeNull();
  const rate = Number(rateMatch?.[1]);
  const answer = question.correct_answer.replace(/\s/g, '');
  expect([
    `d=${rate}t`,
    `e=${rate}h`,
    `p=${rate}m`,
  ]).toContain(answer);
}

function verifyCompositeArea(question: GeneratedQuestion): void {
  expectConcept(question, 'M6.GEO.1.4');
  const lShape = question.question_text.match(/inside a (\d+) m by (\d+) m rectangle\. A (\d+) m by (\d+) m rectangular corner is cut out/);
  if (lShape) {
    const [, outerWidth, outerHeight, cutoutWidth, cutoutHeight] = lShape.map(Number);
    expect(numericAnswer(question)).toBe(outerWidth * outerHeight - cutoutWidth * cutoutHeight);
    return;
  }
  const rectangleTriangle = question.question_text.match(/a (\d+) m by (\d+) m rectangle and a non-overlapping triangle with base (\d+) m and height (\d+) m/);
  expect(rectangleTriangle).not.toBeNull();
  const [, rectangleWidth, rectangleHeight, triangleBase, triangleHeight] = rectangleTriangle!.map(Number);
  expect(triangleBase * triangleHeight % 2).toBe(0);
  expect(numericAnswer(question)).toBe(rectangleWidth * rectangleHeight + (triangleBase * triangleHeight) / 2);
}

function verifySurfaceArea(question: GeneratedQuestion): void {
  expectConcept(question, 'M6.GEO.2.2');
  const triangular = question.question_text.match(/legs (\d+) cm and (\d+) cm and hypotenuse (\d+) cm\. The prism is (\d+) cm long/);
  if (triangular) {
    const [, legA, legB, hypotenuse, prismLength] = triangular.map(Number);
    expect(hypotenuse * hypotenuse).toBe(legA * legA + legB * legB);
    expect(numericAnswer(question)).toBe(legA * legB + prismLength * (legA + legB + hypotenuse));
    return;
  }
  const rectangular = question.question_text.match(/length (\d+) cm, width (\d+) cm, and height (\d+) cm/);
  expect(rectangular).not.toBeNull();
  const [, length, width, height] = rectangular!.map(Number);
  expect(numericAnswer(question)).toBe(2 * (length * width + length * height + width * height));
}

function verifyRealWorldArea(question: GeneratedQuestion): void {
  expectConcept(question, 'M6.GEO.4.1');
  const rectangle = question.question_text.match(/floor is (\d+) m long and (\d+) m wide/);
  if (rectangle) {
    expect(numericAnswer(question)).toBe(Number(rectangle[1]) * Number(rectangle[2]));
    return;
  }
  const triangle = question.question_text.match(/base of (\d+) cm and a height of (\d+) cm/);
  if (triangle) {
    expect(Number(triangle[1]) * Number(triangle[2]) % 2).toBe(0);
    expect(numericAnswer(question)).toBe((Number(triangle[1]) * Number(triangle[2])) / 2);
    return;
  }
  const parallelogram = question.question_text.match(/base of (\d+) m and a perpendicular height of (\d+) m/);
  expect(parallelogram).not.toBeNull();
  expect(numericAnswer(question)).toBe(Number(parallelogram![1]) * Number(parallelogram![2]));
}

function verifyVolumeApplication(question: GeneratedQuestion): void {
  expectConcept(question, 'M6.GEO.4.3');
  const match = question.question_text.match(/is (\d+) (?:cm|dm|m) long, (\d+) (?:cm|dm|m) wide, and (\d+) (?:cm|dm|m) (?:high|deep)/);
  expect(match).not.toBeNull();
  const [, length, width, height] = match!.map(Number);
  expect(numericAnswer(question)).toBe(length * width * height);
}

function verifyPyramidNet(question: GeneratedQuestion): void {
  expectConcept(question, 'M6.GEO.2.3');
  const square = question.question_text.match(/square pyramid has a (\d+) cm by \1 cm square base.*Each triangle has base \1 cm and perpendicular height (\d+) cm/);
  if (square) {
    const side = Number(square[1]);
    const triangleHeight = Number(square[2]);
    expect(numericAnswer(question)).toBe(side * side + 2 * side * triangleHeight);
    return;
  }
  const rectangular = question.question_text.match(/rectangular pyramid has a (\d+) cm by (\d+) cm rectangular base.*two triangular faces have base \1 cm and perpendicular height (\d+) cm.*two triangular faces have base \2 cm and perpendicular height \3 cm/i);
  expect(rectangular).not.toBeNull();
  const [, length, width, triangleHeight] = rectangular!.map(Number);
  expect(numericAnswer(question)).toBe(length * width + length * triangleHeight + width * triangleHeight);
}

function verifyCoordinatePlane(question: GeneratedQuestion): void {
  expectConcept(question, 'M6.NS.4.6');
  const moves = question.question_text.match(/move (\d+) units (left|right) and (\d+) units (up|down)/);
  if (moves) {
    const x = Number(moves[1]) * (moves[2] === 'left' ? -1 : 1);
    const y = Number(moves[3]) * (moves[4] === 'down' ? -1 : 1);
    expect(question.correct_answer).toBe(`(${x}, ${y})`);
    return;
  }
  const quadrant = question.question_text.match(/point P is located at \((-?\d+), (-?\d+)\).*which quadrant/);
  if (quadrant) {
    const x = Number(quadrant[1]);
    const y = Number(quadrant[2]);
    const expected = x > 0 && y > 0 ? 'I' : x < 0 && y > 0 ? 'II' : x < 0 && y < 0 ? 'III' : 'IV';
    expect(question.correct_answer).toBe(expected);
    return;
  }
  const axis = question.question_text.match(/point \((-?\d+), (-?\d+)\) lies on which axis/);
  expect(axis).not.toBeNull();
  expect(question.correct_answer).toBe(Number(axis![1]) === 0 ? 'y-axis' : 'x-axis');
}

const generatorChecks: Array<{
  label: string;
  generate: (difficulty: DifficultyLevel) => GeneratedQuestion;
  verify: (question: GeneratedQuestion) => void;
}> = [
  { label: 'rate-equation', generate: generate_g6_ee_write_dependent_equation, verify: verifyRateEquation },
  { label: 'composite-area', generate: generate_g6_geo_area_composite_6, verify: verifyCompositeArea },
  { label: 'surface-area-prism', generate: generate_g6_geo_surface_area_prism_6, verify: verifySurfaceArea },
  { label: 'real-world-area', generate: generate_g6_geo_area_real_world_6, verify: verifyRealWorldArea },
  { label: 'real-world-volume', generate: generate_g6_geo_volume_word_6, verify: verifyVolumeApplication },
  { label: 'pyramid-net', generate: generate_g6_geo_surface_area_pyramid_net_6, verify: verifyPyramidNet },
  { label: 'coordinate-plane', generate: generate_g6_ns_identify_coordinate_plane_point_6, verify: verifyCoordinatePlane },
];

describe('Grade 6 gap-closure procedural generators', () => {
  it('registers every staged generator key in the runtime registry', () => {
    expect(Object.keys(GENERATORS)).toEqual(expect.arrayContaining([
      'g6_ee_write_dependent_equation',
      'g6_geo_area_composite_6',
      'g6_geo_surface_area_prism_6',
      'g6_geo_surface_area_pyramid_net_6',
      'g6_geo_area_real_world_6',
      'g6_geo_volume_word_6',
      'g6_ns_identify_coordinate_plane_point_6',
    ]));
  });

  for (const { label, generate, verify } of generatorChecks) {
    it(`${label} recomputes every visible prompt across deterministic samples`, () => {
      for (const difficulty of [1, 2, 3, 4] as Difficulty[]) {
        for (let seed = 1; seed <= 1000; seed += 1) {
          const question = withSeed(seed + difficulty * 100_000, () => generate(difficulty));
          verify(question);
        }
      }
    });
  }
});
