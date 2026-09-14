// =============================================================================
// MathAthlone — Take-Home Assessment Assembler
// =============================================================================
// Builds printable assessment documents from a server-resolved source plan.
// Procedural sources create fresh deterministic instances; static sources are
// finite exact-mapped items validated before this assembler receives them.
// =============================================================================

import { GENERATORS, type DifficultyLevel, type GeneratedQuestion } from '@/lib/competition/generators';
import { generateDistinctQuestion } from '@/lib/competition/question-uniqueness';
import type { SourceDeliveryCandidate, SourceDeliveryPlan } from '@/lib/content/source-delivery-plan';
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
  /** Internal delivery identity; student-safe copies remove static source IDs. */
  generatorType: string;
  conceptId: string;
  question: string;
  answer?: string;
  answerType: string;
  options?: string[];
  correctOption?: string;
  points: number;
  workspaceLines: number;
  solutionSteps?: string[];
  sourceKind: 'procedural' | 'static';
  sourceStaticId?: string;
  sourceContentSha256?: string;
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
  announcedSkills: string[];
  purpose: AssessmentPurpose;
  preparationNote?: string;
  returnHref?: string;
  date: string;
  type: AssessmentType;
  questionCount: number;
  sections: {
    A: AssessmentQuestion[];
    B: AssessmentQuestion[];
  };
  totalPoints: number;
  heatCode: string;
  showAnswerKey: boolean;
}

const TITLES: Record<AssessmentType, string> = {
  review: 'Practice Review',
  quiz: 'Quiz',
  homework: 'Homework',
  test: 'Unit Test',
  makeup: 'Makeup Test',
};

const ANSWER_KEY_TYPES = new Set<AssessmentType>(['quiz', 'test', 'makeup']);

/** Re-exported for existing server-only callers. */
export { getAssessmentQuestionBudget } from '@/lib/assessment/config';

function readQuestion(q: any): string {
  return String(q?.question_latex ?? q?.question ?? q?.question_text ?? '');
}
function readAnswer(q: any): string {
  return String(q?.answer ?? q?.correct_answer ?? '');
}
function readSteps(q: any): string[] {
  return Array.isArray(q?.solution_steps) ? q.solution_steps.map(String) : [];
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildMCOptions(
  correct: string,
  genType: string,
  difficulty: number,
): { options: string[]; correctOption: string } {
  const num = parseFloat(correct);
  let distractors: string[] = [];

  if (!isNaN(num) && isFinite(num) && num !== 0 && /^-?\d*\.?\d+$/.test(correct.trim())) {
    const d1 = String(Math.round(num * 1.25 * 100) / 100);
    const d2 = String(Math.round(num * 0.75 * 100) / 100);
    const d3 = String(Math.round((num + Math.abs(num) * 0.5) * 100) / 100);
    distractors = [d1, d2, d3].filter((value) => value !== correct);
  } else {
    const fn = (GENERATORS as Record<string, (d: number) => any>)[genType];
    if (fn) {
      for (let i = 0; i < 8 && distractors.length < 3; i++) {
        try {
          const altAnswer = readAnswer(fn(Math.max(1, difficulty - 1) as 1 | 2 | 3 | 4));
          if (altAnswer && altAnswer !== correct && !distractors.includes(altAnswer)) distractors.push(altAnswer);
        } catch {
          // A failed distractor attempt is not a reason to change source scope.
        }
      }
    }
  }

  const fallbacks = ['Cannot be determined', 'None of the above', 'Insufficient information'];
  while (distractors.length < 3) distractors.push(fallbacks[distractors.length]!);

  const allOptions = fisherYates([correct, ...distractors.slice(0, 3)]);
  const correctIndex = allOptions.indexOf(correct);
  return { options: allOptions, correctOption: ['A', 'B', 'C', 'D'][correctIndex] ?? 'A' };
}

export interface AssembleAssessmentOptions {
  announcedSkills?: string[];
  purpose?: AssessmentPurpose;
  preparationNote?: string;
  returnHref?: string;
  candidates?: AssessmentGeneratorCandidate[];
  /** A server-resolved exact source plan overrides raw procedural candidates. */
  deliveryPlan?: SourceDeliveryPlan;
  questionCount?: number;
}

type AssessmentDeliveryCandidate =
  | { kind: 'procedural'; conceptId: string; generatorType: string }
  | Extract<SourceDeliveryCandidate, { kind: 'static' }>;

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
  for (const conceptId of fisherYates(Array.from(byConcept.keys()))) {
    if (deck.length >= questionCount) break;
    const choices = fisherYates(byConcept.get(conceptId) ?? []);
    const candidate = choices.find((choice) => !usedTypes.has(choice.generatorType)) ?? choices[0];
    if (!candidate) continue;
    deck.push(candidate);
    usedTypes.add(candidate.generatorType);
  }
  while (deck.length < questionCount) {
    const cycle = fisherYates(uniqueCandidates);
    let added = false;
    for (const candidate of cycle) {
      if (deck.length >= questionCount) break;
      if (usedTypes.has(candidate.generatorType) && usedTypes.size < new Set(uniqueCandidates.map((item) => item.generatorType)).size) continue;
      deck.push(candidate);
      usedTypes.add(candidate.generatorType);
      added = true;
    }
    if (!added) usedTypes.clear();
  }
  return deck;
}

function toAssessmentDeck(
  generatorTypes: string[],
  questionCount: number,
  options: AssembleAssessmentOptions,
): AssessmentDeliveryCandidate[] {
  if (options.deliveryPlan) {
    if (options.deliveryPlan.requestedQuestionCount !== questionCount || options.deliveryPlan.candidates.length !== questionCount) {
      throw new Error('The exact source plan does not satisfy the requested worksheet question count.');
    }
    return options.deliveryPlan.candidates;
  }
  return buildPracticeDeck(generatorTypes, questionCount, options.candidates)
    .map((candidate) => ({ kind: 'procedural' as const, ...candidate }));
}

/**
 * Removes student-inappropriate answer and source fields before JSON reaches the
 * browser. It is intentionally applied server-side for Practice Review and
 * competition-preparation documents, not merely hidden by the print component.
 */
export function redactAssessmentForStudent(doc: AssessmentDocument): AssessmentDocument {
  if (doc.showAnswerKey) return doc;
  const redactQuestion = (question: AssessmentQuestion): AssessmentQuestion => ({
    ...question,
    answer: undefined,
    correctOption: undefined,
    solutionSteps: [],
    sourceStaticId: undefined,
    sourceContentSha256: undefined,
  });
  return {
    ...doc,
    sections: {
      A: doc.sections.A.map(redactQuestion),
      B: doc.sections.B.map(redactQuestion),
    },
  };
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
  const deck = toAssessmentDeck(generatorTypes, questionPlan.questionCount, options);
  const maxFreeResponse = Math.min(
    questionPlan.freeResponseCount,
    deck.filter((candidate) => candidate.kind === 'procedural').length,
  );
  let remainingFreeResponse = maxFreeResponse;
  const sectionA: AssessmentQuestion[] = [];
  const sectionB: AssessmentQuestion[] = [];
  const usedQuestionSignatures = new Set<string>();

  deck.forEach((candidate, index) => {
    if (candidate.kind === 'static') {
      sectionA.push({
        number: sectionA.length + 1,
        type: 'mc',
        section: 'A',
        generatorType: 'static',
        conceptId: candidate.conceptId,
        question: candidate.questionLatex ?? candidate.questionText,
        answer: candidate.correctAnswer,
        answerType: 'text',
        options: candidate.options.map((option) => option.text),
        correctOption: candidate.correctAnswer,
        points: cfg.multipleChoicePoints,
        workspaceLines: 0,
        solutionSteps: [candidate.explanation],
        sourceKind: 'static',
        sourceStaticId: candidate.sourceStaticId,
        sourceContentSha256: candidate.contentSha256,
      });
      return;
    }

    const difficulty = (difficulties[index % Math.max(difficulties.length, 1)] ?? 2) as 1 | 2 | 3 | 4;
    const fn = (GENERATORS as Record<string, (d: number) => any>)[candidate.generatorType];
    if (!fn) throw new Error(`No implemented worksheet generator exists for ${candidate.generatorType}.`);

    let generated: GeneratedQuestion;
    try {
      generated = generateDistinctQuestion(
        fn as (level: DifficultyLevel) => GeneratedQuestion,
        difficulty as DifficultyLevel,
        usedQuestionSignatures,
        candidate.generatorType,
      );
    } catch (error) {
      throw new Error(`Could not assemble a unique practice question for ${candidate.generatorType}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }

    const isFreeResponse = remainingFreeResponse > 0;
    if (isFreeResponse) remainingFreeResponse -= 1;
    const question = readQuestion(generated);
    const answer = readAnswer(generated);
    const answerType = String(generated?.answer_type ?? '');
    const solutionSteps = readSteps(generated);
    const questionBase = {
      conceptId: candidate.conceptId || String(generated?.concept_id ?? ''),
      question,
      answer,
      answerType,
      points: isFreeResponse ? cfg.freeResponsePoints : cfg.multipleChoicePoints,
      sourceKind: 'procedural' as const,
    };

    if (isFreeResponse) {
      sectionB.push({
        number: sectionB.length + 1,
        type: 'fr',
        section: 'B',
        generatorType: candidate.generatorType,
        ...questionBase,
        workspaceLines: cfg.workspaceLines,
        solutionSteps,
      });
    } else {
      const mc = buildMCOptions(answer, candidate.generatorType, difficulty);
      sectionA.push({
        number: sectionA.length + 1,
        type: 'mc',
        section: 'A',
        generatorType: candidate.generatorType,
        ...questionBase,
        options: mc.options,
        correctOption: mc.correctOption,
        workspaceLines: 0,
        solutionSteps,
      });
    }
  });

  if (sectionA.length + sectionB.length !== questionPlan.questionCount) {
    throw new Error('The worksheet assembler did not produce the exact requested source-plan count.');
  }

  const totalPoints = sectionA.reduce((sum, question) => sum + question.points, 0)
    + sectionB.reduce((sum, question) => sum + question.points, 0);

  return {
    title: TITLES[type],
    course: courseName,
    topics: topicNames,
    announcedSkills: options.announcedSkills ?? [],
    purpose: options.purpose ?? 'standalone_practice',
    preparationNote: options.preparationNote,
    returnHref: options.returnHref,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    type,
    questionCount: questionPlan.questionCount,
    sections: { A: sectionA, B: sectionB },
    totalPoints,
    heatCode,
    showAnswerKey: ANSWER_KEY_TYPES.has(type),
  };
}
