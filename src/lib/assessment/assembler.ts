// =============================================================================
// MathAthlone — Take-Home Assessment Assembler
// =============================================================================
// Builds a printable assessment document (Practice Review / Quiz / Homework /
// Unit Test / Makeup Test) from a set of generator types. This is a standalone
// tool: it takes generator types directly and does NOT depend on a heat.
//
// NOTE on generator output shape: the canonical fields on a GeneratedQuestion
// are `question_text` / `question_latex` / `correct_answer`. The friendlier
// `question` / `answer` aliases are only backfilled by generateQuestion()'s
// ensureAliases shim — when we call GENERATORS[type] directly (as we do here)
// the legacy inline generators leave them undefined. So every read below falls
// back to the canonical field.
// =============================================================================

import { GENERATORS, type DifficultyLevel, type GeneratedQuestion } from '@/lib/competition/generators';
import { generateDistinctQuestion } from '@/lib/competition/question-uniqueness';
import {
  ASSESSMENT_FORMAT_CONFIGS,
  getAssessmentQuestionPlan,
  type AssessmentType,
} from '@/lib/assessment/config';

export type { AssessmentType } from '@/lib/assessment/config';

export interface AssessmentQuestion {
  number: number;
  type: 'mc' | 'fr';
  section: 'A' | 'B';
  generatorType: string;
  /** Canonical concept selected for this practice item. */
  conceptId: string;
  question: string;
  answer: string;
  answerType: string;
  options?: string[];      // MC: exactly 4 options, correct answer is one of them
  correctOption?: string;  // MC: which letter (A/B/C/D) is correct
  points: number;
  workspaceLines: number;
  solutionSteps: string[];
}

export type AssessmentPurpose = 'standalone_practice' | 'competition_preparation';

export interface AssessmentGeneratorCandidate {
  conceptId: string;
  generatorType: string;
}

export interface AssessmentDocument {
  title: string;
  course: string;
  topics: string[];
  /** Human-readable selected skills. This excludes generator IDs and answers. */
  concepts: string[];
  purpose: AssessmentPurpose;
  /** Student-safe statement explaining independent later Heat generation. */
  preparationNote?: string;
  /** Optional teacher-only navigation back to the original Heat configuration. */
  returnHref?: string;
  date: string;
  type: AssessmentType;
  /** Teacher-selected document length, validated by the generation API. */
  questionCount: number;
  sections: {
    A: AssessmentQuestion[];
    B: AssessmentQuestion[];
  };
  totalPoints: number;
  heatCode: string;
  /** Teacher answer key is rendered for formal assessments, not practice. */
  showAnswerKey: boolean;
}

const TITLES: Record<AssessmentType, string> = {
  review:   'Practice Review',
  quiz:     'Quiz',
  homework: 'Homework',
  test:     'Unit Test',
  makeup:   'Makeup Test',
};

// Formal assessments ship with a teacher answer key; practice handouts don't.
const ANSWER_KEY_TYPES = new Set<AssessmentType>(['quiz', 'test', 'makeup']);

/** Re-exported for existing server-only callers. */
export { getAssessmentQuestionBudget } from '@/lib/assessment/config';

// Pull the human-facing question/answer regardless of which field the
// generator populated.
function readQuestion(q: any): string {
  // Printable worksheets prefer a generator's explicit formatted version
  // (for example a KaTeX ratio table). Live Heat delivery continues to use
  // question_text, which remains a plain-text accessible prompt.
  return String(q?.question_latex ?? q?.question ?? q?.question_text ?? '');
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

export interface AssembleAssessmentOptions {
  /** Human-readable concepts the teacher selected from the curriculum tree. */
  concepts?: string[];
  /** Makes the worksheet’s student-facing purpose explicit. */
  purpose?: AssessmentPurpose;
  /** Student-safe independent-question explanation for competition preparation. */
  preparationNote?: string;
  /** Teacher-only route back to the Heat Builder after printing. */
  returnHref?: string;
  /** Concept-linked generator candidates resolved and validated on the server. */
  candidates?: AssessmentGeneratorCandidate[];
  /** Bounded teacher-selected question count for this document. */
  questionCount?: number;
}

/**
 * Build a varied practice deck that gives every selected concept one item before
 * any eligible generator type repeats. A later Heat invokes its own generation
 * path, so none of this document's generated values are reused as Heat items.
 */
function buildPracticeDeck(
  generatorTypes: string[],
  questionCount: number,
  candidates: AssessmentGeneratorCandidate[] = [],
): AssessmentGeneratorCandidate[] {
  const usable = candidates.length > 0
    ? candidates
    : [...new Set(generatorTypes)].map((generatorType) => ({ conceptId: '', generatorType }));

  const uniqueCandidates = Array.from(
    new Map(usable.map((candidate) => [`${candidate.conceptId}:${candidate.generatorType}`, candidate])).values(),
  );
  if (uniqueCandidates.length === 0) return [];

  const byConcept = new Map<string, AssessmentGeneratorCandidate[]>();
  for (const candidate of uniqueCandidates) {
    const entries = byConcept.get(candidate.conceptId) ?? [];
    entries.push(candidate);
    byConcept.set(candidate.conceptId, entries);
  }

  const deck: AssessmentGeneratorCandidate[] = [];
  const usedTypes = new Set<string>();

  // Coverage pass: take one candidate for each requested concept, only while a
  // question slot remains. API validation prevents a selected set larger than
  // the chosen document budget.
  for (const conceptId of fisherYates(Array.from(byConcept.keys()))) {
    if (deck.length >= questionCount) break;
    const choices = fisherYates(byConcept.get(conceptId) ?? []);
    const candidate = choices.find((choice) => !usedTypes.has(choice.generatorType)) ?? choices[0];
    if (!candidate) continue;
    deck.push(candidate);
    usedTypes.add(candidate.generatorType);
  }

  // Variety pass: fill remaining slots using every available generator type
  // before repeating one. Procedural generators can safely create fresh values
  // on repeated invocation when the selected set is smaller than the document.
  while (deck.length < questionCount) {
    const cycle = fisherYates(uniqueCandidates);
    let added = false;
    for (const candidate of cycle) {
      if (deck.length >= questionCount) break;
      if (usedTypes.has(candidate.generatorType) && usedTypes.size < new Set(uniqueCandidates.map((item) => item.generatorType)).size) {
        continue;
      }
      deck.push(candidate);
      usedTypes.add(candidate.generatorType);
      added = true;
    }
    if (!added) {
      usedTypes.clear();
    }
  }

  return deck;
}

export function assembleAssessment(
  generatorTypes: string[],
  difficulties: number[],
  type: AssessmentType,
  courseName: string,
  topicNames: string[],
  heatCode: string = 'STANDALONE',
  options: AssembleAssessmentOptions = {},
): AssessmentDocument {
  const cfg = ASSESSMENT_FORMAT_CONFIGS[type];
  const questionPlan = getAssessmentQuestionPlan(type, options.questionCount);
  const deck = buildPracticeDeck(generatorTypes, questionPlan.questionCount, options.candidates);
  const frCount = questionPlan.freeResponseCount;
  const sectionA: AssessmentQuestion[] = [];
  const sectionB: AssessmentQuestion[] = [];
  const usedQuestionSignatures = new Set<string>();

  deck.forEach((candidate, i) => {
    const difficulty = (difficulties[i % Math.max(difficulties.length, 1)] ?? 2) as 1 | 2 | 3 | 4;
    const fn = (GENERATORS as Record<string, (d: number) => any>)[candidate.generatorType];
    if (!fn) return;

    let q: GeneratedQuestion;
    try {
      q = generateDistinctQuestion(
        fn as (level: DifficultyLevel) => GeneratedQuestion,
        difficulty as DifficultyLevel,
        usedQuestionSignatures,
        candidate.generatorType,
      );
    } catch (error) {
      throw new Error(
        `Could not assemble a unique practice question for ${candidate.generatorType}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    const isFR = i < frCount;
    const question = readQuestion(q);
    const answer = readAnswer(q);
    const answerType = String(q?.answer_type ?? '');
    const solutionSteps = readSteps(q);
    const conceptId = candidate.conceptId || String(q?.concept_id ?? '');

    if (isFR) {
      sectionB.push({
        number: sectionB.length + 1,
        type: 'fr',
        section: 'B',
        generatorType: candidate.generatorType,
        conceptId,
        question,
        answer,
        answerType,
        points: cfg.freeResponsePoints,
        workspaceLines: cfg.workspaceLines,
        solutionSteps,
      });
    } else {
      const { options: mcOptions, correctOption } = buildMCOptions(answer, candidate.generatorType, difficulty);
      sectionA.push({
        number: sectionA.length + 1,
        type: 'mc',
        section: 'A',
        generatorType: candidate.generatorType,
        conceptId,
        question,
        answer,
        answerType,
        options: mcOptions,
        correctOption,
        points: cfg.multipleChoicePoints,
        workspaceLines: 0,
        solutionSteps,
      });
    }
  });

  const totalPoints =
    sectionA.reduce((s, q) => s + q.points, 0) +
    sectionB.reduce((s, q) => s + q.points, 0);

  return {
    title: TITLES[type],
    course: courseName,
    topics: topicNames,
    concepts: options.concepts ?? [],
    purpose: options.purpose ?? 'standalone_practice',
    preparationNote: options.preparationNote,
    returnHref: options.returnHref,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    type,
    questionCount: questionPlan.questionCount,
    sections: { A: sectionA, B: sectionB },
    totalPoints,
    heatCode,
    showAnswerKey: ANSWER_KEY_TYPES.has(type),
  };
}
