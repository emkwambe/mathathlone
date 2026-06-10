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
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GENERATORS } from '@/lib/competition/generators';
import {
  assembleAssessment,
  type AssessmentType,
  type AssessmentDocument,
} from '@/lib/assessment/assembler';

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

const COURSES_WITHOUT_GENERATORS = new Set<string>(['NCM2', 'ALG2', 'APPC']);

// Document types — counts/ratios live in the assembler's CONFIGS; the desc
// here just summarizes them for the picker.
const DOC_TYPES: Array<{
  key: AssessmentType;
  label: string;
  icon: React.ReactNode;
  desc: string;
}> = [
  { key: 'review',   label: 'Practice Review', icon: <Clipboard className="w-5 h-5" />,      desc: '10 Q · 40% free response · practice' },
  { key: 'quiz',     label: 'Quiz',            icon: <FileText className="w-5 h-5" />,        desc: '12 Q · 40% free response · graded' },
  { key: 'homework', label: 'Homework',        icon: <PenLine className="w-5 h-5" />,         desc: '8 Q · 60% free response · take-home' },
  { key: 'test',     label: 'Unit Test',       icon: <ClipboardCheck className="w-5 h-5" />,  desc: '20 Q · 50% free response · formal' },
  { key: 'makeup',   label: 'Makeup Test',     icon: <ClipboardCheck className="w-5 h-5" />,  desc: '20 Q · 50% free response · alternate' },
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

const MIN_CONCEPTS = 3;

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
                  <span className="text-sm text-gray-700">{c.name}</span>
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

  // Auth gate — only teachers/admins can generate assessments.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login?next=/assessment/generate');
      return;
    }
    if (!hasRole(['teacher', 'school_admin', 'platform_admin'])) {
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
  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfileKey>('standard');

  // ── UI state ────────────────────────────────────────────────────────────
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load divisions ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadDivisions() {
      setLoadingCurriculum(true);
      const [divResult, dcResult] = await Promise.all([
        supabase
          .from('divisions')
          .select('id, name, code, grade_min, grade_max')
          .order('grade_min', { ascending: true }),
        supabase.from('division_curricula').select('division_id'),
      ]);
      if (cancelled) return;
      if (divResult.error) {
        setError(`Couldn't load divisions: ${divResult.error.message}`);
        setLoadingCurriculum(false);
        return;
      }
      const linked = new Set<string>((dcResult.data ?? []).map((r: any) => r.division_id));
      const rows: DivisionRow[] = (divResult.data ?? []).map((d: any) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        grade_min: d.grade_min,
        grade_max: d.grade_max,
        available:
          (DIVISION_GRADE_BANDS[d.code]?.length ?? 0) > 0
            || (DIVISION_COURSE_CODES[d.code]?.length ?? 0) > 0
            || linked.has(d.id),
      }));
      setDivisions(rows);

      const teacherGrade = profile?.grade_level ?? null;
      const byGrade = teacherGrade
        ? rows.find((r) => r.available && teacherGrade >= r.grade_min && teacherGrade <= r.grade_max) ?? null
        : null;
      const firstAvail = rows.find((r) => r.available) ?? null;
      setSelectedDivision(byGrade ?? firstAvail);
      setLoadingCurriculum(false);
    }
    loadDivisions();
    return () => {
      cancelled = true;
    };
  }, [supabase, profile?.grade_level]);

  // ── Load courses ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDivision) {
      setCourses([]);
      setSelectedCourse(null);
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

      const { data, error: cErr } = await query;
      if (cancelled) return;
      if (cErr) {
        setError(`Couldn't load courses: ${cErr.message}`);
        setCourses([]);
        setLoadingCourses(false);
        return;
      }
      const rows: CourseRow[] = (data ?? []).map((c: any) => ({
        ...(c as CourseRow),
        available: !COURSES_WITHOUT_GENERATORS.has(c.code),
      }));
      setCourses(rows);

      const firstAvail = rows.find((c) => c.available !== false) ?? null;
      setSelectedCourse(firstAvail);
      setLoadingCourses(false);
    }
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [selectedDivision, supabase]);

  // ── Load unit_topics + atomic_concepts for the selected course ─────────
  useEffect(() => {
    if (!selectedCourse) {
      setUnitTopics([]);
      setConcepts([]);
      setSelectedConceptIds(new Set());
      setExpandedTopics(new Set());
      return;
    }
    let cancelled = false;
    async function loadTree() {
      setLoadingConcepts(true);
      const courseId = selectedCourse!.id;
      const { data: topics, error: uErr } = await supabase
        .from('unit_topics')
        .select('id, name, code, display_order')
        .eq('course_id', courseId)
        .order('display_order', { ascending: true });
      if (cancelled) return;
      if (uErr) {
        setError(`Couldn't load unit topics: ${uErr.message}`);
        setUnitTopics([]);
        setConcepts([]);
        setLoadingConcepts(false);
        return;
      }
      const topicRows = (topics as UnitTopicRow[]) ?? [];
      setUnitTopics(topicRows);

      const topicIds = topicRows.map((t) => t.id);
      if (topicIds.length === 0) {
        setConcepts([]);
        setSelectedConceptIds(new Set());
        setExpandedTopics(new Set());
        setLoadingConcepts(false);
        return;
      }

      const { data: cs, error: cErr } = await supabase
        .from('atomic_concepts')
        .select('id, name, lesson_number, unit_topic_id')
        .in('unit_topic_id', topicIds)
        .order('lesson_number', { ascending: true });
      if (cancelled) return;
      if (cErr) {
        setError(`Couldn't load concepts: ${cErr.message}`);
        setConcepts([]);
        setLoadingConcepts(false);
        return;
      }
      const conceptRows = (cs as ConceptRow[]) ?? [];
      setConcepts(conceptRows);
      // Default: SELECT ALL concepts so the teacher can generate quickly.
      setSelectedConceptIds(new Set(conceptRows.map((c) => c.id)));
      setExpandedTopics(topicRows.length > 0 ? new Set([topicRows[0]!.id]) : new Set());
      setLoadingConcepts(false);
    }
    loadTree();
    return () => {
      cancelled = true;
    };
  }, [selectedCourse, supabase]);

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

  const canGenerate =
    !!selectedDivision &&
    !!selectedCourse &&
    selectedCourse.available !== false &&
    enoughConcepts &&
    !!docType &&
    !!difficultyProfile;

  // ── Generate handler ────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!selectedCourse || !enoughConcepts) {
      setError(`Select at least ${MIN_CONCEPTS} concepts to generate an assessment.`);
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const conceptIds = Array.from(selectedConceptIds);

      // Pull the active generators registered for the selected concepts.
      const { data: gens, error: genErr } = await supabase
        .from('question_generators')
        .select('generator_type, concept_id, is_active')
        .in('concept_id', conceptIds)
        .eq('is_active', true);

      if (genErr) {
        throw new Error(`Couldn't load question generators: ${genErr.message}`);
      }

      // Keep only generator types the code actually implements, deduped.
      const known = new Set(Object.keys(GENERATORS));
      const generatorTypes = Array.from(
        new Set(
          ((gens ?? []) as Array<{ generator_type: string }>)
            .map((g) => g.generator_type)
            .filter((t) => t && known.has(t))
        )
      );

      if (generatorTypes.length === 0) {
        setError(
          'No active question generators are available for the selected concepts. ' +
            'Try selecting more concepts or a different topic.'
        );
        setGenerating(false);
        return;
      }

      const difficulty =
        DIFFICULTY_PROFILES.find((p) => p.key === difficultyProfile)?.difficulty ?? 2;

      const doc: AssessmentDocument = assembleAssessment(
        generatorTypes,
        [difficulty],
        docType,
        selectedCourse.name,
        selectedTopicSummary.map((t) => t.name)
      );

      // Hand the document to the preview route via sessionStorage (too large
      // and structured to round-trip through a URL).
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
    supabase,
    difficultyProfile,
    docType,
    selectedTopicSummary,
    router,
  ]);

  // ── Loading / unauthorized states ───────────────────────────────────────
  if (authLoading || loadingCurriculum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 mx-auto animate-spin" />
          <p className="mt-4 text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-indigo-500" />
            Generate Assessment
          </h1>
          <p className="text-gray-500 mt-1">
            Build a printable take-home document — pick topics, a format, and a difficulty.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Something went wrong</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Step 1: Division ─────────────────────────────────────────── */}
        <SectionCard step={1} title="Choose a Division" hint="Assessments draw from a division's curriculum.">
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
          locked={!selectedDivision}
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
          hint={`Select the concepts to draw from. Minimum ${MIN_CONCEPTS}.`}
          locked={!selectedCourse}
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
                      (need at least {MIN_CONCEPTS})
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
            </>
          )}
        </SectionCard>

        {/* ── Step 4: Document Type ────────────────────────────────────── */}
        <SectionCard
          step={4}
          title="Document Type"
          hint="Sets the question count, free-response ratio, and points."
          locked={!enoughConcepts}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DOC_TYPES.map((d) => {
              const isSelected = docType === d.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDocType(d.key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
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

        {/* ── Step 5: Difficulty Profile ───────────────────────────────── */}
        <SectionCard
          step={5}
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

        {/* ── Step 6: Generate ─────────────────────────────────────────── */}
        <SectionCard step={6} title="Generate" locked={!canGenerate}>
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
            <SummaryRow
              label="Document"
              value={DOC_TYPES.find((d) => d.key === docType)?.label ?? docType}
            />
            <SummaryRow
              label="Difficulty"
              value={DIFFICULTY_PROFILES.find((p) => p.key === difficultyProfile)?.label ?? difficultyProfile}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
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
                  Generate Assessment
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
