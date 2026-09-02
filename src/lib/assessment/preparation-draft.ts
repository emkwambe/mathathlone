import type { HeatType, IntegrityLevel, QuestionProfile } from '@/lib/competition/heat-service';

const PREPARATION_DRAFT_KEY = 'mathathlone:worksheet-preparation:draft';

export interface WorksheetPreparationDraft {
  rankingDivisionId: string;
  contentDivisionId: string | null;
  courseId: string;
  conceptIds: string[];
  mode: HeatType;
  questionProfile: QuestionProfile;
  integrityLevel: IntegrityLevel;
  questionCount: number;
  durationMinutes: number;
  classId: string;
}

export function saveWorksheetPreparationDraft(draft: WorksheetPreparationDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PREPARATION_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // The worksheet itself is still usable if browser storage is unavailable.
  }
}

export function loadWorksheetPreparationDraft(): WorksheetPreparationDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PREPARATION_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<WorksheetPreparationDraft>;
    if (
      !draft.rankingDivisionId ||
      !draft.courseId ||
      !Array.isArray(draft.conceptIds) ||
      draft.conceptIds.length === 0 ||
      !draft.mode ||
      !draft.questionProfile ||
      !draft.integrityLevel ||
      !draft.questionCount ||
      !draft.durationMinutes
    ) {
      return null;
    }
    return draft as WorksheetPreparationDraft;
  } catch {
    return null;
  }
}

export function clearWorksheetPreparationDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(PREPARATION_DRAFT_KEY);
  } catch {
    // Ignore a storage failure; no sensitive information is kept in the draft.
  }
}

export const WORKSHEET_PREPARATION_RETURN_HREF = '/compete/create?preparation=return';
