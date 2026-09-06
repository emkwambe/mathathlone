// =============================================================================
// MathAthlone — Deterministic Pilot Content-Readiness Registry
// =============================================================================
// This registry communicates recorded audit evidence to staff. It is deliberately
// small, manually maintained, and version controlled. It does not infer content
// quality, create student labels, or replace qualified educator approval.
// =============================================================================

export type ContentAuditStatus =
  | 'not_audited'
  | 'source_calibrated_pending_educator'
  | 'controlled_acceptance_in_progress'
  | 'operationally_accepted';

export type ReadinessTone = 'slate' | 'amber' | 'blue' | 'green';

export interface ContentReadiness {
  status: ContentAuditStatus;
  label: string;
  tone: ReadinessTone;
  /** A precise statement for staff. It must never imply an unrecorded approval. */
  summary: string;
  /** The evidence record that governs this status. */
  auditRecord?: string;
  /** True only after both qualified review and controlled operational evidence close. */
  classroomReady: boolean;
}

export interface ReadinessConcept {
  id: string;
  lesson_number?: string | null;
}

interface RecordedAuditScope {
  courseCode: string;
  conceptLessonNumbers: readonly string[];
  readiness: ContentReadiness;
}

const NO_RECORDED_AUDIT: ContentReadiness = {
  status: 'not_audited',
  label: 'No recorded pilot content audit',
  tone: 'amber',
  summary: 'This selected scope has no recorded presentability, mathematical-accuracy, qualified-educator, or controlled operational acceptance evidence. Do not describe it as classroom-ready.',
  classroomReady: false,
};

const RECORDED_AUDIT_SCOPES: readonly RecordedAuditScope[] = [
  {
    courseCode: 'G6',
    conceptLessonNumbers: ['M6.RP.1.3', 'M6.RP.2.1', 'M6.RP.2.3'],
    readiness: {
      status: 'controlled_acceptance_in_progress',
      label: 'Controlled verification in progress',
      tone: 'blue',
      summary: 'The selected Grade 6 ratios scope is source-calibrated. Qualified Grade 6 educator sign-off and final production worksheet-to-Heat evidence are still required; it is not classroom-ready.',
      auditRecord: 'PILOT-NC6M-RP-001',
      classroomReady: false,
    },
  },
  {
    courseCode: 'NCM1',
    conceptLessonNumbers: ['M1.EQN.2.2', 'M1.EQN.2.3', 'M1.EQN.2.4', 'M1.EQN.2.5'],
    readiness: {
      status: 'source_calibrated_pending_educator',
      label: 'Source-calibrated; educator and production gates pending',
      tone: 'blue',
      summary: 'The selected NC Math 1 linear-equation scope is mathematically validated and source-calibrated. Qualified NC Math 1 educator review and controlled worksheet/PDF/Heat evidence are still required; it is not classroom-ready.',
      auditRecord: 'PILOT-NCM1-LINEAR-001',
      classroomReady: false,
    },
  },
];

const COURSE_LIMITED_SCOPE_SUMMARIES: Readonly<Record<string, ContentReadiness>> = {
  G6: {
    status: 'controlled_acceptance_in_progress',
    label: 'Limited audit record — select the reviewed scope',
    tone: 'blue',
    summary: 'Only the documented Grade 6 ratios scope has recorded pilot evidence. Other Grade 6 topics remain unaudited for presentability and mathematical accuracy.',
    auditRecord: 'PILOT-NC6M-RP-001',
    classroomReady: false,
  },
  NCM1: {
    status: 'source_calibrated_pending_educator',
    label: 'Limited audit record — select the reviewed scope',
    tone: 'blue',
    summary: 'Only the documented NC Math 1 linear-equation scope has source-level evidence. Other NC Math 1 topics remain unaudited for presentability and mathematical accuracy.',
    auditRecord: 'PILOT-NCM1-LINEAR-001',
    classroomReady: false,
  },
};

/**
 * Returns the recorded status for an exact/subset selection of a reviewed scope.
 * A mixed selection is intentionally treated as unaudited: no automated rule may
 * extend an audit claim from reviewed concepts to another concept.
 */
export function getSelectedContentReadiness(
  courseCode: string | undefined,
  concepts: readonly ReadinessConcept[],
): ContentReadiness {
  if (!courseCode || concepts.length === 0) {
    return getCourseContentReadiness(courseCode);
  }

  const selectedLessonNumbers = new Set(
    concepts
      .map((concept) => concept.lesson_number?.trim())
      .filter((lessonNumber): lessonNumber is string => Boolean(lessonNumber)),
  );

  if (selectedLessonNumbers.size !== concepts.length) {
    return NO_RECORDED_AUDIT;
  }

  const matchedScope = RECORDED_AUDIT_SCOPES.find(
    (scope) =>
      scope.courseCode === courseCode &&
      [...selectedLessonNumbers].every((lessonNumber) => scope.conceptLessonNumbers.includes(lessonNumber)),
  );

  return matchedScope?.readiness ?? NO_RECORDED_AUDIT;
}

/**
 * Returns the conservative course-level cue before a teacher selects concepts.
 * It never promotes a limited audited scope to whole-course approval.
 */
export function getCourseContentReadiness(courseCode: string | undefined): ContentReadiness {
  if (courseCode) {
    return COURSE_LIMITED_SCOPE_SUMMARIES[courseCode] ?? NO_RECORDED_AUDIT;
  }
  return NO_RECORDED_AUDIT;
}

export function getReadinessClasses(tone: ReadinessTone): { container: string; badge: string } {
  switch (tone) {
    case 'blue':
      return {
        container: 'border-blue-200 bg-blue-50 text-blue-950',
        badge: 'border-blue-300 bg-white text-blue-800',
      };
    case 'green':
      return {
        container: 'border-emerald-200 bg-emerald-50 text-emerald-950',
        badge: 'border-emerald-300 bg-white text-emerald-800',
      };
    case 'slate':
      return {
        container: 'border-slate-200 bg-slate-50 text-slate-900',
        badge: 'border-slate-300 bg-white text-slate-700',
      };
    case 'amber':
    default:
      return {
        container: 'border-amber-200 bg-amber-50 text-amber-950',
        badge: 'border-amber-300 bg-white text-amber-800',
      };
  }
}

export function hasCuratedAnnouncedSkill(announcedSkill: string | null | undefined): boolean {
  return typeof announcedSkill === 'string' && announcedSkill.trim().length > 0;
}
