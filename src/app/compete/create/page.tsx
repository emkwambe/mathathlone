// =============================================================================
// MathAthlone — Create Heat Page (Sprint 2)
// =============================================================================
// Division-first drill-down wizard. Calls heat-service.createHeat() which
// also generates and inserts heat_questions via question-delivery.
//
// Step 1: Division   (5 cards — divisions without a curriculum row are greyed)
// Step 2: Course     (auto-selected for MVP — only NC Math 1)
// Step 3: Unit Topic (8 topics + Mixed)
// Step 4: Difficulty (Bronze / Silver / Gold / Platinum)
// Step 5: Heat Type  (Sprint / Target / Practice / Championship)
// Step 6: Integrity  (Practice → National)
// Step 7: Summary    → Create Heat → redirect to /compete/[code]
// =============================================================================

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Flame,
  GraduationCap,
  Layers,
  Loader2,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserCheck,
  Video,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  createHeat,
  type HeatType,
  type IntegrityLevel,
} from '@/lib/competition/heat-service';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type DifficultyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface DivisionRow {
  id: string;
  name: string;
  code: string;
  grade_min: number;
  grade_max: number;
  available: boolean;     // derived from division_curricula
}

interface CourseRow {
  id: string;
  name: string;
  code: string;
}

interface UnitTopicRow {
  id: string;
  name: string;
  code: string;
  display_order: number;
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

// Division code → eligible course grade_bands. Replaces the legacy
// division_curricula JOIN (which only had NCM1 linked). Add new bands here
// as more courses get seeded.
const DIVISION_GRADE_BANDS: Record<string, string[]> = {
  JR:  [],                                  // Grades 3-4 — no courses yet
  INT: ['6'],                               // Grades 5-6
  ADV: ['7', '8'],                          // Grades 7-8
  JV:  ['8-9', '9-10'],                     // Grades 9-10
  SV:  ['10-11', '11-12'],                  // Grades 11-12
};

// Foundation is cross-division and keyed by course code rather than
// grade_band. The DB division code for Foundation may vary; covers the
// common shorthands.
const DIVISION_COURSE_CODES: Record<string, string[]> = {
  FOUND: ['MF'],
  F:     ['MF'],
};

const HEAT_TYPE_META: Record<HeatType, { label: string; icon: React.ReactNode; questions: number; minutes: number; desc: string }> = {
  sprint:       { label: 'Sprint',       icon: <Flame className="w-5 h-5" />,  questions: 20, minutes: 15, desc: '15 min · 20 questions · fast-paced' },
  target:       { label: 'Target',       icon: <Target className="w-5 h-5" />, questions: 10, minutes: 20, desc: '20 min · 10 questions · deeper problems' },
  practice:     { label: 'Practice',     icon: <Clock className="w-5 h-5" />,  questions: 15, minutes: 30, desc: '30 min · 15 questions · low pressure' },
  championship: { label: 'Championship', icon: <Trophy className="w-5 h-5" />, questions: 25, minutes: 25, desc: '25 min · 25 questions · high stakes' },
  official:     { label: 'Official',     icon: <Award className="w-5 h-5" />,  questions: 20, minutes: 20, desc: 'Standard official format' },
};

// Picker-visible heat types only. 'official' is internal (used by legacy data).
const HEAT_TYPE_OPTIONS: HeatType[] = ['sprint', 'target', 'practice', 'championship'];

/**
 * FR/MC mix per heat type, mirroring HEAT_PRESETS in question-service.ts.
 * Championship raises FR to 50% (harder Heat → stronger Content signal);
 * Practice lowers FR to 30% to ease cognitive load; Sprint + Target use the
 * standard 40/60 baseline. See docs/CTA_SCORING_FRAMEWORK.md.
 */
const HEAT_TYPE_MIX: Record<
  HeatType,
  { fr_ratio: number; mc_ratio: number; mc_visual_share: number }
> = {
  sprint:       { fr_ratio: 0.4, mc_ratio: 0.6, mc_visual_share: 0.5 },
  target:       { fr_ratio: 0.4, mc_ratio: 0.6, mc_visual_share: 0.5 },
  practice:     { fr_ratio: 0.3, mc_ratio: 0.7, mc_visual_share: 0.5 },
  championship: { fr_ratio: 0.5, mc_ratio: 0.5, mc_visual_share: 0.5 },
  official:     { fr_ratio: 0.4, mc_ratio: 0.6, mc_visual_share: 0.5 },
};

const DIFFICULTY_TIERS: Record<DifficultyTier, { label: string; depthMin: number; depthMax: number; pill: string; accent: string }> = {
  bronze:   { label: 'Bronze',   depthMin: 1, depthMax: 2, pill: 'text-amber-700 bg-amber-50 border-amber-200',   accent: 'text-amber-700 border-amber-400 bg-amber-50' },
  silver:   { label: 'Silver',   depthMin: 2, depthMax: 3, pill: 'text-slate-700 bg-slate-50 border-slate-200',    accent: 'text-slate-700 border-slate-400 bg-slate-50' },
  gold:     { label: 'Gold',     depthMin: 3, depthMax: 4, pill: 'text-yellow-700 bg-yellow-50 border-yellow-200', accent: 'text-yellow-700 border-yellow-400 bg-yellow-50' },
  platinum: { label: 'Platinum', depthMin: 4, depthMax: 4, pill: 'text-indigo-700 bg-indigo-50 border-indigo-200', accent: 'text-indigo-700 border-indigo-400 bg-indigo-50' },
};

const INTEGRITY_LEVELS: Record<IntegrityLevel, { label: string; icon: React.ReactNode; desc: string; config: IntegrityConfig }> = {
  practice: {
    label: 'Practice', icon: <Shield className="w-5 h-5" />,
    desc: 'Classroom practice with light logging',
    config: { focus_mode_enabled: false, fullscreen_required: false, copy_paste_blocked: false, anomaly_detection: false, teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false },
  },
  school: {
    label: 'School League', icon: <ShieldCheck className="w-5 h-5" />,
    desc: 'Internal school competition with Focus Mode',
    config: { focus_mode_enabled: true,  fullscreen_required: false, copy_paste_blocked: false, anomaly_detection: false, teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false },
  },
  district: {
    label: 'District League', icon: <ShieldAlert className="w-5 h-5" />,
    desc: 'District competition requiring review',
    config: { focus_mode_enabled: true,  fullscreen_required: true,  copy_paste_blocked: true,  anomaly_detection: true,  teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false },
  },
  regional: {
    label: 'Regional Qualifier', icon: <Eye className="w-5 h-5" />,
    desc: 'Regional competition with teacher attestation',
    config: { focus_mode_enabled: true,  fullscreen_required: true,  copy_paste_blocked: true,  anomaly_detection: true,  teacher_attestation_required: true,  lockdown_browser_required: false, recording_required: false, synchronized_start: true },
  },
  state: {
    label: 'State Championship', icon: <Lock className="w-5 h-5" />,
    desc: 'State competition with lockdown browser',
    config: { focus_mode_enabled: true,  fullscreen_required: true,  copy_paste_blocked: true,  anomaly_detection: true,  teacher_attestation_required: true,  lockdown_browser_required: true,  recording_required: false, synchronized_start: true },
  },
  national: {
    label: 'National Finals', icon: <Video className="w-5 h-5" />,
    desc: 'National competition with full proctoring',
    config: { focus_mode_enabled: true,  fullscreen_required: true,  copy_paste_blocked: true,  anomaly_detection: true,  teacher_attestation_required: true,  lockdown_browser_required: true,  recording_required: true,  synchronized_start: true },
  },
};

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

function IntegrityBadges({ config }: { config: IntegrityConfig }) {
  const badges = [
    { on: config.focus_mode_enabled,             label: 'Focus Mode',  icon: <Eye className="w-3 h-3" /> },
    { on: config.fullscreen_required,            label: 'Fullscreen',  icon: <Lock className="w-3 h-3" /> },
    { on: config.copy_paste_blocked,             label: 'Copy Block',  icon: <ShieldAlert className="w-3 h-3" /> },
    { on: config.anomaly_detection,              label: 'Anomaly',     icon: <ShieldAlert className="w-3 h-3" /> },
    { on: config.teacher_attestation_required,   label: 'Attestation', icon: <UserCheck className="w-3 h-3" /> },
    { on: config.lockdown_browser_required,      label: 'Lockdown',    icon: <Lock className="w-3 h-3" /> },
    { on: config.recording_required,             label: 'Recording',   icon: <Video className="w-3 h-3" /> },
  ];
  const active = badges.filter((b) => b.on);
  if (active.length === 0) {
    return <span className="text-xs text-gray-400 italic">No restrictions — trust-based</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map((b) => (
        <span
          key={b.label}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5"
        >
          {b.icon} {b.label}
        </span>
      ))}
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

  // Auth gate — only teachers, school_admins, and platform_admins can create
  // Heats. Redirect everyone else.
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

  const [selectedDivision, setSelectedDivision] = useState<DivisionRow | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [selectedUnitTopic, setSelectedUnitTopic] = useState<UnitTopicRow | 'mixed' | null>(null);

  // ── Heat config state ───────────────────────────────────────────────────
  const [difficulty, setDifficulty] = useState<DifficultyTier>('silver');
  const [heatType, setHeatType] = useState<HeatType>('sprint');
  const [integrityLevel, setIntegrityLevel] = useState<IntegrityLevel>('practice');
  const [questionCount, setQuestionCount] = useState<number>(HEAT_TYPE_META.sprint.questions);
  const [durationMinutes, setDurationMinutes] = useState<number>(HEAT_TYPE_META.sprint.minutes);

  // ── UI state ────────────────────────────────────────────────────────────
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingUnitTopics, setLoadingUnitTopics] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load divisions + availability ───────────────────────────────────────
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

      const availableIds = new Set<string>(
        (dcResult.data ?? []).map((row: any) => row.division_id)
      );

      const rows: DivisionRow[] = (divResult.data ?? []).map((d: any) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        grade_min: d.grade_min,
        grade_max: d.grade_max,
        available: availableIds.has(d.id),
      }));
      setDivisions(rows);

      // Default selection: JV if available, else first available, else first overall
      const defaultRow =
        rows.find((r) => r.code === 'JV' && r.available) ??
        rows.find((r) => r.available) ??
        null;
      if (defaultRow) setSelectedDivision(defaultRow);

      setLoadingCurriculum(false);
    }
    loadDivisions();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // ── Load courses for the selected division ──────────────────────────────
  useEffect(() => {
    if (!selectedDivision) {
      setCourses([]);
      setSelectedCourse(null);
      return;
    }
    let cancelled = false;
    async function loadCourses() {
      setLoadingCourses(true);
      // Query courses directly by grade_band (and explicit course codes for
      // cross-division pools like math_fundamentals). Replaces the legacy
      // division_curricula JOIN which only had NCM1 wired up.
      const divisionCode = selectedDivision!.code;
      const gradeBands  = DIVISION_GRADE_BANDS[divisionCode]  ?? [];
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
        query = query.or(
          `grade_band.in.(${gradeBands.join(',')}),code.in.(${courseCodes.join(',')})`
        );
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

      const rows = (data ?? []) as CourseRow[];

      setCourses(rows);
      // Auto-select if only one course
      setSelectedCourse(rows.length === 1 ? rows[0] : rows[0] ?? null);
      setLoadingCourses(false);
    }
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [selectedDivision, supabase]);

  // ── Load unit topics for the selected course ────────────────────────────
  useEffect(() => {
    if (!selectedCourse) {
      setUnitTopics([]);
      setSelectedUnitTopic(null);
      return;
    }
    let cancelled = false;
    async function loadUnits() {
      setLoadingUnitTopics(true);
      const courseId = selectedCourse!.id;
      const { data, error: uErr } = await supabase
        .from('unit_topics')
        .select('id, name, code, display_order')
        .eq('course_id', courseId)
        .order('display_order', { ascending: true });

      if (cancelled) return;

      if (uErr) {
        setError(`Couldn't load unit topics: ${uErr.message}`);
        setUnitTopics([]);
        setLoadingUnitTopics(false);
        return;
      }
      setUnitTopics((data as UnitTopicRow[]) ?? []);
      setSelectedUnitTopic('mixed');         // Default to Mixed for breadth
      setLoadingUnitTopics(false);
    }
    loadUnits();
    return () => {
      cancelled = true;
    };
  }, [selectedCourse, supabase]);

  // ── Keep questionCount/durationMinutes synced with the chosen preset ───
  useEffect(() => {
    const preset = HEAT_TYPE_META[heatType];
    setQuestionCount(preset.questions);
    setDurationMinutes(preset.minutes);
  }, [heatType]);

  // ── Derived state ───────────────────────────────────────────────────────
  const currentIntegrity = INTEGRITY_LEVELS[integrityLevel];
  const currentDifficulty = DIFFICULTY_TIERS[difficulty];
  const stepsComplete =
    !!selectedDivision && !!selectedCourse && !!selectedUnitTopic && !!difficulty &&
    !!heatType && !!integrityLevel && questionCount >= 5 && durationMinutes >= 5;

  // ── Create handler ──────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!selectedDivision || !selectedCourse || !selectedUnitTopic) {
      setError('Please complete every step before creating the Heat.');
      return;
    }

    setError(null);
    setCreating(true);

    try {
      const mix = HEAT_TYPE_MIX[heatType];
      const heat = await createHeat(supabase, {
        division_id: selectedDivision.id,
        unit_topic_id:
          selectedUnitTopic === 'mixed' ? null : selectedUnitTopic.id,
        depth_min: currentDifficulty.depthMin,
        depth_max: currentDifficulty.depthMax,
        type: heatType,
        integrity_level: integrityLevel,
        question_count: questionCount,
        duration_seconds: durationMinutes * 60,
        school_id: profile?.school_id ?? null,
        scope: 'class',
        // CTA framework mix — see HEAT_TYPE_MIX above.
        fr_ratio: mix.fr_ratio,
        mc_ratio: mix.mc_ratio,
        mc_visual_share: mix.mc_visual_share,
        requires_attestation: currentIntegrity.config.teacher_attestation_required,
        lockdown_required: currentIntegrity.config.lockdown_browser_required,
        synchronized_start_at: currentIntegrity.config.synchronized_start
          ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
          : null,
      });

      // BUG 0 fix: give Supabase a moment to fully commit the heats row +
      // heat_questions inserts and propagate to read replicas / refresh RLS
      // policies before we redirect. Without this short delay the lobby
      // page sometimes lands before the row is visible and falls into the
      // retry loop (or, before the retry loop existed, span forever).
      console.log('[CreateHeat] heat created — waiting 500ms before redirect', { code: heat.code });
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
    selectedUnitTopic,
    currentDifficulty,
    heatType,
    integrityLevel,
    questionCount,
    durationMinutes,
    profile?.school_id,
    currentIntegrity,
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
  if (!isAuthenticated) return null;          // redirect handled by effect

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
            Set up a new competition for your Mathletes — division-first, curriculum-aligned.
          </p>
        </div>

        {/* Error */}
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
        <SectionCard step={1} title="Choose a Division" hint="Mathletes compete within their division for fair grade-banded matchups.">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {divisions.map((d) => {
              const isSelected = selectedDivision?.id === d.id;
              const isAvailable = d.available;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => isAvailable && setSelectedDivision(d)}
                  disabled={!isAvailable}
                  className={`relative p-4 rounded-xl border-2 text-center transition-all ${
                    !isAvailable
                      ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`mx-auto mb-2 flex justify-center ${
                      !isAvailable
                        ? 'text-gray-300'
                        : isSelected
                        ? 'text-indigo-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {DIVISION_ICONS[d.code] ?? <GraduationCap className="w-6 h-6" />}
                  </div>
                  <p
                    className={`font-semibold text-sm ${
                      !isAvailable ? 'text-gray-400' : isSelected ? 'text-indigo-900' : 'text-gray-700'
                    }`}
                  >
                    {d.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Grades {d.grade_min}–{d.grade_max}
                  </p>
                  {!isAvailable && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-1.5 py-0.5">
                      Soon
                    </span>
                  )}
                  {isSelected && isAvailable && (
                    <Check className="absolute top-1.5 right-1.5 w-4 h-4 text-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Step 2: Course (auto-selected when 1) ────────────────────── */}
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
            <p className="text-sm text-gray-500 italic">
              No course is linked to this division yet. Pick a different division.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCourse(c)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── Step 3: Unit Topic ──────────────────────────────────────── */}
        <SectionCard
          step={3}
          title="Pick a Unit Topic"
          hint='Or choose "Mixed" to pull questions from every topic in the course.'
          locked={!selectedCourse}
        >
          {loadingUnitTopics ? (
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading topics…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {/* Mixed first */}
              <button
                type="button"
                onClick={() => setSelectedUnitTopic('mixed')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  selectedUnitTopic === 'mixed'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Mixed (all topics)
              </button>
              {unitTopics.map((t) => {
                const isSelected =
                  selectedUnitTopic !== 'mixed' && selectedUnitTopic?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedUnitTopic(t)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── Step 4: Difficulty ──────────────────────────────────────── */}
        <SectionCard step={4} title="Difficulty" hint="Sets the depth range for question generation." locked={!selectedUnitTopic}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(DIFFICULTY_TIERS) as [DifficultyTier, typeof DIFFICULTY_TIERS[DifficultyTier]][]).map(([key, tier]) => {
              const isSelected = difficulty === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDifficulty(key)}
                  className={`p-4 rounded-xl border-2 text-center font-semibold transition-all ${
                    isSelected ? `${tier.accent}` : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm">{tier.label}</p>
                  <p className="text-[11px] font-normal opacity-70 mt-0.5">
                    Depth {tier.depthMin}{tier.depthMin !== tier.depthMax ? `–${tier.depthMax}` : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Step 5: Heat Type ───────────────────────────────────────── */}
        <SectionCard step={5} title="Heat Type" hint="Each preset has a default question count and duration — tweak below." locked={!selectedUnitTopic}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {HEAT_TYPE_OPTIONS.map((key) => {
              const meta = HEAT_TYPE_META[key];
              const isSelected = heatType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHeatType(key)}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Questions (5–50)</label>
              <input
                type="number"
                min={5}
                max={50}
                value={questionCount}
                onChange={(e) =>
                  setQuestionCount(Math.min(50, Math.max(5, Number(e.target.value) || 5)))
                }
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
                  onChange={(e) =>
                    setDurationMinutes(Math.min(60, Math.max(5, Number(e.target.value) || 5)))
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  min
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Step 6: Integrity ───────────────────────────────────────── */}
        <SectionCard step={6} title="Integrity Level" hint="Higher stakes activate stricter monitoring." locked={!selectedUnitTopic}>
          <div className="space-y-2 mb-4">
            {(Object.entries(INTEGRITY_LEVELS) as [IntegrityLevel, typeof INTEGRITY_LEVELS[IntegrityLevel]][]).map(([key, level]) => {
              const isSelected = integrityLevel === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIntegrityLevel(key)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 text-left transition-all ${
                    isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={isSelected ? 'text-indigo-600' : 'text-gray-400'}>{level.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                      {level.label}
                    </p>
                    <p className="text-xs text-gray-400">{level.desc}</p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-400 mb-2 font-medium">What Mathletes will see:</p>
            <IntegrityBadges config={currentIntegrity.config} />
          </div>
        </SectionCard>

        {/* ── Step 7: Summary + Create ─────────────────────────────────── */}
        <SectionCard step={7} title="Review &amp; Launch">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <SummaryCell label="Division" value={selectedDivision?.name ?? '—'} />
            <SummaryCell label="Course" value={selectedCourse?.name ?? '—'} />
            <SummaryCell
              label="Unit Topic"
              value={
                selectedUnitTopic === 'mixed'
                  ? 'Mixed (all topics)'
                  : selectedUnitTopic?.name ?? '—'
              }
            />
            <SummaryCell label="Difficulty" value={`${DIFFICULTY_TIERS[difficulty].label} (depth ${currentDifficulty.depthMin}${currentDifficulty.depthMin !== currentDifficulty.depthMax ? `–${currentDifficulty.depthMax}` : ''})`} />
            <SummaryCell label="Type" value={HEAT_TYPE_META[heatType].label} />
            <SummaryCell label="Format" value={`${questionCount} Q · ${durationMinutes} min`} />
          </div>

          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 mb-6">
            <p className="text-xs text-indigo-700 mb-1 font-semibold">
              Integrity: {currentIntegrity.label}
            </p>
            <IntegrityBadges config={currentIntegrity.config} />
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
// SMALL HELPERS
// -----------------------------------------------------------------------------

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">{value}</p>
    </div>
  );
}
