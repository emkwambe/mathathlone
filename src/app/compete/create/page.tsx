// =============================================================================
// MathAthlone — Create Heat Page (Heat Design Overhaul)
// =============================================================================
// Full redesign per the Heat Design Overhaul spec:
//
//   Step 1: Division          (auto-detected from teacher profile)
//   Step 2: Course             (filtered by grade_band, Coming-Soon badge)
//   Step 3: Topics & Concepts  (multi-select tree with indeterminate state)
//   Step 4: Heat Mode          (Competition: Sprint|Target|Practice|Champ
//                                 + Assessment: Quiz|Test)
//   Step 5: Question Profile   (Warm-Up | Standard | Challenge | Deep)
//   Step 6: Fine-tune          (count, duration, integrity)
//   Step 7: Review & Launch
//
// The mode drives FR/MC ratio + integrity defaults + leaderboard visibility
// (Assessment hides leaderboard, locks Focus Mode, gates results for Test).
// The profile drives 3-axis filtering in question-delivery.ts.
//
// Teacher's last selection persists to localStorage.
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
  Clock,
  Eye,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  Loader2,
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
import {
  createHeat,
  type HeatType,
  type IntegrityLevel,
  type QuestionProfile,
} from '@/lib/competition/heat-service';

// -----------------------------------------------------------------------------
// TYPES
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
  /** False → course exists but no generators are seeded yet ("Coming Soon"). */
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

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

const DIVISION_ICONS: Record<string, React.ReactNode> = {
  JR:  <GraduationCap className="w-6 h-6" />,
  INT: <GraduationCap className="w-6 h-6" />,
  ADV: <GraduationCap className="w-6 h-6" />,
  JV:  <GraduationCap className="w-6 h-6" />,
  SV:  <GraduationCap className="w-6 h-6" />,
};

// Division → eligible course grade_bands.
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

// Courses without seeded generators — surfaced as Coming Soon.
const COURSES_WITHOUT_GENERATORS = new Set<string>(['NCM2', 'ALG2', 'APPC']);

/**
 * Heat Mode — the unified picker that replaces the legacy heatType +
 * difficulty pair. Two categories:
 *   • COMPETITION — leaderboard visible, streak bonus active, instant results
 *   • ASSESSMENT  — gradeable, private results, no leaderboard/streak
 *
 * `default_count` and `default_minutes` populate the Step 6 sliders so the
 * teacher can fine-tune. `fr_ratio` / `mc_ratio` drive question-delivery.
 * `is_assessment` flips downstream gameplay/results behavior.
 */
type HeatModeMeta = {
  label: string;
  icon: React.ReactNode;
  default_count: number;
  default_minutes: number;
  desc: string;
  fr_ratio: number;
  mc_ratio: number;
  mc_visual_share: number;
  is_assessment: boolean;
  /** When non-null, the mode forces a specific integrity level. */
  locked_integrity: IntegrityLevel | null;
  category: 'competition' | 'assessment';
};

const HEAT_MODES: Record<HeatType, HeatModeMeta> = {
  // ── Competition modes ───────────────────────────────────────────────────
  sprint: {
    label: 'Sprint',  icon: <Flame className="w-5 h-5" />,
    default_count: 20, default_minutes: 15,
    desc: '15 min · 20 Q · fast-paced',
    fr_ratio: 0.4, mc_ratio: 0.6, mc_visual_share: 0.5,
    is_assessment: false, locked_integrity: null, category: 'competition',
  },
  target: {
    label: 'Target',  icon: <Target className="w-5 h-5" />,
    default_count: 10, default_minutes: 20,
    desc: '20 min · 10 Q · deeper problems',
    fr_ratio: 0.4, mc_ratio: 0.6, mc_visual_share: 0.5,
    is_assessment: false, locked_integrity: null, category: 'competition',
  },
  practice: {
    label: 'Practice', icon: <Clock className="w-5 h-5" />,
    default_count: 15, default_minutes: 30,
    desc: '30 min · 15 Q · no ranking',
    fr_ratio: 0.3, mc_ratio: 0.7, mc_visual_share: 0.5,
    is_assessment: false, locked_integrity: null, category: 'competition',
  },
  championship: {
    label: 'Championship', icon: <Trophy className="w-5 h-5" />,
    default_count: 25, default_minutes: 25,
    desc: '25 min · 25 Q · high stakes',
    fr_ratio: 0.5, mc_ratio: 0.5, mc_visual_share: 0.5,
    is_assessment: false, locked_integrity: null, category: 'competition',
  },
  // 'official' is kept for legacy data — not shown in the picker.
  official: {
    label: 'Official', icon: <Trophy className="w-5 h-5" />,
    default_count: 20, default_minutes: 20,
    desc: 'Standard official format',
    fr_ratio: 0.4, mc_ratio: 0.6, mc_visual_share: 0.5,
    is_assessment: false, locked_integrity: null, category: 'competition',
  },
  // ── Assessment modes ────────────────────────────────────────────────────
  quiz: {
    label: 'Quiz',    icon: <Clipboard className="w-5 h-5" />,
    default_count: 10, default_minutes: 20,
    desc: '20 min · 10 Q · gradeable',
    fr_ratio: 0.5, mc_ratio: 0.5, mc_visual_share: 0.5,
    is_assessment: true, locked_integrity: 'school', category: 'assessment',
  },
  test: {
    label: 'Test',    icon: <FileText className="w-5 h-5" />,
    default_count: 25, default_minutes: 45,
    desc: '45 min · 25 Q · formal',
    fr_ratio: 0.6, mc_ratio: 0.4, mc_visual_share: 0.5,
    is_assessment: true, locked_integrity: 'district', category: 'assessment',
  },
};

const COMPETITION_MODES: HeatType[] = ['sprint', 'target', 'practice', 'championship'];
const ASSESSMENT_MODES: HeatType[] = ['quiz', 'test'];

/**
 * Question Profile — 3-axis selection. Maps to existing DB tag values:
 *   warmup    → procedural + low
 *   standard  → application + medium
 *   challenge → reasoning   + medium
 *   deep      → reasoning   + high
 *
 * `depth_min` / `depth_max` are the fallback for NCM1 (NULL 3-axis tags).
 */
const QUESTION_PROFILES: Record<
  QuestionProfile,
  { label: string; emoji: string; cog: string; complex: string; ctx: string; tooltip: string; depth_min: number; depth_max: number }
> = {
  warmup: {
    label: 'Warm-Up', emoji: '🌱',
    cog: 'Recall', complex: 'Single-step', ctx: 'Abstract',
    tooltip: 'Quick recall — definitions, basic facts, single operations',
    depth_min: 1, depth_max: 2,
  },
  standard: {
    label: 'Standard', emoji: '📐',
    cog: 'Application', complex: 'Mixed steps', ctx: 'Mixed context',
    tooltip: 'Apply skills — straightforward problems, some context',
    depth_min: 2, depth_max: 3,
  },
  challenge: {
    label: 'Challenge', emoji: '⚡',
    cog: 'Analysis', complex: 'Multi-step', ctx: 'Mixed context',
    tooltip: 'Analyze — multi-step reasoning, non-routine problems',
    depth_min: 3, depth_max: 4,
  },
  deep: {
    label: 'Deep', emoji: '🔬',
    cog: 'Synthesis', complex: 'Multi-concept', ctx: 'Real-world',
    tooltip: 'Synthesize — combine concepts, authentic scenarios',
    depth_min: 4, depth_max: 4,
  },
};

const COMPETITION_INTEGRITY_LEVELS: Record<
  Extract<IntegrityLevel, 'practice' | 'school' | 'district'>,
  { label: string; icon: React.ReactNode; desc: string; config: IntegrityConfig }
> = {
  practice: {
    label: 'Practice', icon: <Shield className="w-5 h-5" />,
    desc: 'Classroom practice with light logging',
    config: { focus_mode_enabled: false, fullscreen_required: false, copy_paste_blocked: false, anomaly_detection: false, teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false },
  },
  school: {
    label: 'Classroom', icon: <ShieldCheck className="w-5 h-5" />,
    desc: 'Classroom with Focus Mode on',
    config: { focus_mode_enabled: true,  fullscreen_required: false, copy_paste_blocked: false, anomaly_detection: false, teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false },
  },
  district: {
    label: 'School',   icon: <ShieldAlert className="w-5 h-5" />,
    desc: 'School-wide with stricter monitoring',
    config: { focus_mode_enabled: true,  fullscreen_required: true,  copy_paste_blocked: true,  anomaly_detection: true,  teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false },
  },
};

// localStorage key for the teacher's last selection.
const LAST_SELECTION_KEY = 'mathathlone:createHeat:last';

interface LastSelection {
  divisionCode?: string;
  courseId?: string;
  mode?: HeatType;
  profile?: QuestionProfile;
  questionCount?: number;
  durationMinutes?: number;
}

function loadLastSelection(): LastSelection {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LAST_SELECTION_KEY);
    return raw ? (JSON.parse(raw) as LastSelection) : {};
  } catch {
    return {};
  }
}

function saveLastSelection(sel: LastSelection): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_SELECTION_KEY, JSON.stringify(sel));
  } catch {
    /* ignore quota errors */
  }
}

// -----------------------------------------------------------------------------
// HELPER COMPONENTS
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

// ── Topic / Concept tree ────────────────────────────────────────────────────

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
      {/* Topic header row */}
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
      {/* Concept list (expanded) */}
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

export default function CreateHeatPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: authLoading, isAuthenticated, hasRole } = useAuth();

  // Auth gate — only teachers/admins can create Heats.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login?next=/compete/create');
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

  // ── Heat config state ───────────────────────────────────────────────────
  const lastSel = useMemo(loadLastSelection, []);
  const [mode, setMode] = useState<HeatType>(lastSel.mode ?? 'sprint');
  const [questionProfile, setQuestionProfile] = useState<QuestionProfile>(
    lastSel.profile ?? 'standard'
  );
  const [integrityLevel, setIntegrityLevel] = useState<IntegrityLevel>(
    HEAT_MODES.sprint.locked_integrity ?? 'practice'
  );
  const [questionCount, setQuestionCount] = useState<number>(
    lastSel.questionCount ?? HEAT_MODES.sprint.default_count
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    lastSel.durationMinutes ?? HEAT_MODES.sprint.default_minutes
  );

  // ── UI state ────────────────────────────────────────────────────────────
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [creating, setCreating] = useState(false);
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

      // Auto-select: last-used (when still available) → teacher's grade
      // band → first available.
      const teacherGrade = profile?.grade_level ?? null;
      const last = rows.find((r) => r.code === lastSel.divisionCode && r.available) ?? null;
      const byGrade = teacherGrade
        ? rows.find((r) => r.available && teacherGrade >= r.grade_min && teacherGrade <= r.grade_max) ?? null
        : null;
      const firstAvail = rows.find((r) => r.available) ?? null;
      setSelectedDivision(last ?? byGrade ?? firstAvail);
      setLoadingCurriculum(false);
    }
    loadDivisions();
    return () => {
      cancelled = true;
    };
  }, [supabase, profile?.grade_level, lastSel.divisionCode]);

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

      // Auto-select: last-used (when still in list and available) → first available.
      const last = rows.find((c) => c.id === lastSel.courseId && c.available !== false) ?? null;
      const firstAvail = rows.find((c) => c.available !== false) ?? null;
      setSelectedCourse(last ?? firstAvail);
      setLoadingCourses(false);
    }
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [selectedDivision, supabase, lastSel.courseId]);

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
      // Default: SELECT ALL concepts so the teacher can launch quickly.
      setSelectedConceptIds(new Set(conceptRows.map((c) => c.id)));
      // Expand the first topic so the tree isn't a wall of collapsed cards.
      setExpandedTopics(topicRows.length > 0 ? new Set([topicRows[0]!.id]) : new Set());
      setLoadingConcepts(false);
    }
    loadTree();
    return () => {
      cancelled = true;
    };
  }, [selectedCourse, supabase]);

  // ── When mode changes, repopulate count/duration + locked integrity ─────
  useEffect(() => {
    const meta = HEAT_MODES[mode];
    setQuestionCount(meta.default_count);
    setDurationMinutes(meta.default_minutes);
    if (meta.locked_integrity) {
      setIntegrityLevel(meta.locked_integrity);
    }
  }, [mode]);

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
  const currentMode = HEAT_MODES[mode];
  const currentProfile = QUESTION_PROFILES[questionProfile];
  const totalConcepts = concepts.length;
  const selectedCount = selectedConceptIds.size;
  const minConcepts = 3;
  const enoughConcepts = selectedCount >= minConcepts;
  const integrityOptions = currentMode.locked_integrity
    ? [currentMode.locked_integrity as keyof typeof COMPETITION_INTEGRITY_LEVELS]
    : (['practice', 'school', 'district'] as Array<keyof typeof COMPETITION_INTEGRITY_LEVELS>);
  const currentIntegrityCfg = COMPETITION_INTEGRITY_LEVELS[
    integrityLevel as keyof typeof COMPETITION_INTEGRITY_LEVELS
  ];

  const stepsComplete =
    !!selectedDivision &&
    !!selectedCourse &&
    selectedCourse.available !== false &&
    enoughConcepts &&
    !!mode &&
    !!questionProfile &&
    questionCount >= 5 &&
    durationMinutes >= 5;

  // Selected-topic summary for the review card.
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

  // ── Create handler ──────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!selectedDivision || !selectedCourse) {
      setError('Pick a division and course before creating the Heat.');
      return;
    }
    if (!enoughConcepts) {
      setError(`Select at least ${minConcepts} concepts to create a Heat.`);
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const conceptIdsArr = Array.from(selectedConceptIds);
      const profileMeta = QUESTION_PROFILES[questionProfile];

      const heat = await createHeat(supabase, {
        division_id: selectedDivision.id,
        // unit_topic_id stays null when conceptIds is the multi-select path —
        // the question-delivery pipeline uses conceptIds when present.
        unit_topic_id: null,
        concept_ids: conceptIdsArr,
        depth_min: profileMeta.depth_min,
        depth_max: profileMeta.depth_max,
        question_profile: questionProfile,
        type: mode,
        is_assessment: currentMode.is_assessment,
        results_released: mode !== 'test',     // Test starts gated
        integrity_level: integrityLevel,
        question_count: questionCount,
        duration_seconds: durationMinutes * 60,
        school_id: profile?.school_id ?? null,
        scope: 'class',
        fr_ratio: currentMode.fr_ratio,
        mc_ratio: currentMode.mc_ratio,
        mc_visual_share: currentMode.mc_visual_share,
        requires_attestation: false,
        lockdown_required: false,
        synchronized_start_at: null,
      });

      // Persist the selection for next time.
      saveLastSelection({
        divisionCode: selectedDivision.code,
        courseId: selectedCourse.id,
        mode,
        profile: questionProfile,
        questionCount,
        durationMinutes,
      });

      // BUG 0 fix retained — 500ms wait before redirect so the heats row +
      // heat_questions inserts propagate to the read replica.
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/compete/${heat.code}`);
    } catch (err: any) {
      console.error('[CreateHeat] failed:', err);
      setError(err?.message ?? 'Failed to create Heat. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [
    selectedDivision,
    selectedCourse,
    enoughConcepts,
    selectedConceptIds,
    questionProfile,
    mode,
    currentMode,
    integrityLevel,
    questionCount,
    durationMinutes,
    profile?.school_id,
    supabase,
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
            <Flame className="w-8 h-8 text-amber-500" />
            Create a Heat
          </h1>
          <p className="text-gray-500 mt-1">
            Multi-select topics, pick a mode + question profile, fine-tune, launch.
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
        <SectionCard step={1} title="Choose a Division" hint="Mathletes compete within their division.">
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
          hint={`Select the concepts to draw from. Minimum ${minConcepts}.`}
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
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">
                  <span className={enoughConcepts ? 'text-gray-700 font-medium' : 'text-amber-700 font-medium'}>
                    {selectedCount}
                  </span>{' '}
                  of {totalConcepts} concepts selected
                  {!enoughConcepts && (
                    <span className="ml-1 text-amber-700">
                      (need at least {minConcepts})
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
              {/* Tree */}
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

        {/* ── Step 4: Heat Mode ────────────────────────────────────────── */}
        <SectionCard
          step={4}
          title="Heat Mode"
          hint="Competition modes show a leaderboard; Assessment modes hide it and show letter grades."
          locked={!enoughConcepts}
        >
          {/* Competition section */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Competition
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COMPETITION_MODES.map((key) => {
                const meta = HEAT_MODES[key];
                const isSelected = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`mx-auto mb-2 flex justify-center ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {meta.icon}
                    </div>
                    <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                      {meta.label}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{meta.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Assessment section */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <Clipboard className="w-3.5 h-3.5 text-sky-600" />
              Assessment
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ASSESSMENT_MODES.map((key) => {
                const meta = HEAT_MODES[key];
                const isSelected = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected ? 'border-sky-500 bg-sky-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={isSelected ? 'text-sky-600' : 'text-gray-400'}>{meta.icon}</span>
                      <span className={`font-semibold text-sm ${isSelected ? 'text-sky-900' : 'text-gray-700'}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">{meta.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      No leaderboard · grade card · Focus Mode {key === 'test' ? 'locked' : 'on'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </SectionCard>

        {/* ── Step 5: Question Profile ─────────────────────────────────── */}
        <SectionCard
          step={5}
          title="Question Profile"
          hint="Drives the 3-axis filter (cognitive demand × complexity × context)."
          locked={!enoughConcepts}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(QUESTION_PROFILES) as [QuestionProfile, typeof QUESTION_PROFILES[QuestionProfile]][]).map(([key, p]) => {
              const isSelected = questionProfile === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setQuestionProfile(key)}
                  title={p.tooltip}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {p.label}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{p.cog}</p>
                  <p className="text-[10px] text-gray-400">{p.complex}</p>
                  <p className="text-[10px] text-gray-400">{p.ctx}</p>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Step 6: Fine-tune ───────────────────────────────────────── */}
        <SectionCard
          step={6}
          title="Fine-Tune (optional)"
          hint="Override question count, duration, and integrity if needed."
          locked={!enoughConcepts}
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Questions (5–50)</label>
              <input
                type="number"
                min={5}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.min(50, Math.max(5, Number(e.target.value) || 5)))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (5–60 min)</label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.min(60, Math.max(5, Number(e.target.value) || 5)))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  min
                </span>
              </div>
            </div>
          </div>
          {/* Integrity (Competition only — Assessment is locked) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Integrity Level
              {currentMode.locked_integrity && (
                <span className="ml-2 text-[10px] uppercase tracking-wider text-gray-400">
                  · Locked by mode
                </span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {integrityOptions.map((key) => {
                const cfg = COMPETITION_INTEGRITY_LEVELS[key];
                const isSelected = integrityLevel === key;
                const isLocked = !!currentMode.locked_integrity;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => !isLocked && setIntegrityLevel(key)}
                    disabled={isLocked && !isSelected}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${isLocked && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className={isSelected ? 'text-indigo-600' : 'text-gray-400'}>{cfg.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                        {cfg.label}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{cfg.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </SectionCard>

        {/* ── Step 7: Review & Launch ─────────────────────────────────── */}
        <SectionCard step={7} title="Review &amp; Launch" locked={!stepsComplete}>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4 space-y-2 text-sm">
            <SummaryRow label="Division" value={selectedDivision?.name ?? '—'} />
            <SummaryRow label="Course" value={selectedCourse?.name ?? '—'} />
            <SummaryRow
              label="Topics"
              value={
                selectedTopicSummary.length === 0
                  ? '—'
                  : selectedTopicSummary
                      .map((t) => `${t.name} (${t.count})`)
                      .join(', ')
              }
            />
            <SummaryRow label="Concepts" value={`${selectedCount} selected`} />
            <SummaryRow
              label="Mode"
              value={`${currentMode.label} (${currentMode.category === 'assessment' ? 'Assessment' : 'Competition'})`}
            />
            <SummaryRow label="Profile" value={`${currentProfile.label} — ${currentProfile.cog} · ${currentProfile.complex} · ${currentProfile.ctx}`} />
            <SummaryRow label="Format" value={`${questionCount} Q · ${durationMinutes} min`} />
            <SummaryRow
              label="FR / MC"
              value={`${Math.round(currentMode.fr_ratio * 100)}% / ${Math.round(currentMode.mc_ratio * 100)}%`}
            />
            <SummaryRow
              label="Integrity"
              value={`${currentIntegrityCfg?.label ?? integrityLevel}${currentIntegrityCfg?.config.focus_mode_enabled ? ' · Focus Mode on' : ''}`}
            />
            {currentMode.is_assessment && (
              <SummaryRow
                label="Grading"
                value="A=90+  B=80+  C=70+  D=60+  F=<60"
              />
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!stepsComplete || creating}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                !stepsComplete || creating
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Heat…
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5" />
                  Create Heat
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
