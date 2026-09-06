'use client';
// =============================================================================
// MathAthlone — Create Heat Page  (Sprint 12 — Heat Config Builder)
// =============================================================================
// Replaces the old 7-step sequential wizard with a single-page split-pane
// layout:
//
//   LEFT  (2/3) — ConfigForm: all sections visible at once, no locking
//   RIGHT (1/3) — StickySummary: live-updating summary + Launch button
//
// All state is managed by useHeatConfigState (src/hooks/useHeatConfigState.ts)
// which uses a single useReducer with cascading clears. The createHeat API
// contract (CreateHeatParams) is unchanged.
//
// League pre-fill: if the page is opened with ?league_id=...&scope=... (from
// StartLeagueHeatButton), the hook hydrates those values and the ConfigForm
// shows a locked league banner.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Clock,
  Eye,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  Link as LinkIcon,
  Loader2,
  Lock,
  Minus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRouteLoadingFallback } from '@/components/auth/ProtectedRouteLoadingFallback';
import { ContentReadinessNotice } from '@/components/content/ContentReadinessNotice';
import { usePracticeGeneratorAvailability } from '@/hooks/usePracticeGeneratorAvailability';
import {
  getSelectedContentReadiness,
  hasCuratedAnnouncedSkill,
} from '@/lib/content/readiness';
import {
  createHeat,
  type HeatType,
  type IntegrityLevel,
  type QuestionProfile,
} from '@/lib/competition/heat-service';
import {
  useHeatConfigState,
  saveLastSelection,
  MODE_DEFAULTS,
  type DivisionRow,
  type CourseRow,
  type UnitTopicRow,
  type ConceptRow,
} from '@/hooks/useHeatConfigState';
import {
  clearWorksheetPreparationDraft,
  loadWorksheetPreparationDraft,
  saveWorksheetPreparationDraft,
  type WorksheetPreparationDraft,
} from '@/lib/assessment/preparation-draft';

// ─── Constants ────────────────────────────────────────────────────────────────

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
const CONFIG_REQUEST_TIMEOUT_MS = 10_000;

type TeacherClassRow = {
  id: string;
  name: string;
  grade_level: number;
  join_code: string;
  roster_count: number;
};

function withConfigTimeout<T>(request: PromiseLike<T>, operation: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`${operation} took too long. Check your connection and try again.`));
    }, CONFIG_REQUEST_TIMEOUT_MS);
    Promise.resolve(request).then(
      (result) => { window.clearTimeout(timeout); resolve(result); },
      (reason) => { window.clearTimeout(timeout); reject(reason); },
    );
  });
}

type HeatModeMeta = {
  label: string;
  icon: React.ReactNode;
  desc: string;
  fr_ratio: number;
  mc_ratio: number;
  mc_visual_share: number;
  is_assessment: boolean;
  locked_integrity: IntegrityLevel | null;
  category: 'competition' | 'assessment';
};

const HEAT_MODES: Record<HeatType, HeatModeMeta> = {
  sprint:       { label: 'Sprint',       icon: <Flame className="w-5 h-5" />,        desc: '15 min · 20 Q · fast-paced',        fr_ratio: 0.4, mc_ratio: 0.6, mc_visual_share: 0.5, is_assessment: false, locked_integrity: null,       category: 'competition' },
  target:       { label: 'Target',       icon: <Target className="w-5 h-5" />,       desc: '20 min · 10 Q · deeper problems',   fr_ratio: 0.4, mc_ratio: 0.6, mc_visual_share: 0.5, is_assessment: false, locked_integrity: null,       category: 'competition' },
  practice:     { label: 'Practice',     icon: <Clock className="w-5 h-5" />,        desc: '30 min · 15 Q · no ranking',        fr_ratio: 0.3, mc_ratio: 0.7, mc_visual_share: 0.5, is_assessment: false, locked_integrity: null,       category: 'competition' },
  championship: { label: 'Championship', icon: <Trophy className="w-5 h-5" />,       desc: '25 min · 25 Q · high stakes',       fr_ratio: 0.5, mc_ratio: 0.5, mc_visual_share: 0.5, is_assessment: false, locked_integrity: null,       category: 'competition' },
  official:     { label: 'Official',     icon: <Trophy className="w-5 h-5" />,       desc: 'Standard official format',          fr_ratio: 0.4, mc_ratio: 0.6, mc_visual_share: 0.5, is_assessment: false, locked_integrity: null,       category: 'competition' },
  quiz:         { label: 'Quiz',         icon: <Clipboard className="w-5 h-5" />,    desc: '20 min · 10 Q · gradeable',         fr_ratio: 0.5, mc_ratio: 0.5, mc_visual_share: 0.5, is_assessment: true,  locked_integrity: 'school',   category: 'assessment'  },
  test:         { label: 'Test',         icon: <FileText className="w-5 h-5" />,     desc: '45 min · 25 Q · formal',            fr_ratio: 0.6, mc_ratio: 0.4, mc_visual_share: 0.5, is_assessment: true,  locked_integrity: 'district', category: 'assessment'  },
};

const COMPETITION_MODES: HeatType[] = ['sprint', 'target', 'practice', 'championship'];
const ASSESSMENT_MODES: HeatType[]  = ['quiz', 'test'];

const QUESTION_PROFILES: Record<QuestionProfile, { label: string; emoji: string; cog: string; complex: string; ctx: string; tooltip: string; depth_min: number; depth_max: number }> = {
  warmup:    { label: 'Warm-Up',   emoji: '🌱', cog: 'Recall',       complex: 'Single-step',   ctx: 'Abstract',      tooltip: 'Quick recall — definitions, basic facts, single operations',          depth_min: 1, depth_max: 2 },
  standard:  { label: 'Standard',  emoji: '📐', cog: 'Application',  complex: 'Mixed steps',   ctx: 'Mixed context', tooltip: 'Apply skills — straightforward problems, some context',                depth_min: 2, depth_max: 3 },
  challenge: { label: 'Challenge', emoji: '⚡', cog: 'Analysis',     complex: 'Multi-step',    ctx: 'Mixed context', tooltip: 'Analyze — multi-step reasoning, non-routine problems',                 depth_min: 3, depth_max: 4 },
  deep:      { label: 'Deep',      emoji: '🔬', cog: 'Synthesis',    complex: 'Multi-concept', ctx: 'Real-world',    tooltip: 'Synthesize — combine concepts, authentic scenarios',                   depth_min: 4, depth_max: 4 },
};

interface IntegrityConfig {
  focus_mode_enabled: boolean;
  fullscreen_required: boolean;
  copy_paste_blocked: boolean;
  anomaly_detection: boolean;
  teacher_attestation_required: boolean;
  lockdown_browser_required: boolean;
  recording_required: boolean;
  synchronized_start: boolean;
}

const COMPETITION_INTEGRITY_LEVELS: Record<
  Extract<IntegrityLevel, 'practice' | 'school' | 'district'>,
  { label: string; icon: React.ReactNode; desc: string; config: IntegrityConfig }
> = {
  practice: { label: 'Practice',  icon: <Shield className="w-5 h-5" />,      desc: 'Classroom practice with light logging',      config: { focus_mode_enabled: false, fullscreen_required: false, copy_paste_blocked: false, anomaly_detection: false, teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false } },
  school:   { label: 'Classroom', icon: <ShieldCheck className="w-5 h-5" />, desc: 'Classroom with Focus Mode on',               config: { focus_mode_enabled: true,  fullscreen_required: false, copy_paste_blocked: false, anomaly_detection: false, teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false } },
  district: { label: 'School',    icon: <ShieldAlert className="w-5 h-5" />, desc: 'School-wide with stricter monitoring',       config: { focus_mode_enabled: true,  fullscreen_required: true,  copy_paste_blocked: true,  anomaly_detection: true,  teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfigSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className ?? ''}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">{title}</h2>
      {children}
    </div>
  );
}

interface TopicTreeNodeProps {
  topic: UnitTopicRow;
  concepts: ConceptRow[];
  expanded: boolean;
  selectedConceptIds: Set<string>;
  onToggleExpand: () => void;
  onToggleConcept: (id: string) => void;
  onToggleTopic: (id: string) => void;
  unavailableConceptIds: ReadonlySet<string>;
}

function TopicTreeNode({ topic, concepts, expanded, selectedConceptIds, onToggleExpand, onToggleConcept, onToggleTopic, unavailableConceptIds }: TopicTreeNodeProps) {
  const selectedInTopic = concepts.filter((c) => selectedConceptIds.has(c.id)).length;
  const allSelected = concepts.length > 0 && selectedInTopic === concepts.length;
  const someSelected = selectedInTopic > 0 && !allSelected;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
        <button type="button" onClick={onToggleExpand} className="p-1 rounded hover:bg-gray-200 text-gray-500" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
          <span
            role="checkbox"
            aria-checked={allSelected ? 'true' : someSelected ? 'mixed' : 'false'}
            onClick={(e) => { e.preventDefault(); onToggleTopic(topic.id); }}
            className={`inline-flex items-center justify-center w-4 h-4 rounded border ${allSelected ? 'bg-indigo-600 border-indigo-600 text-white' : someSelected ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-white border-gray-300'}`}
          >
            {allSelected && <Check className="w-3 h-3" />}
            {someSelected && <Minus className="w-3 h-3" />}
          </span>
          <span className="text-sm font-medium text-gray-800">{topic.name}</span>
        </label>
        <span className="text-xs text-gray-400">{selectedInTopic} / {concepts.length}</span>
      </div>
      {expanded && (
        <div className="px-3 py-2 space-y-1 bg-white">
          {concepts.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-1">No concepts in this topic yet.</p>
          ) : (
            concepts.map((c) => {
              const isUnavailable = selectedConceptIds.has(c.id) && unavailableConceptIds.has(c.id);
              return (
                <label key={c.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer select-none">
                  <input type="checkbox" checked={selectedConceptIds.has(c.id)} onChange={() => onToggleConcept(c.id)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="min-w-0 text-sm text-gray-700">
                    {hasCuratedAnnouncedSkill(c.announced_skill)
                      ? c.announced_skill
                      : c.name
                        ? `${c.lesson_number} — ${c.name}`
                        : c.lesson_number}
                    {hasCuratedAnnouncedSkill(c.announced_skill) && (
                      <span className="ml-2 text-[11px] text-slate-400">{c.lesson_number}</span>
                    )}
                    {isUnavailable && (
                      <span className="ml-2 text-[11px] font-medium text-red-600">Practice generator unavailable</span>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium w-20 flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-gray-900 break-words flex-1">{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CreateHeatPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: authLoading, isAuthenticated, hasRole } = useAuth();

  const {
    state,
    dispatch,
    conceptsByTopic,
    selectedCount,
    totalConcepts,
    MIN_CONCEPTS,
    enoughConcepts,
    stepsComplete,
    selectedTopicSummary,
    lastSel,
    selectDivision,
    selectCourse,
    toggleConcept,
    toggleTopic,
    toggleExpand,
    selectAllConcepts,
    clearAllConcepts,
    setMode,
    setProfile,
    setIntegrity,
    setQuestionCount,
    setDuration,
    selectContentDivision,
  } = useHeatConfigState();

  const {
    divisions, courses, unitTopics, concepts,
    selectedDivision, selectedContentDivision, selectedCourse, selectedConceptIds, expandedTopics,
    mode, questionProfile, integrityLevel, questionCount, durationMinutes,
    leagueId, leagueScope,
    loadingCurriculum, loadingCourses, loadingConcepts,
    creating, error,
  } = state;

  // The effective content division: if teacher chose a prior-grade division,
  // use that for course/concept loading; otherwise fall back to ranking division.
  const effectiveContentDivision = selectedContentDivision ?? selectedDivision;
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classLoadError, setClassLoadError] = useState<string | null>(null);
  const selectedClass = useMemo(
    () => teacherClasses.find((classroom) => classroom.id === selectedClassId) ?? null,
    [teacherClasses, selectedClassId],
  );
  const [worksheetReturnDraft, setWorksheetReturnDraft] = useState<WorksheetPreparationDraft | null>(null);
  const [worksheetReturnRestored, setWorksheetReturnRestored] = useState(false);

  // Read a preparation draft only when the worksheet preview explicitly sends a
  // teacher back to the Heat Builder. A normal Create Heat visit never reuses a
  // stale draft from a prior lesson.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('preparation') === 'return') {
      setWorksheetReturnDraft(loadWorksheetPreparationDraft());
    }
  }, []);

  // Restore the non-curriculum choices once the teacher's classes are loaded.
  // Curriculum IDs are restored by the data-loading effects below so cascading
  // clears remain governed by useHeatConfigState.
  useEffect(() => {
    if (!worksheetReturnDraft || worksheetReturnRestored || teacherClasses.length === 0) return;
    if (teacherClasses.some((classroom) => classroom.id === worksheetReturnDraft.classId)) {
      setSelectedClassId(worksheetReturnDraft.classId);
    }
    dispatch({ type: 'SET_MODE', payload: worksheetReturnDraft.mode });
    dispatch({ type: 'SET_PROFILE', payload: worksheetReturnDraft.questionProfile });
    dispatch({ type: 'SET_INTEGRITY', payload: worksheetReturnDraft.integrityLevel });
    dispatch({ type: 'SET_QUESTION_COUNT', payload: worksheetReturnDraft.questionCount });
    dispatch({ type: 'SET_DURATION', payload: worksheetReturnDraft.durationMinutes });
    setWorksheetReturnRestored(true);
  }, [worksheetReturnDraft, worksheetReturnRestored, teacherClasses, dispatch]);

  // ── Auth gate ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/auth/login?next=/compete/create'); return; }
    // Sprint 16C classroom Heats are owned by a teacher and bound to that
    // teacher's class roster. School/district event setup is introduced later.
    if (!hasRole(['teacher'])) { router.push('/403'); }
  }, [authLoading, isAuthenticated, hasRole, router]);

    // ── Load active classes ─────────────────────────────────────────────────
  // Classroom Heats are roster-scoped when a class is selected. The API derives
  // class visibility from the signed-in staff member after migration 048.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    async function loadClasses() {
      setLoadingClasses(true);
      setClassLoadError(null);
      try {
        const response = await fetch('/api/classes', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error ?? 'Could not load your classes.');
        const rows = (payload?.classes ?? []) as TeacherClassRow[];
        if (cancelled) return;
        setTeacherClasses(rows);
        setSelectedClassId((current) => current && rows.some((classroom) => classroom.id === current)
          ? current
          : rows[0]?.id ?? '');
      } catch (err: any) {
        if (!cancelled) {
          setTeacherClasses([]);
          setSelectedClassId('');
          setClassLoadError(err?.message ?? 'Could not load your classes.');
        }
      } finally {
        if (!cancelled) setLoadingClasses(false);
      }
    }
    void loadClasses();
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated]);

  // ── Load divisions ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadDivisions() {
      dispatch({ type: 'SET_LOADING_CURRICULUM', payload: true });
      try {
        // The division catalog is essential. The optional division_curricula
        // enrichment must never prevent teachers from opening the builder.
        const divResult = await withConfigTimeout(
          supabase.from('divisions').select('id, name, code, grade_min, grade_max, display_order').order('display_order', { ascending: true }),
          'Loading divisions',
        );
        if (cancelled) return;
        if (divResult.error) throw divResult.error;

        const rows: DivisionRow[] = (divResult.data ?? []).map((d: any) => ({
          id: d.id, name: d.name, code: d.code, grade_min: d.grade_min, grade_max: d.grade_max,
          display_order: d.display_order ?? 0,
          available: (DIVISION_GRADE_BANDS[d.code]?.length ?? 0) > 0 || (DIVISION_COURSE_CODES[d.code]?.length ?? 0) > 0,
        }));
        dispatch({ type: 'SET_DIVISIONS', payload: rows });
        const teacherGrade = profile?.grade_level ?? null;
        const restored = worksheetReturnDraft
          ? rows.find((row) => row.id === worksheetReturnDraft.rankingDivisionId && row.available) ?? null
          : null;
        const last = rows.find((r) => r.code === lastSel.divisionCode && r.available) ?? null;
        const byGrade = teacherGrade ? rows.find((r) => r.available && teacherGrade >= r.grade_min && teacherGrade <= r.grade_max) ?? null : null;
        const firstAvail = rows.find((r) => r.available) ?? null;
        selectDivision(restored ?? last ?? byGrade ?? firstAvail);

        // Custom curriculum links only refine availability after the core UI
        // is usable. A timeout or RLS issue here is non-fatal.
        void withConfigTimeout(
          supabase.from('division_curricula').select('division_id'),
          'Loading custom division curricula',
        ).then(({ data, error }) => {
          if (cancelled || error) return;
          const linked = new Set<string>((data ?? []).map((r: any) => r.division_id));
          if (linked.size === 0) return;
          dispatch({
            type: 'SET_DIVISIONS',
            payload: rows.map((division) => ({ ...division, available: division.available || linked.has(division.id) })),
          });
        }).catch((err) => {
          console.warn('[CreateHeat] optional division_curricula lookup skipped:', err);
        });
      } catch (err: any) {
        if (!cancelled) {
          dispatch({ type: 'SET_DIVISIONS', payload: [] });
          dispatch({ type: 'SET_ERROR', payload: err?.message ?? "Couldn't load divisions. Please try again." });
        }
      }
    }
    loadDivisions();
    return () => { cancelled = true; };
  }, [supabase, profile?.grade_level, lastSel.divisionCode, worksheetReturnDraft, dispatch, selectDivision]);

  // Restore a prior-grade content division after the ranking division is set.
  useEffect(() => {
    if (!worksheetReturnDraft?.contentDivisionId || !selectedDivision) return;
    const restoredContentDivision = divisions.find(
      (division) => division.id === worksheetReturnDraft.contentDivisionId,
    ) ?? null;
    if (restoredContentDivision && selectedContentDivision?.id !== restoredContentDivision.id) {
      selectContentDivision(restoredContentDivision);
    }
  }, [worksheetReturnDraft, selectedDivision, selectedContentDivision?.id, divisions, selectContentDivision]);

  // ── Load courses ──────────────────────────────────────────────────────────
  // Courses are loaded for the effectiveContentDivision (prior-grade if set,
  // otherwise the ranking division). This allows warm-up heats to show
  // prior-grade courses while the ranking division stays fixed.
  useEffect(() => {
    if (!effectiveContentDivision) { dispatch({ type: 'SET_COURSES', payload: [] }); selectCourse(null); return; }
    let cancelled = false;
    async function loadCourses() {
      dispatch({ type: 'SET_LOADING_COURSES', payload: true });
      const divisionCode = effectiveContentDivision!.code;
      const gradeBands = DIVISION_GRADE_BANDS[divisionCode] ?? [];
      const courseCodes = DIVISION_COURSE_CODES[divisionCode] ?? [];
      if (gradeBands.length === 0 && courseCodes.length === 0) { dispatch({ type: 'SET_COURSES', payload: [] }); selectCourse(null); return; }
      let query = supabase.from('courses').select('id, name, code').eq('is_active', true).order('display_order', { ascending: true });
      if (gradeBands.length > 0 && courseCodes.length > 0) { query = query.or(`grade_band.in.(${gradeBands.join(',')}),code.in.(${courseCodes.join(',')})`); }
      else if (gradeBands.length > 0) { query = query.in('grade_band', gradeBands); }
      else { query = query.in('code', courseCodes); }
      try {
        const { data, error: cErr } = await withConfigTimeout(query, 'Loading courses');
        if (cancelled) return;
        if (cErr) throw cErr;
        const rows: CourseRow[] = (data ?? []).map((c: any) => ({ ...c, available: !COURSES_WITHOUT_GENERATORS.has(c.code) }));
        dispatch({ type: 'SET_COURSES', payload: rows });
        const restored = worksheetReturnDraft
          ? rows.find((course) => course.id === worksheetReturnDraft.courseId && course.available !== false) ?? null
          : null;
        const last = rows.find((c) => c.id === lastSel.courseId && c.available !== false) ?? null;
        const firstAvail = rows.find((c) => c.available !== false) ?? null;
        selectCourse(restored ?? last ?? firstAvail);
      } catch (err: any) {
        if (!cancelled) {
          dispatch({ type: 'SET_COURSES', payload: [] });
          dispatch({ type: 'SET_ERROR', payload: err?.message ?? "Couldn't load courses. Please try again." });
        }
      }
    }
    loadCourses();
    return () => { cancelled = true; };
  }, [effectiveContentDivision, supabase, lastSel.courseId, worksheetReturnDraft, dispatch, selectCourse]);

  // ── Load concept tree ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCourse) { dispatch({ type: 'SET_TREE', payload: { topics: [], concepts: [] } }); return; }
    let cancelled = false;
    async function loadTree() {
      dispatch({ type: 'SET_LOADING_CONCEPTS', payload: true });
      try {
        const { data: topics, error: uErr } = await withConfigTimeout(
          supabase.from('unit_topics').select('id, name, code, display_order').eq('course_id', selectedCourse!.id).order('display_order', { ascending: true }),
          'Loading unit topics',
        );
        if (cancelled) return;
        if (uErr) throw uErr;
        const topicRows = (topics as UnitTopicRow[]) ?? [];
        const topicIds = topicRows.map((t) => t.id);
        if (topicIds.length === 0) { dispatch({ type: 'SET_TREE', payload: { topics: [], concepts: [] } }); return; }

        const { data: cs, error: cErr } = await withConfigTimeout(
          supabase.from('atomic_concepts').select('id, name, lesson_number, announced_skill, unit_topic_id').in('unit_topic_id', topicIds).order('lesson_number', { ascending: true }),
          'Loading concepts',
        );
        if (cancelled) return;
        if (cErr) throw cErr;
        const conceptRows = (cs as ConceptRow[]) ?? [];
        dispatch({ type: 'SET_TREE', payload: { topics: topicRows, concepts: conceptRows } });
        if (worksheetReturnDraft?.courseId === selectedCourse!.id) {
          dispatch({ type: 'SET_SELECTED_CONCEPTS', payload: worksheetReturnDraft.conceptIds });
        }
      } catch (err: any) {
        if (!cancelled) {
          dispatch({ type: 'SET_TREE', payload: { topics: [], concepts: [] } });
          dispatch({ type: 'SET_ERROR', payload: err?.message ?? "Couldn't load concepts. Please try again." });
        }
      }
    }
    loadTree();
    return () => { cancelled = true; };
  }, [selectedCourse, supabase, worksheetReturnDraft, dispatch]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentMode = HEAT_MODES[mode];
  const currentProfile = QUESTION_PROFILES[questionProfile];
  const integrityOptions = currentMode.locked_integrity
    ? [currentMode.locked_integrity as keyof typeof COMPETITION_INTEGRITY_LEVELS]
    : (['practice', 'school', 'district'] as Array<keyof typeof COMPETITION_INTEGRITY_LEVELS>);
  const currentIntegrityCfg = COMPETITION_INTEGRITY_LEVELS[integrityLevel as keyof typeof COMPETITION_INTEGRITY_LEVELS];
  const isIntegrityLocked = !!currentMode.locked_integrity;
  const selectedConcepts = useMemo(
    () => concepts.filter((concept) => selectedConceptIds.has(concept.id)),
    [concepts, selectedConceptIds],
  );
  const selectedConceptIdList = useMemo(
    () => selectedConcepts.map((concept) => concept.id),
    [selectedConcepts],
  );
  const practiceGeneratorAvailability = usePracticeGeneratorAvailability(
    selectedConceptIdList,
    isAuthenticated && selectedConceptIdList.length > 0,
  );
  const unavailableSelectedConcepts = useMemo(
    () => selectedConcepts.filter((concept) => practiceGeneratorAvailability.unavailableConceptIds.has(concept.id)),
    [selectedConcepts, practiceGeneratorAvailability.unavailableConceptIds],
  );
  const allSelectedConceptsHavePracticeGenerators =
    practiceGeneratorAvailability.status === 'ready' && unavailableSelectedConcepts.length === 0;
  const selectedContentReadiness = useMemo(
    () => getSelectedContentReadiness(selectedCourse?.code, selectedConcepts),
    [selectedCourse?.code, selectedConcepts],
  );
  const missingAnnouncedSkillCount = useMemo(
    () => selectedConcepts.filter((concept) => !hasCuratedAnnouncedSkill(concept.announced_skill)).length,
    [selectedConcepts],
  );

  // ── Practice worksheet handoff ───────────────────────────────────────────
  const handlePrepareWorksheet = useCallback(() => {
    if (!selectedClass) { dispatch({ type: 'SET_ERROR', payload: 'Choose one of your classes before preparing its worksheet.' }); return; }
    if (selectedClass.roster_count < 1) { dispatch({ type: 'SET_ERROR', payload: `Add at least one Mathlete to ${selectedClass.name} before preparing its worksheet.` }); return; }
    if (!selectedDivision || !selectedCourse || !enoughConcepts) {
      dispatch({ type: 'SET_ERROR', payload: `Select a division, course, and at least ${MIN_CONCEPTS} concepts before preparing a worksheet.` });
      return;
    }
    if (practiceGeneratorAvailability.status !== 'ready') {
      dispatch({ type: 'SET_ERROR', payload: 'Checking whether every selected concept has an implemented practice generator. Please wait before preparing a worksheet.' });
      return;
    }
    if (unavailableSelectedConcepts.length > 0) {
      dispatch({ type: 'SET_ERROR', payload: 'Remove each selected concept marked “Practice generator unavailable” before preparing a worksheet. The selection was not changed automatically.' });
      return;
    }
    saveWorksheetPreparationDraft({
      rankingDivisionId: selectedDivision.id,
      contentDivisionId: selectedContentDivision?.id ?? null,
      courseId: selectedCourse.id,
      conceptIds: Array.from(selectedConceptIds),
      mode,
      questionProfile,
      integrityLevel,
      questionCount,
      durationMinutes,
      classId: selectedClass.id,
    });
    router.push('/assessment/generate?preparation=heat');
  }, [selectedClass, selectedDivision, selectedContentDivision, selectedCourse, enoughConcepts, selectedConceptIds, mode, questionProfile, integrityLevel, questionCount, durationMinutes, practiceGeneratorAvailability.status, unavailableSelectedConcepts.length, router, dispatch, MIN_CONCEPTS]);

  // ── Create handler ────────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!selectedClass) { dispatch({ type: 'SET_ERROR', payload: 'Choose one of your classes before creating a classroom Heat.' }); return; }
    if (selectedClass.roster_count < 1) { dispatch({ type: 'SET_ERROR', payload: `Add at least one Mathlete to ${selectedClass.name} before creating its classroom Heat.` }); return; }
    if (!selectedDivision || !selectedCourse) { dispatch({ type: 'SET_ERROR', payload: 'Pick a division and course before creating the Heat.' }); return; }
    if (!enoughConcepts) { dispatch({ type: 'SET_ERROR', payload: `Select at least ${MIN_CONCEPTS} concepts to create a Heat.` }); return; }
    if (practiceGeneratorAvailability.status !== 'ready') { dispatch({ type: 'SET_ERROR', payload: 'Checking whether every selected concept has an implemented practice generator. Please wait before creating a Heat.' }); return; }
    if (unavailableSelectedConcepts.length > 0) { dispatch({ type: 'SET_ERROR', payload: 'Remove each selected concept marked “Practice generator unavailable” before creating a Heat. The selection was not changed automatically.' }); return; }
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_CREATING', payload: true });
    try {
      const conceptIdsArr = Array.from(selectedConceptIds);
      const profileMeta = QUESTION_PROFILES[questionProfile];
      const heat = await createHeat(supabase, {
        ranking_division_id: selectedDivision.id,
        // content_division_id: if a prior-grade division was chosen for warm-up,
        // use that; otherwise default to the ranking division (same-grade heat).
        content_division_id: selectedContentDivision?.id ?? selectedDivision.id,
        unit_topic_id: null,
        concept_ids: conceptIdsArr,
        depth_min: profileMeta.depth_min,
        depth_max: profileMeta.depth_max,
        question_profile: questionProfile,
        type: mode,
        is_assessment: currentMode.is_assessment,
        results_released: mode !== 'test',
        integrity_level: integrityLevel,
        question_count: questionCount,
        duration_seconds: durationMinutes * 60,
        school_id: profile?.school_id ?? null,
        class_id: selectedClass.id,
        scope: 'class',
        fr_ratio: currentMode.fr_ratio,
        mc_ratio: currentMode.mc_ratio,
        mc_visual_share: currentMode.mc_visual_share,
        requires_attestation: false,
        lockdown_required: false,
        synchronized_start_at: null,
      });
      saveLastSelection({ divisionCode: selectedDivision.code, courseId: selectedCourse.id, mode, profile: questionProfile, questionCount, durationMinutes });
      clearWorksheetPreparationDraft();
      await new Promise((r) => setTimeout(r, 500));
      try {
        const initRes = await fetch(`/api/heat/${heat.id}/init`, { method: 'POST' });
        if (!initRes.ok) { const body = await initRes.json().catch(() => ({})); console.warn('[CreateHeat] CF init non-fatal:', body); }
      } catch (initErr) { console.warn('[CreateHeat] CF init error (non-fatal):', initErr); }
      router.push(`/compete/${heat.code}`);
    } catch (err: any) {
      console.error('[CreateHeat] failed:', err);
      dispatch({ type: 'SET_ERROR', payload: err?.message ?? 'Failed to create Heat. Please try again.' });
    } finally {
      dispatch({ type: 'SET_CREATING', payload: false });
    }
  }, [selectedClass, selectedDivision, selectedCourse, enoughConcepts, selectedConceptIds, questionProfile, mode, currentMode, integrityLevel, questionCount, durationMinutes, profile?.school_id, practiceGeneratorAvailability.status, unavailableSelectedConcepts.length, supabase, router, dispatch, MIN_CONCEPTS]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (authLoading || loadingCurriculum) {
    return <ProtectedRouteLoadingFallback loginHref="/auth/login?next=/compete/create" title="Loading Heat Builder" />;
  }
  if (!isAuthenticated) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <a href="/dashboard/teacher" className="hover:text-indigo-600 transition-colors">Dashboard</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">Create a Heat</span>
        </nav>

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Flame className="w-8 h-8 text-amber-500" />
              Create a Heat
            </h1>
            <p className="text-gray-500 mt-1">Configure every setting at once, then launch.</p>
          </div>
          {/* League banner */}
          {leagueId && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
              <LinkIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">League Heat</span>
              {leagueScope && (
                <span className="text-emerald-600">
                  · {leagueScope.type === 'course' && leagueScope.course_name}
                  {leagueScope.type === 'unit' && `${leagueScope.course_name} — ${leagueScope.unit_name}`}
                  {leagueScope.type === 'multi_course' && leagueScope.courses?.map((c) => c.course_name).join(', ')}
                </span>
              )}
              <Lock className="w-3.5 h-3.5 text-emerald-500 ml-1" />
            </div>
          )}
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

        {/* ── Split-pane layout ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT: Config Form (2/3) ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Section A: Audience & Content */}
            <ConfigSection title="Audience &amp; Content">
              {/* Classroom roster */}
              <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-sky-950">Classroom roster</p>
                    <p className="mt-1 text-xs leading-5 text-sky-800">Choose the class that will take this Heat. Only Mathletes actively rostered in that class can join with the Heat link or code.</p>
                  </div>
                  <a href="/dashboard/teacher/classes" className="text-xs font-semibold text-sky-800 underline decoration-sky-300 underline-offset-2 hover:text-sky-950">Manage classes &amp; roster</a>
                </div>
                {loadingClasses ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-sky-700"><Loader2 className="h-4 w-4 animate-spin" /> Loading your classes…</p>
                ) : classLoadError ? (
                  <p className="mt-3 text-sm text-red-700">{classLoadError}</p>
                ) : teacherClasses.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Create a class and add its roster before creating a classroom Heat.</p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {teacherClasses.map((classroom) => {
                      const selected = classroom.id === selectedClassId;
                      return (
                        <button key={classroom.id} type="button" onClick={() => setSelectedClassId(classroom.id)} className={`rounded-lg border p-3 text-left transition ${selected ? 'border-sky-500 bg-white ring-1 ring-sky-300' : 'border-sky-200 bg-white/70 hover:border-sky-400'}`}>
                          <div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">{classroom.name}</span>{selected && <Check className="h-4 w-4 shrink-0 text-sky-700" />}</div>
                          <p className="mt-1 text-xs text-slate-600">Grade {classroom.grade_level} · {classroom.roster_count} active Mathlete{classroom.roster_count === 1 ? '' : 's'}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Division */}
              <p className="text-xs text-gray-400 mb-3">Division — Mathletes compete within their division.</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {divisions.map((d) => {
                  const isSelected = selectedDivision?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => d.available && selectDivision(d)}
                      disabled={!d.available}
                      className={`relative p-4 rounded-xl border-2 text-center transition-all ${!d.available ? 'border-gray-100 bg-gray-50 cursor-not-allowed' : isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <div className={`mx-auto mb-2 flex justify-center ${!d.available ? 'text-gray-300' : isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                        {DIVISION_ICONS[d.code] ?? <GraduationCap className="w-6 h-6" />}
                      </div>
                      <p className={`font-semibold text-sm ${!d.available ? 'text-gray-400' : isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{d.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Grades {d.grade_min}–{d.grade_max}</p>
                      {!d.available && <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-1.5 py-0.5">Soon</span>}
                      {isSelected && d.available && <Check className="absolute top-1.5 right-1.5 w-4 h-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Prior-Grade Warm-Up Selector */}
              {/* Only shown when a ranking division is selected and there is a
                  lower available division to choose from. */}
              {selectedDivision && (() => {
                const lowerDivisions = divisions.filter(
                  (d) => d.available && (d.display_order ?? 0) < (selectedDivision.display_order ?? 0)
                );
                if (lowerDivisions.length === 0) return null;
                const isWarmUp = !!selectedContentDivision;
                return (
                  <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Prior-Grade Warm-Up</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Draw questions from a lower division. Results still count toward{' '}
                          <strong>{selectedDivision.name}</strong> standings.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectContentDivision(isWarmUp ? null : lowerDivisions[lowerDivisions.length - 1])}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                          isWarmUp
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {isWarmUp ? 'Warm-Up On' : 'Enable Warm-Up'}
                      </button>
                    </div>
                    {isWarmUp && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {lowerDivisions.map((d) => {
                          const isContentSelected = selectedContentDivision?.id === d.id;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => selectContentDivision(d)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                                isContentSelected
                                  ? 'border-blue-500 bg-blue-600 text-white'
                                  : 'border-blue-200 bg-white text-blue-700 hover:border-blue-400'
                              }`}
                            >
                              {isContentSelected && <Check className="w-3 h-3" />}
                              {d.name} (Gr {d.grade_min}–{d.grade_max})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Course */}
              <p className="text-xs text-gray-400 mb-3">Course</p>
              {loadingCourses ? (
                <div className="text-sm text-gray-400 flex items-center gap-2 mb-6"><Loader2 className="w-4 h-4 animate-spin" /> Loading courses…</div>
              ) : courses.length === 0 ? (
                <p className="text-sm text-gray-500 italic mb-6">{selectedDivision ? 'No course is linked to this division yet.' : 'Select a division first.'}</p>
              ) : (
                <div className="flex flex-wrap gap-2 mb-6">
                  {courses.map((c) => {
                    const isSelected = selectedCourse?.id === c.id;
                    const isAvailable = c.available !== false;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => isAvailable && selectCourse(c)}
                        disabled={!isAvailable}
                        title={isAvailable ? undefined : 'Coming Soon — generators for this course are not yet implemented.'}
                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${!isAvailable ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed' : isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                      >
                        <BookOpen className="w-4 h-4" />
                        {c.name}
                        {!isAvailable && <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-1.5 py-0.5">Coming Soon</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedCourse && (
                <div className="mb-5">
                  <ContentReadinessNotice
                    readiness={selectedContentReadiness}
                    selectedConceptCount={selectedCount}
                    missingAnnouncedSkillCount={missingAnnouncedSkillCount}
                    purpose="competition_preparation"
                  />
                  {practiceGeneratorAvailability.status === 'loading' && (
                    <p className="mt-3 text-xs text-slate-500">Checking implemented practice generators for the selected concepts…</p>
                  )}
                  {practiceGeneratorAvailability.status === 'error' && (
                    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                      {practiceGeneratorAvailability.error} Do not prepare a worksheet or launch a Heat until availability can be verified.
                    </p>
                  )}
                  {unavailableSelectedConcepts.length > 0 && (
                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                      {unavailableSelectedConcepts.length === 1
                        ? `Remove “${unavailableSelectedConcepts[0]?.name}” before preparing a worksheet or launching a Heat. It has no active implemented practice generator.`
                        : `Remove the ${unavailableSelectedConcepts.length} selected concepts marked “Practice generator unavailable” before preparing a worksheet or launching a Heat. They have no active implemented practice generators.`}
                      {' '}The selection has not been changed automatically.
                    </p>
                  )}
                </div>
              )}

              {/* Topics & Concepts */}
              <p className="text-xs text-gray-400 mb-3">Topics &amp; Concepts — select the concepts to draw from (min {MIN_CONCEPTS}).</p>
              {loadingConcepts ? (
                <div className="text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading concept tree…</div>
              ) : !selectedCourse ? (
                <p className="text-sm text-gray-400 italic">Select a course to see the concept tree.</p>
              ) : unitTopics.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No topics seeded for this course yet.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500">
                      <span className={enoughConcepts ? 'text-gray-700 font-medium' : 'text-amber-700 font-medium'}>{selectedCount}</span>
                      {' '}of {totalConcepts} concepts selected
                      {!enoughConcepts && <span className="ml-1 text-amber-700">(need at least {MIN_CONCEPTS})</span>}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={selectAllConcepts} className="text-xs text-indigo-600 hover:underline">Select all</button>
                      <span className="text-gray-300 text-xs">·</span>
                      <button type="button" onClick={clearAllConcepts} className="text-xs text-gray-500 hover:underline">Clear</button>
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
                        unavailableConceptIds={practiceGeneratorAvailability.unavailableConceptIds}
                      />
                    ))}
                  </div>
                </>
              )}
            </ConfigSection>

            {/* Section B: Competition Format */}
            <ConfigSection title="Competition Format">
              {/* Heat Mode */}
              <p className="text-xs text-gray-400 mb-3">Heat Mode — Competition modes show a leaderboard; Assessment modes hide it and show letter grades.</p>
              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> Competition
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {COMPETITION_MODES.map((key) => {
                    const meta = HEAT_MODES[key];
                    const isSelected = mode === key;
                    return (
                      <button key={key} type="button" onClick={() => setMode(key)} className={`p-4 rounded-xl border-2 text-center transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <div className={`mx-auto mb-2 flex justify-center ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>{meta.icon}</div>
                        <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{meta.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{meta.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-500" /> Assessment
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ASSESSMENT_MODES.map((key) => {
                    const meta = HEAT_MODES[key];
                    const isSelected = mode === key;
                    return (
                      <button key={key} type="button" onClick={() => setMode(key)} className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={isSelected ? 'text-indigo-600' : 'text-gray-400'}>{meta.icon}</span>
                          <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{meta.label}</p>
                        </div>
                        <p className="text-[11px] text-gray-400">{meta.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Profile */}
              <p className="text-xs text-gray-400 mb-3 mt-5">Question Profile — controls cognitive level and complexity of questions.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {(Object.entries(QUESTION_PROFILES) as [QuestionProfile, typeof QUESTION_PROFILES[QuestionProfile]][]).map(([key, p]) => {
                  const isSelected = questionProfile === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setProfile(key)}
                      title={p.tooltip}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <p className="text-2xl mb-1">{p.emoji}</p>
                      <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{p.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.cog} · {p.complex}</p>
                    </button>
                  );
                })}
              </div>

              {/* Fine-tune: count + duration */}
              <p className="text-xs text-gray-400 mb-3">Fine-tune</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Questions</label>
                    <span className="text-sm font-semibold text-indigo-700 tabular-nums">{questionCount}</span>
                  </div>
                  <input type="range" min={5} max={40} step={1} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full accent-indigo-600" />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>5</span><span>40</span></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Duration</label>
                    <span className="text-sm font-semibold text-indigo-700 tabular-nums">{durationMinutes} min</span>
                  </div>
                  <input type="range" min={5} max={90} step={5} value={durationMinutes} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-indigo-600" />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>5 min</span><span>90 min</span></div>
                </div>
              </div>
            </ConfigSection>

            {/* Section C: Rules & Integrity */}
            <ConfigSection title="Rules &amp; Integrity">
              <p className="text-xs text-gray-400 mb-3">
                {isIntegrityLocked
                  ? `Integrity level is locked to "${COMPETITION_INTEGRITY_LEVELS[integrityLevel as keyof typeof COMPETITION_INTEGRITY_LEVELS]?.label ?? integrityLevel}" for this mode.`
                  : 'Choose how strictly the heat is monitored.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {integrityOptions.map((key) => {
                  const cfg = COMPETITION_INTEGRITY_LEVELS[key];
                  const isSelected = integrityLevel === key;
                  const isLocked = isIntegrityLocked && !isSelected;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => !isLocked && setIntegrity(key)}
                      disabled={isLocked}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'} ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span className={isSelected ? 'text-indigo-600' : 'text-gray-400'}>{cfg.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{cfg.label}</p>
                        <p className="text-[10px] text-gray-400 truncate">{cfg.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ConfigSection>

          </div>{/* end LEFT */}

          {/* ── RIGHT: Sticky Summary (1/3) ────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">

              {/* Summary card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Heat Summary</h2>
                <div className="space-y-2">
                  <SummaryRow
                    label="Content"
                    value={
                      selectedContentDivision
                        ? `${selectedContentDivision.name} (Warm-Up ↑)`
                        : selectedDivision?.name ?? '—'
                    }
                  />
                  <SummaryRow
                    label="Classroom"
                    value={selectedClass ? `${selectedClass.name} · ${selectedClass.roster_count} rostered` : 'Choose a class'}
                  />
                  <SummaryRow
                    label="Ranks toward"
                    value={selectedDivision?.name ? `${selectedDivision.name} standings` : '—'}
                  />
                  <SummaryRow label="Course"   value={selectedCourse?.name ?? '—'} />
                  <SummaryRow
                    label="Topics"
                    value={selectedTopicSummary.length === 0 ? '—' : selectedTopicSummary.map((t) => `${t.name} (${t.count})`).join(', ')}
                  />
                  <SummaryRow label="Concepts" value={`${selectedCount} selected`} />
                  <SummaryRow label="Mode"     value={`${currentMode.label} (${currentMode.category === 'assessment' ? 'Assessment' : 'Competition'})`} />
                  <SummaryRow label="Profile"  value={`${currentProfile.label} — ${currentProfile.cog} · ${currentProfile.complex}`} />
                  <SummaryRow label="Format"   value={`${questionCount} Q · ${durationMinutes} min`} />
                  <SummaryRow label="FR / MC"  value={`${Math.round(currentMode.fr_ratio * 100)}% / ${Math.round(currentMode.mc_ratio * 100)}%`} />
                  <SummaryRow label="Integrity" value={`${currentIntegrityCfg?.label ?? integrityLevel}${currentIntegrityCfg?.config.focus_mode_enabled ? ' · Focus Mode on' : ''}`} />
                  {currentMode.is_assessment && <SummaryRow label="Grading" value="A=90+  B=80+  C=70+  D=60+  F=<60" />}
                  {leagueId && <SummaryRow label="League" value="Linked ✓" />}
                </div>
              </div>

              {/* Readiness indicator */}
              {(!stepsComplete || !selectedClass || selectedClass.roster_count < 1 || !allSelectedConceptsHavePracticeGenerators) && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 space-y-1">
                  {(!selectedClass || selectedClass.roster_count < 1) && <p>· Choose a class with at least one rostered Mathlete</p>}
                  {!selectedDivision && <p>· Select a division</p>}
                  {selectedDivision && !selectedCourse && <p>· Select a course</p>}
                  {selectedCourse && !enoughConcepts && <p>· Select at least {MIN_CONCEPTS} concepts</p>}
                  {selectedConcepts.length > 0 && practiceGeneratorAvailability.status === 'loading' && <p>· Wait for practice-generator coverage to be checked</p>}
                  {selectedConcepts.length > 0 && practiceGeneratorAvailability.status === 'error' && <p>· Restore practice-generator coverage before continuing</p>}
                  {unavailableSelectedConcepts.length > 0 && <p>· Remove every concept marked “Practice generator unavailable”</p>}
                </div>
              )}

              {/* Preparation action — the later Heat generates fresh items from the same selected skills. */}
              <button
                type="button"
                onClick={handlePrepareWorksheet}
                disabled={!stepsComplete || !selectedClass || selectedClass.roster_count < 1 || !allSelectedConceptsHavePracticeGenerators || creating}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm transition-all ${!stepsComplete || !selectedClass || selectedClass.roster_count < 1 || !allSelectedConceptsHavePracticeGenerators || creating ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98]'}`}
              >
                <FileText className="w-4 h-4" />
                Prepare Practice Worksheet
              </button>
              <p className="px-1 text-[11px] leading-snug text-gray-500">
                Students will see these topics and concepts; the Heat will use new generated question instances.
              </p>

              {/* Launch button */}
              <button
                type="button"
                onClick={handleCreate}
                disabled={!stepsComplete || !selectedClass || selectedClass.roster_count < 1 || !allSelectedConceptsHavePracticeGenerators || creating}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white text-base transition-all ${!stepsComplete || !selectedClass || selectedClass.roster_count < 1 || !allSelectedConceptsHavePracticeGenerators || creating ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-200'}`}
              >
                {creating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creating Heat…</>
                ) : (
                  <><Flame className="w-5 h-5" /> Launch Heat <ChevronRight className="w-5 h-5" /></>
                )}
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={() => {
                  clearWorksheetPreparationDraft();
                  router.push('/dashboard/teacher');
                }}
                disabled={creating}
                className="w-full px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all text-sm"
              >
                Cancel
              </button>

            </div>
          </div>{/* end RIGHT */}

        </div>{/* end split-pane */}
      </div>
    </div>
  );
}
