// =============================================================================
// MathAthlone — Generate Assessment (standalone tool)
// =============================================================================
// A sibling to Create Heat. Produces a printable take-home document
// (Practice Review / Quiz / Homework / Unit Test / Makeup Test) WITHOUT
// depending on a completed heat. Flow mirrors Create Heat exactly:
//
//   Step 1: Division          (auto-detected from teacher profile)
//   Step 2: Course             (filtered by grade_band, Coming-Soon badge)
//   Step 3: Topics & Concepts  (multi-select tree with indeterminate state)
//   Step 4: Document Type       (Review | Quiz | Homework | Test | Makeup)
//   Step 5: Difficulty Profile  (Warm-Up | Standard | Challenge)
//   Step 6: Generate
//
// On Generate we pull the active question_generators for the selected concepts,
// assemble the document client-side, hand it to /assessment/preview via
// sessionStorage, and navigate there to print.
// =============================================================================

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Loader2,
  Minus,
  PenLine,
  RefreshCw,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRouteLoadingFallback } from '@/components/auth/ProtectedRouteLoadingFallback';
import type { AssessmentDocument } from '@/lib/assessment/assembler';
import { ContentReadinessNotice } from '@/components/content/ContentReadinessNotice';
import {
  getSelectedContentReadiness,
  hasCuratedAnnouncedSkill,
} from '@/lib/content/readiness';
import {
  ASSESSMENT_FORMAT_CONFIGS,
  getAssessmentQuestionPlan,
  getWorksheetLengthGuidance,
  type AssessmentType,
} from '@/lib/assessment/config';
import {
  loadWorksheetPreparationDraft,
  type WorksheetPreparationDraft,
  WORKSHEET_PREPARATION_RETURN_HREF,
} from '@/lib/assessment/preparation-draft';

// -----------------------------------------------------------------------------
// TYPES  (mirrors compete/create/page.tsx)
// -----------------------------------------------------------------------------

interface DivisionRow {
  id: string;
  name: string;
  code: string;
  grade_min: number;
  grade_max: number;
  available: boolean;
}

interface CourseRow {
  id: string;
  name: string;
  code: string;
  available?: boolean;
}

interface UnitTopicRow {
  id: string;
  name: string;
  code: string;
  display_order: number;
}

interface ConceptRow {
  id: string;
  name: string;
  lesson_number: string;
  announced_skill: string | null;
  unit_topic_id: string;
}

// -----------------------------------------------------------------------------
// CONSTANTS  (mirrors compete/create/page.tsx so the picker is identical)
// -----------------------------------------------------------------------------

const DIVISION_ICONS: Record<string, React.ReactNode> = {
  JR:  <GraduationCap className="w-6 h-6" />,
  INT: <GraduationCap className="w-6 h-6" />,
  ADV: <GraduationCap className="w-6 h-6" />,
  JV:  <GraduationCap className="w-6 h-6" />,
  SV:  <GraduationCap className="w-6 h-6" />,
};

const DIVISION_GRADE_BANDS: Record<string, string[]> = {
  JR:  [],
  INT: ['6'],
  ADV: ['7', '8'],
  JV:  ['8-9', '9-10'],
  SV:  ['10-11', '11-12'],
};

const DIVISION_COURSE_CODES: Record<string, string[]> = {
  FOUND: ['MF'],
  F:     ['MF'],
};

// NC Math 2 has active Batch 1 procedural generators as of migration 044.
const COURSES_WITHOUT_GENERATORS = new Set<string>(['ALG2', 'APPC']);
const CURRICULUM_REQUEST_TIMEOUT_MS = 10_000;

function withCurriculumTimeout<T>(request: PromiseLike<T>, operation: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`${operation} took too long. Check your connection and try again.`));
    }, CURRICULUM_REQUEST_TIMEOUT_MS);

    Promise.resolve(request).then(
      (result) => {
        window.clearTimeout(timeout);
        resolve(result);
      },
      (reason) => {
        window.clearTimeout(timeout);
        reject(reason);
      },
    );
  });
}

// Document types — counts/ratios live in the assembler's CONFIGS; the desc
// here just summarizes them for the picker.
const DOC_TYPES: Array<{
  key: AssessmentType;
  label: string;
  icon: React.ReactNode;
  desc: string;
}> = [
  { key: 'review',   label: 'Practice Review', icon: <Clipboard className="w-5 h-5" />,      desc: '5–16 questions · student-safe practice' },
  { key: 'quiz',     label: 'Quiz',            icon: <FileText className="w-5 h-5" />,        desc: '6–16 questions · graded' },
  { key: 'homework', label: 'Homework',        icon: <PenLine className="w-5 h-5" />,         desc: '5–14 questions · take-home' },
  { key: 'test',     label: 'Unit Test',       icon: <ClipboardCheck className="w-5 h-5" />,  desc: '10–20 questions · formal' },
  { key: 'makeup',   label: 'Makeup Test',     icon: <ClipboardCheck className="w-5 h-5" />,  desc: '10–20 questions · alternate' },
];

type DifficultyProfileKey = 'warmup' | 'standard' | 'challenge';

const DIFFICULTY_PROFILES: Array<{
  key: DifficultyProfileKey;
  label: string;
  emoji: string;
  desc: string;
  difficulty: number;
}> = [
  { key: 'warmup',    label: 'Warm-Up',   emoji: '🌱', desc: 'Recall · single-step',      difficulty: 1 },
  { key: 'standard',  label: 'Standard',  emoji: '📐', desc: 'Application · mixed steps',  difficulty: 2 },
  { key: 'challenge', label: 'Challenge', emoji: '⚡', desc: 'Analysis · multi-step',      difficulty: 3 },
];

// A worksheet may intentionally focus on one atomic skill; competition Heat
// configuration retains its independent multi-concept requirements.
const MIN_CONCEPTS = 1;

// -----------------------------------------------------------------------------
// HELPER COMPONENTS  (mirrors compete/create/page.tsx)
// -----------------------------------------------------------------------------

function SectionCard({
  step,
  title,
  hint,
  locked,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border p-6 mb-4 transition-opacity ${
        locked ? 'border-gray-100 opacity-50 pointer-events-none' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-1">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
          {step}
        </span>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {hint && <p className="text-xs text-gray-400 ml-10 mb-4">{hint}</p>}
      <div className="ml-10 mt-3">{children}</div>
    </div>
  );
}

interface TreeNodeProps {
  topic: UnitTopicRow;
  concepts: ConceptRow[];
  expanded: boolean;
  selectedConceptIds: Set<string>;
  onToggleExpand: () => void;
  onToggleConcept: (conceptId: string) => void;
  onToggleTopic: (topicId: string) => void;
}

function TopicTreeNode({
  topic,
  concepts,
  expanded,
  selectedConceptIds,
  onToggleExpand,
  onToggleConcept,
  onToggleTopic,
}: TreeNodeProps) {
  const selectedInTopic = concepts.filter((c) => selectedConceptIds.has(c.id)).length;
  const allSelected = concepts.length > 0 && selectedInTopic === concepts.length;
  const someSelected = selectedInTopic > 0 && !allSelected;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
        <button
          type="button"
          onClick={onToggleExpand}
          className="p-1 rounded hover:bg-gray-200 text-gray-500"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
          <span
            role="checkbox"
            aria-checked={allSelected ? 'true' : someSelected ? 'mixed' : 'false'}
            onClick={(e) => {
              e.preventDefault();
              onToggleTopic(topic.id);
            }}
            className={`inline-flex items-center justify-center w-4 h-4 rounded border ${
              allSelected
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : someSelected
                ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                : 'bg-white border-gray-300'
            }`}
          >
            {allSelected && <Check className="w-3 h-3" />}
            {someSelected && <Minus className="w-3 h-3" />}
          </span>
          <span className="text-sm font-medium text-gray-800">{topic.name}</span>
        </label>
        <span className="text-xs text-gray-400">
          {selectedInTopic} / {concepts.length}
        </span>
      </div>
      {expanded && (
        <div className="px-3 py-2 space-y-1 bg-white">
          {concepts.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-1">No concepts in this topic yet.</p>
          ) : (
            concepts.map((c) => {
              const isSelected = selectedConceptIds.has(c.id);
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleConcept(c.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="min-w-0 text-sm text-gray-700">
                    {hasCuratedAnnouncedSkill(c.announced_skill) ? c.announced_skill : c.name}
                    {hasCuratedAnnouncedSkill(c.announced_skill) && (
                      <span className="ml-2 text-[11px] text-slate-400">{c.lesson_number}</span>
                    )}
                  </span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

export default function GenerateAssessmentPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: authLoading, isAuthenticated, hasRole } = useAuth();

  // Worksheet creation is instructional authoring: teachers may prepare class
  // competition practice and parents may create independent practice only.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login?next=/assessment/generate');
      return;
    }
    if (!hasRole(['teacher', 'parent'])) {
      router.push('/403');
    }
  }, [authLoading, isAuthenticated, hasRole, router]);

  // ── Curriculum state ────────────────────────────────────────────────────
  const [divisions, setDivisions] = useState<DivisionRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [unitTopics, setUnitTopics] = useState<UnitTopicRow[]>([]);
  const [concepts, setConcepts] = useState<ConceptRow[]>([]);

  const [selectedDivision, setSelectedDivision] = useState<DivisionRow | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [selectedConceptIds, setSelectedConceptIds] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // ── Document config state ───────────────────────────────────────────────
  const [docType, setDocType] = useState<AssessmentType>('quiz');
  const [questionCount, setQuestionCount] = useState<number>(ASSESSMENT_FORMAT_CONFIGS.quiz.defaultQuestionCount);
  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfileKey>('standard');

  // ── UI state ────────────────────────────────────────────────────────────
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curriculumRetry, setCurriculumRetry] = useState(0);
  const [preparationDraft, setPreparationDraft] = useState<WorksheetPreparationDraft | null>(null);
  const [isHeatPreparation, setIsHeatPreparation] = useState(false);

  // Read the mode only after client hydration. This keeps the route safely
  // prerenderable while preserving the teacher's session-only Heat blueprint.
  useEffect(() => {
    const isPreparation = new URLSearchParams(window.location.search).get('preparation') === 'heat';
    setIsHeatPreparation(isPreparation);
    if (isPreparation) setPreparationDraft(loadWorksheetPreparationDraft());
  }, []);

  useEffect(() => {
    if (isHeatPreparation) {
      setDocType('review');
      setQuestionCount(ASSESSMENT_FORMAT_CONFIGS.review.defaultQuestionCount);
    }
  }, [isHeatPreparation]);

  const retryCurriculum = useCallback(() => {
    setError(null);
    setLoadingCurriculum(true);
    setLoadingCourses(false);
    setLoadingConcepts(false);
    setCurriculumRetry((attempt) => attempt + 1);
  }, []);

  // ── Load divisions ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadDivisions() {
      setLoadingCurriculum(true);
      try {
        // Render the core catalog as soon as the essential divisions query
        // resolves. Custom division-curriculum links are an optional upgrade.
        const divResult = await withCurriculumTimeout(
          supabase
            .from('divisions')
            .select('id, name, code, grade_min, grade_max')
            .order('grade_min', { ascending: true }),
          'Loading divisions',
        );
        if (cancelled) return;
        if (divResult.error) throw divResult.error;

        const rows: DivisionRow[] = (divResult.data ?? []).map((d: any) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          grade_min: d.grade_min,
          grade_max: d.grade_max,
          available:
            (DIVISION_GRADE_BANDS[d.code]?.length ?? 0) > 0
              || (DIVISION_COURSE_CODES[d.code]?.length ?? 0) > 0,
        }));
        setDivisions(rows);

        const teacherGrade = profile?.grade_level ?? null;
        const restoredContentDivisionId = preparationDraft?.contentDivisionId ?? preparationDraft?.rankingDivisionId;
        const restored = restoredContentDivisionId
          ? rows.find((row) => row.id === restoredContentDivisionId && row.available) ?? null
          : null;
        const byGrade = teacherGrade
          ? rows.find((r) => r.available && teacherGrade >= r.grade_min && teacherGrade <= r.grade_max) ?? null
          : null;
        const firstAvail = rows.find((r) => r.available) ?? null;
        setSelectedDivision(restored ?? byGrade ?? firstAvail);

        void withCurriculumTimeout(
          supabase.from('division_curricula').select('division_id'),
          'Loading custom division curricula',
        ).then(({ data, error }) => {
          if (cancelled || error) return;
          const linked = new Set<string>((data ?? []).map((r: any) => r.division_id));
          if (linked.size === 0) return;
          setDivisions((previous) => previous.map((division) => ({
            ...division,
            available: division.available || linked.has(division.id),
          })));
        }).catch((err) => {
          console.warn('[GenerateAssessment] optional division_curricula lookup skipped:', err);
        });
      } catch (err: any) {
        if (!cancelled) {
          setDivisions([]);
          setSelectedDivision(null);
          setError(err?.message ?? "Couldn't load divisions. Please try again.");
        }
      } finally {
        if (!cancelled) setLoadingCurriculum(false);
      }
    }
    loadDivisions();
    return () => {
      cancelled = true;
    };
  }, [supabase, profile?.grade_level, preparationDraft, curriculumRetry]);

  // ── Load courses ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDivision) {
      setCourses([]);
      setSelectedCourse(null);
      setLoadingCourses(false);
      return;
    }
    let cancelled = false;
    async function loadCourses() {
      setLoadingCourses(true);
      const divisionCode = selectedDivision!.code;
      const gradeBands = DIVISION_GRADE_BANDS[divisionCode] ?? [];
      const courseCodes = DIVISION_COURSE_CODES[divisionCode] ?? [];

      if (gradeBands.length === 0 && courseCodes.length === 0) {
        setCourses([]);
        setSelectedCourse(null);
        setLoadingCourses(false);
        return;
      }

      let query = supabase
        .from('courses')
        .select('id, name, code')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (gradeBands.length > 0 && courseCodes.length > 0) {
        query = query.or(`grade_band.in.(${gradeBands.join(',')}),code.in.(${courseCodes.join(',')})`);
      } else if (gradeBands.length > 0) {
        query = query.in('grade_band', gradeBands);
      } else {
        query = query.in('code', courseCodes);
      }

      try {
        const { data, error: cErr } = await withCurriculumTimeout(query, 'Loading courses');
        if (cancelled) return;
        if (cErr) throw cErr;

        const rows: CourseRow[] = (data ?? []).map((c: any) => ({
          ...(c as CourseRow),
          available: !COURSES_WITHOUT_GENERATORS.has(c.code),
        }));
        setCourses(rows);

        const restored = preparationDraft
          ? rows.find((course) => course.id === preparationDraft.courseId && course.available !== false) ?? null
          : null;
        const firstAvail = rows.find((c) => c.available !== false) ?? null;
        setSelectedCourse(restored ?? firstAvail);
      } catch (err: any) {
        if (!cancelled) {
          setCourses([]);
          setSelectedCourse(null);
          setError(err?.message ?? "Couldn't load courses. Please try again.");
        }
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    }
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [selectedDivision, supabase, preparationDraft, curriculumRetry]);

  // ── Load unit_topics + atomic_concepts for the selected course ─────────
  useEffect(() => {
    if (!selectedCourse) {
      setUnitTopics([]);
      setConcepts([]);
      setSelectedConceptIds(new Set());
      setExpandedTopics(new Set());
      setLoadingConcepts(false);
      return;
    }
    let cancelled = false;
    async function loadTree() {
      setLoadingConcepts(true);
      try {
        const courseId = selectedCourse!.id;
        const { data: topics, error: uErr } = await withCurriculumTimeout(
          supabase
            .from('unit_topics')
            .select('id, name, code, display_order')
            .eq('course_id', courseId)
            .order('display_order', { ascending: true }),
          'Loading unit topics',
        );
        if (cancelled) return;
        if (uErr) throw uErr;

        const topicRows = (topics as UnitTopicRow[]) ?? [];
        setUnitTopics(topicRows);
        const topicIds = topicRows.map((t) => t.id);
        if (topicIds.length === 0) {
          setConcepts([]);
          setSelectedConceptIds(new Set());
          setExpandedTopics(new Set());
          return;
        }

        const { data: cs, error: cErr } = await withCurriculumTimeout(
          supabase
            .from('atomic_concepts')
            .select('id, name, lesson_number, announced_skill, unit_topic_id')
            .in('unit_topic_id', topicIds)
            .order('lesson_number', { ascending: true }),
          'Loading concepts',
        );
        if (cancelled) return;
        if (cErr) throw cErr;

        const conceptRows = (cs as ConceptRow[]) ?? [];
        setConcepts(conceptRows);
        // A worksheet launched from Heat Builder must keep the exact selected
        // concept blueprint. Standalone practice keeps the fast all-selected default.
        setSelectedConceptIds(
          preparationDraft?.courseId === selectedCourse!.id
            ? new Set(preparationDraft.conceptIds.filter((id) => conceptRows.some((concept) => concept.id === id)))
            : new Set(conceptRows.map((c) => c.id)),
        );
        setExpandedTopics(topicRows.length > 0 ? new Set([topicRows[0]!.id]) : new Set());
      } catch (err: any) {
        if (!cancelled) {
          setUnitTopics([]);
          setConcepts([]);
          setSelectedConceptIds(new Set());
          setError(err?.message ?? "Couldn't load assessment concepts. Please try again.");
        }
      } finally {
        if (!cancelled) setLoadingConcepts(false);
      }
    }
    loadTree();
    return () => {
      cancelled = true;
    };
  }, [selectedCourse, supabase, preparationDraft, curriculumRetry]);

  // ── Tree manipulation helpers ───────────────────────────────────────────
  const conceptsByTopic = useMemo(() => {
    const map = new Map<string, ConceptRow[]>();
    for (const c of concepts) {
      const arr = map.get(c.unit_topic_id) ?? [];
      arr.push(c);
      map.set(c.unit_topic_id, arr);
    }
    return map;
  }, [concepts]);

  const toggleConcept = useCallback((conceptId: string) => {
    setSelectedConceptIds((prev) => {
      const next = new Set(prev);
      if (next.has(conceptId)) next.delete(conceptId);
      else next.add(conceptId);
      return next;
    });
  }, []);

  const toggleTopic = useCallback(
    (topicId: string) => {
      const topicConcepts = conceptsByTopic.get(topicId) ?? [];
      setSelectedConceptIds((prev) => {
        const next = new Set(prev);
        const allInTopicSelected = topicConcepts.every((c) => next.has(c.id));
        if (allInTopicSelected) {
          for (const c of topicConcepts) next.delete(c.id);
        } else {
          for (const c of topicConcepts) next.add(c.id);
        }
        return next;
      });
    },
    [conceptsByTopic]
  );

  const toggleExpand = useCallback((topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, []);

  const selectAllConcepts = useCallback(() => {
    setSelectedConceptIds(new Set(concepts.map((c) => c.id)));
  }, [concepts]);

  const clearAllConcepts = useCallback(() => {
    setSelectedConceptIds(new Set());
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────
  const totalConcepts = concepts.length;
  const selectedCount = selectedConceptIds.size;
  const enoughConcepts = selectedCount >= MIN_CONCEPTS;
  const selectedConcepts = useMemo(
    () => concepts.filter((concept) => selectedConceptIds.has(concept.id)),
    [concepts, selectedConceptIds],
  );
  const selectedContentReadiness = useMemo(
    () => getSelectedContentReadiness(selectedCourse?.code, selectedConcepts),
    [selectedCourse?.code, selectedConcepts],
  );
  const missingAnnouncedSkillCount = useMemo(
    () => selectedConcepts.filter((concept) => !hasCuratedAnnouncedSkill(concept.announced_skill)).length,
    [selectedConcepts],
  );
  const competitionBriefingReady = !isHeatPreparation || missingAnnouncedSkillCount === 0;

  const selectedTopicSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of concepts) {
      if (!selectedConceptIds.has(c.id)) continue;
      map.set(c.unit_topic_id, (map.get(c.unit_topic_id) ?? 0) + 1);
    }
    return unitTopics
      .filter((t) => (map.get(t.id) ?? 0) > 0)
      .map((t) => ({ name: t.name, count: map.get(t.id)! }));
  }, [concepts, selectedConceptIds, unitTopics]);

  const worksheetPlan = useMemo(
    () => getAssessmentQuestionPlan(docType, questionCount),
    [docType, questionCount],
  );
  const worksheetFormat = ASSESSMENT_FORMAT_CONFIGS[docType];
  const everyConceptCanAppear = selectedCount <= questionCount;

  const canGenerate =
    !!selectedDivision &&
    !!selectedCourse &&
    selectedCourse.available !== false &&
    enoughConcepts &&
    everyConceptCanAppear &&
    competitionBriefingReady &&
    !!docType &&
    !!difficultyProfile;

  // ── Generate handler ────────────────────────────────────────────────────
  // Assembly now runs server-side via POST /api/assessment/generate so that
  // the GENERATORS registry (9 000+ lines) is never bundled into the browser.
  const handleGenerate = useCallback(async () => {
    if (!selectedCourse || !enoughConcepts) {
      setError('Select at least one concept to generate an assessment.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const conceptIds = Array.from(selectedConceptIds);
      const difficulty =
        DIFFICULTY_PROFILES.find((p) => p.key === difficultyProfile)?.difficulty ?? 2;

      const res = await fetch('/api/assessment/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptIds,
          courseId: selectedCourse.id,
          docType: isHeatPreparation ? 'review' : docType,
          difficulty,
          purpose: isHeatPreparation ? 'competition_preparation' : 'standalone_practice',
          questionCount,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error ?? `Server error ${res.status}`);
      }

      const doc: AssessmentDocument = payload.doc;

      // Hand the document to the preview route via sessionStorage.
      window.sessionStorage.setItem('mathathlone:assessment:doc', JSON.stringify(doc));
      router.push('/assessment/preview');
    } catch (err: any) {
      console.error('[GenerateAssessment] failed:', err);
      setError(err?.message ?? 'Failed to generate the assessment. Please try again.');
      setGenerating(false);
    }
  }, [
    selectedCourse,
    enoughConcepts,
    selectedConceptIds,
    difficultyProfile,
    docType,
    selectedTopicSummary,
    isHeatPreparation,
    questionCount,
    router,
  ]);

  // ── Loading / unauthorized states ───────────────────────────────────────
  if (authLoading || loadingCurriculum) {
    return <ProtectedRouteLoadingFallback loginHref="/auth/login?next=/assessment/generate" title="Loading Assessment Generator" />;
  }
  if (!isAuthenticated) return null;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <a href="/dashboard/teacher" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">Practice Worksheet Builder</span>
        </nav>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-indigo-500" />
            Practice Worksheet Builder
          </h1>
          <p className="text-gray-500 mt-1">
            Select the skills students will practice. A later Heat can assess the same skills with newly generated questions.
          </p>
        </div>

        {isHeatPreparation && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Competition preparation worksheet</p>
            <p className="mt-1 text-sm text-emerald-800">
              These course, topic, and concept selections came from your Heat Builder. Students will practice these skills now; the later Heat will generate new question instances.
            </p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Something went wrong</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
            {!generating && (
              <button
                type="button"
                onClick={retryCurriculum}
                className="inline-flex items-center gap-1.5 flex-shrink-0 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4" />
                Retry loading
              </button>
            )}
          </div>
        )}

        {/* ── Step 1: Division ─────────────────────────────────────────── */}
        <SectionCard step={1} title="Choose a Division" hint="Practice worksheets draw from a division's curriculum." locked={isHeatPreparation}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {divisions.map((d) => {
              const isSelected = selectedDivision?.id === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => d.available && setSelectedDivision(d)}
                  disabled={!d.available}
                  className={`relative p-4 rounded-xl border-2 text-center transition-all ${
                    !d.available
                      ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`mx-auto mb-2 flex justify-center ${!d.available ? 'text-gray-300' : isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {DIVISION_ICONS[d.code] ?? <GraduationCap className="w-6 h-6" />}
                  </div>
                  <p className={`font-semibold text-sm ${!d.available ? 'text-gray-400' : isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {d.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Grades {d.grade_min}–{d.grade_max}
                  </p>
                  {!d.available && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-1.5 py-0.5">
                      Soon
                    </span>
                  )}
                  {isSelected && d.available && (
                    <Check className="absolute top-1.5 right-1.5 w-4 h-4 text-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Step 2: Course ───────────────────────────────────────────── */}
        <SectionCard
          step={2}
          title="Course"
          hint={
            courses.length === 0
              ? 'No courses available for this division yet.'
              : courses.length === 1
              ? 'Only one course available — selected for you.'
              : 'Pick a course for this division.'
          }
          locked={!selectedDivision || isHeatPreparation}
        >
          {loadingCourses ? (
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading courses…
            </div>
          ) : courses.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No course is linked to this division yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                const isAvailable = c.available !== false;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => isAvailable && setSelectedCourse(c)}
                    disabled={!isAvailable}
                    title={isAvailable ? undefined : 'Coming Soon — generators for this course are not yet implemented.'}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      !isAvailable
                        ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    {c.name}
                    {!isAvailable && (
                      <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-1.5 py-0.5">
                        Coming Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── Step 3: Topics & Concepts (tree) ─────────────────────────── */}
        <SectionCard
          step={3}
          title="Topics & Concepts"
          hint="Select one or more concepts. A single concept supports focused skill practice; add more for mixed review."
          locked={!selectedCourse || isHeatPreparation}
        >
          {loadingConcepts ? (
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading concept tree…
            </div>
          ) : unitTopics.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No topics seeded for this course yet.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">
                  <span className={enoughConcepts ? 'text-gray-700 font-medium' : 'text-amber-700 font-medium'}>
                    {selectedCount}
                  </span>{' '}
                  of {totalConcepts} concepts selected
                  {!enoughConcepts && (
                    <span className="ml-1 text-amber-700">
                      (select at least one concept)
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllConcepts}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-gray-300 text-xs">·</span>
                  <button
                    type="button"
                    onClick={clearAllConcepts}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {unitTopics.map((t) => (
                  <TopicTreeNode
                    key={t.id}
                    topic={t}
                    concepts={conceptsByTopic.get(t.id) ?? []}
                    expanded={expandedTopics.has(t.id)}
                    selectedConceptIds={selectedConceptIds}
                    onToggleExpand={() => toggleExpand(t.id)}
                    onToggleConcept={toggleConcept}
                    onToggleTopic={toggleTopic}
                  />
                ))}
              </div>
              <div className="mt-4">
                <ContentReadinessNotice
                  readiness={selectedContentReadiness}
                  selectedConceptCount={selectedCount}
                  missingAnnouncedSkillCount={missingAnnouncedSkillCount}
                  purpose={isHeatPreparation ? 'competition_preparation' : 'standalone_practice'}
                />
              </div>
            </>
          )}
        </SectionCard>

        {/* ── Step 4: Document Type ────────────────────────────────────── */}
        <SectionCard
          step={4}
          title="Document Type"
          hint={isHeatPreparation ? 'Competition preparation is always a student-safe Practice Review. Choose its length below.' : 'Choose the student-facing purpose and answer-key policy. Choose length below.'}
          locked={!enoughConcepts}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DOC_TYPES.map((d) => {
              const isSelected = docType === d.key;
              const isAvailable = !isHeatPreparation || d.key === 'review';
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => {
                    if (!isAvailable) return;
                    setDocType(d.key);
                    setQuestionCount(ASSESSMENT_FORMAT_CONFIGS[d.key].defaultQuestionCount);
                  }}
                  disabled={!isAvailable}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    !isAvailable ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60' : isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={isSelected ? 'text-indigo-600' : 'text-gray-400'}>{d.icon}</span>
                    <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                      {d.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">{d.desc}</p>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Step 5: Worksheet length ─────────────────────────────────── */}
        <SectionCard
          step={5}
          title="Worksheet Length"
          hint="Choose the number of questions. The plan below updates before you generate."
          locked={!enoughConcepts}
        >
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-950">{questionCount} questions</p>
                <p className="mt-0.5 text-xs text-indigo-800">
                  {worksheetPlan.multipleChoiceCount} multiple choice · {worksheetPlan.freeResponseCount} free response · {worksheetPlan.totalPoints} points
                </p>
              </div>
              <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-800">
                {getWorksheetLengthGuidance(questionCount)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[worksheetFormat.minQuestionCount, worksheetFormat.defaultQuestionCount, worksheetFormat.maxQuestionCount].map((count, index) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    questionCount === count
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-indigo-200 bg-white text-indigo-900 hover:border-indigo-400'
                  }`}
                >
                  <span className="block font-semibold">{count} questions</span>
                  <span className={`block text-[11px] ${questionCount === count ? 'text-indigo-100' : 'text-indigo-600'}`}>
                    {index === 0 ? 'Short' : index === 1 ? 'Suggested' : 'Extended'}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                <span>{worksheetFormat.minQuestionCount}</span>
                <span>Fine-tune question count</span>
                <span>{worksheetFormat.maxQuestionCount}</span>
              </div>
              <input
                type="range"
                min={worksheetFormat.minQuestionCount}
                max={worksheetFormat.maxQuestionCount}
                step={1}
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
                className="mt-2 w-full accent-indigo-600"
                aria-label="Worksheet question count"
              />
            </div>
            {!everyConceptCanAppear && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                Select at least {selectedCount} questions so each selected concept can appear at least once.
              </p>
            )}
            <p className="mt-3 text-xs text-gray-600">
              Print guidance only: review the browser print preview before distributing. Longer prompts or extra workspace may use more space.
            </p>
          </div>
        </SectionCard>

        {/* ── Step 6: Difficulty Profile ───────────────────────────────── */}
        <SectionCard
          step={6}
          title="Difficulty Profile"
          hint="Sets how hard the generated problems are."
          locked={!enoughConcepts}
        >
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTY_PROFILES.map((p) => {
              const isSelected = difficultyProfile === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setDifficultyProfile(p.key)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {p.label}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Step 7: Generate ─────────────────────────────────────────── */}
        <SectionCard
          step={7}
          title="Review and Generate"
          locked={!selectedDivision || !selectedCourse || !enoughConcepts || !everyConceptCanAppear}
        >
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4 space-y-2 text-sm">
            <SummaryRow label="Division" value={selectedDivision?.name ?? '—'} />
            <SummaryRow label="Course" value={selectedCourse?.name ?? '—'} />
            <SummaryRow
              label="Topics"
              value={
                selectedTopicSummary.length === 0
                  ? '—'
                  : selectedTopicSummary.map((t) => `${t.name} (${t.count})`).join(', ')
              }
            />
            <SummaryRow label="Concepts" value={`${selectedCount} selected`} />
            <SummaryRow label="Readiness" value={selectedContentReadiness.label} />
            <SummaryRow
              label="Document"
              value={DOC_TYPES.find((d) => d.key === docType)?.label ?? docType}
            />
            <SummaryRow
              label="Question plan"
              value={`${worksheetPlan.questionCount} questions · ${worksheetPlan.multipleChoiceCount} multiple choice · ${worksheetPlan.freeResponseCount} free response · ${worksheetPlan.totalPoints} points${everyConceptCanAppear ? '' : ' · increase length to cover all selected concepts'}`}
            />
            <SummaryRow
              label="Purpose"
              value={isHeatPreparation ? 'Competition preparation — same skills, new Heat questions' : 'Standalone practice'}
            />
            <SummaryRow
              label="Difficulty"
              value={DIFFICULTY_PROFILES.find((p) => p.key === difficultyProfile)?.label ?? difficultyProfile}
            />
          </div>

          {!competitionBriefingReady && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-relaxed text-amber-900">
              Generation is paused for this competition-preparation worksheet because the selected student briefing is incomplete. Add only manually approved curriculum labels; the system will not create or paraphrase them.
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(isHeatPreparation ? WORKSHEET_PREPARATION_RETURN_HREF : '/dashboard/teacher')}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
              disabled={generating}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                !canGenerate || generating
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-5 h-5" />
                  {isHeatPreparation ? 'Generate Preparation Worksheet' : 'Generate Practice Worksheet'}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SUB-COMPONENTS
// -----------------------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium w-20 flex-shrink-0 mt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-900 break-words flex-1">{value}</span>
    </div>
  );
}
