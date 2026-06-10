// =============================================================================
// MathAthlone — Take-Home Assessment Assembler
// =============================================================================
// Builds a printable assessment document (Practice Review / Quiz / Unit Test)
// from the generator types + difficulties recorded on a heat's questions.
//
// NOTE on generator output shape: the canonical fields on a GeneratedQuestion
// are `question_text` / `question_latex` / `correct_answer`. The friendlier
// `question` / `answer` aliases are only backfilled by generateQuestion()'s
// ensureAliases shim — when we call GENERATORS[type] directly (as we do here)
// the legacy inline generators leave them undefined. So every read below falls
// back to the canonical field.
// =============================================================================

import { GENERATORS } from '@/lib/competition/generators';

export type AssessmentType = 'review' | 'quiz' | 'test';

export interface AssessmentQuestion {
  number: number;
  type: 'mc' | 'fr';
  section: 'A' | 'B';
  generatorType: string;
  question: string;
  answer: string;
  answerType: string;
  options?: string[];      // MC: exactly 4 options, correct answer is one of them
  correctOption?: string;  // MC: which letter (A/B/C/D) is correct
  points: number;
  workspaceLines: number;
  solutionSteps: string[];
}

export interface AssessmentDocument {
  title: string;
  course: string;
  topics: string[];
  date: string;
  type: AssessmentType;
  sections: {
    A: AssessmentQuestion[];
    B: AssessmentQuestion[];
  };
  totalPoints: number;
  heatCode: string;
}

const CONFIGS: Record<AssessmentType, {
  total: number; frRatio: number;
  mcPts: number; frPts: number; wsLines: number;
}> = {
  review: { total: 10, frRatio: 0.4, mcPts: 2, frPts: 4,  wsLines: 4 },
  quiz:   { total: 12, frRatio: 0.4, mcPts: 3, frPts: 5,  wsLines: 6 },
  test:   { total: 20, frRatio: 0.5, mcPts: 3, frPts: 5,  wsLines: 8 },
};

// Pull the human-facing question/answer regardless of which field the
// generator populated.
function readQuestion(q: any): string {
  return String(q?.question ?? q?.question_text ?? q?.question_latex ?? '');
}
function readAnswer(q: any): string {
  return String(q?.answer ?? q?.correct_answer ?? '');
}
function readSteps(q: any): string[] {
  return Array.isArray(q?.solution_steps) ? q.solution_steps : [];
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMCOptions(
  correct: string,
  genType: string,
  difficulty: number
): { options: string[]; correctOption: string } {
  const num = parseFloat(correct);
  let distractors: string[] = [];

  if (!isNaN(num) && isFinite(num) && num !== 0 && /^-?\d*\.?\d+$/.test(correct.trim())) {
    // Numeric: build distractors using common mistake patterns
    const d1 = String(Math.round(num * 1.25 * 100) / 100);
    const d2 = String(Math.round(num * 0.75 * 100) / 100);
    const d3 = String(Math.round((num + Math.abs(num) * 0.5) * 100) / 100);
    distractors = [d1, d2, d3].filter(d => d !== correct);
  } else {
    // Expression/fraction: run generator a few more times for organic distractors
    const fn = (GENERATORS as Record<string, (d: number) => any>)[genType];
    if (fn) {
      for (let i = 0; i < 8 && distractors.length < 3; i++) {
        try {
          const alt = fn(Math.max(1, difficulty - 1) as 1 | 2 | 3 | 4);
          const altAnswer = readAnswer(alt);
          if (altAnswer && altAnswer !== correct && !distractors.includes(altAnswer)) {
            distractors.push(altAnswer);
          }
        } catch {}
      }
    }
  }

  // Pad to exactly 3 distractors if needed
  const fallbacks = ['Cannot be determined', 'None of the above', 'Insufficient information'];
  while (distractors.length < 3) {
    distractors.push(fallbacks[distractors.length]!);
  }

  // Shuffle all 4 options and track correct letter
  const allOptions = fisherYates([correct, ...distractors.slice(0, 3)]);
  const letters = ['A', 'B', 'C', 'D'];
  const correctIndex = allOptions.indexOf(correct);
  const correctOption = letters[correctIndex] ?? 'A';

  return { options: allOptions, correctOption };
}

export function assembleAssessment(
  heatCode: string,
  generatorTypes: string[],
  difficulties: number[],
  type: AssessmentType,
  courseName: string,
  topicNames: string[]
): AssessmentDocument {
  const cfg = CONFIGS[type];

  // Unique generators only, shuffled without replacement
  const uniqueGens = [...new Set(generatorTypes)];
  const deck = fisherYates(uniqueGens).slice(0, cfg.total);

  const frCount = Math.round(deck.length * cfg.frRatio);
  const sectionA: AssessmentQuestion[] = [];
  const sectionB: AssessmentQuestion[] = [];

  deck.forEach((genType, i) => {
    const difficulty = (difficulties[i % Math.max(difficulties.length, 1)] ?? 2) as 1 | 2 | 3 | 4;
    const fn = (GENERATORS as Record<string, (d: number) => any>)[genType];
    if (!fn) return;

    let q: any;
    try { q = fn(difficulty); } catch { return; }

    const isFR = i < frCount;
    const question = readQuestion(q);
    const answer = readAnswer(q);
    const answerType = String(q?.answer_type ?? '');
    const solutionSteps = readSteps(q);

    if (isFR) {
      sectionB.push({
        number: sectionB.length + 1,
        type: 'fr',
        section: 'B',
        generatorType: genType,
        question,
        answer,
        answerType,
        points: cfg.frPts,
        workspaceLines: cfg.wsLines,
        solutionSteps,
      });
    } else {
      const { options, correctOption } = buildMCOptions(answer, genType, difficulty);
      sectionA.push({
        number: sectionA.length + 1,
        type: 'mc',
        section: 'A',
        generatorType: genType,
        question,
        answer,
        answerType,
        options,
        correctOption,
        points: cfg.mcPts,
        workspaceLines: 0,
        solutionSteps,
      });
    }
  });

  const totalPoints =
    sectionA.reduce((s, q) => s + q.points, 0) +
    sectionB.reduce((s, q) => s + q.points, 0);

  return {
    title: type === 'review' ? 'Practice Review'
         : type === 'quiz'   ? 'Quiz'
         :                     'Unit Test',
    course: courseName,
    topics: topicNames,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    type,
    sections: { A: sectionA, B: sectionB },
    totalPoints,
    heatCode,
  };
}
