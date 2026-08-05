'use client';
// =============================================================================
// useHeatConfigState — Sprint 12
// =============================================================================
// Consolidates the ~15 useState hooks from /compete/create/page.tsx into a
// single useReducer. Cascading clears (Division → clears Course → clears
// Concepts) are handled here so the UI components stay declarative.
//
// Also handles:
//   • localStorage persistence (last-used selection)
//   • League prefill hydration from URL params (league_id + base64 scope)
//   • Mode-change side-effects (reset count/duration, lock integrity)
// =============================================================================

import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { HeatType, IntegrityLevel, QuestionProfile } from '@/lib/competition/heat-service';

// ─── Re-export types used by the UI ─────────────────────────────────────────

export interface DivisionRow {
  id: string;
  name: string;
  code: string;
  grade_min: number;
  grade_max: number;
  display_order?: number;
  available: boolean;
}

export interface CourseRow {
  id: string;
  name: string;
  code: string;
  available?: boolean;
}

export interface UnitTopicRow {
  id: string;
  name: string;
  code: string;
  display_order: number;
}

export interface ConceptRow {
  id: string;
  name: string;
  lesson_number: string;
  unit_topic_id: string;
}

export interface ContentScope {
  type: 'course' | 'unit' | 'multi_course';
  course_code?: string;
  course_name?: string;
  unit_code?: string;
  unit_name?: string;
  courses?: { course_code: string; course_name: string }[];
}

// ─── localStorage helpers ────────────────────────────────────────────────────

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

export function saveLastSelection(sel: LastSelection): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_SELECTION_KEY, JSON.stringify(sel));
  } catch { /* ignore quota errors */ }
}

// ─── Heat mode defaults ──────────────────────────────────────────────────────

export const MODE_DEFAULTS: Record<HeatType, { count: number; minutes: number; lockedIntegrity: IntegrityLevel | null }> = {
  sprint:       { count: 20, minutes: 15, lockedIntegrity: null },
  target:       { count: 10, minutes: 20, lockedIntegrity: null },
  practice:     { count: 15, minutes: 30, lockedIntegrity: null },
  championship: { count: 25, minutes: 25, lockedIntegrity: null },
  official:     { count: 20, minutes: 20, lockedIntegrity: null },
  quiz:         { count: 10, minutes: 20, lockedIntegrity: 'school' },
  test:         { count: 25, minutes: 45, lockedIntegrity: 'district' },
};

// ─── State shape ─────────────────────────────────────────────────────────────

export interface HeatConfigState {
  // Curriculum data (loaded async)
  divisions: DivisionRow[];
  courses: CourseRow[];
  unitTopics: UnitTopicRow[];
  concepts: ConceptRow[];

  // Selections
  selectedDivision: DivisionRow | null;       // The ranking division (grade cohort)
  selectedContentDivision: DivisionRow | null; // The content division (prior-grade warm-up; null = same as ranking)
  selectedCourse: CourseRow | null;
  selectedConceptIds: Set<string>;
  expandedTopics: Set<string>;

  // Heat config
  mode: HeatType;
  questionProfile: QuestionProfile;
  integrityLevel: IntegrityLevel;
  questionCount: number;
  durationMinutes: number;

  // League prefill
  leagueId: string | null;
  leagueScope: ContentScope | null;

  // UI
  loadingCurriculum: boolean;
  loadingCourses: boolean;
  loadingConcepts: boolean;
  creating: boolean;
  error: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export type HeatConfigAction =
  | { type: 'SET_DIVISIONS'; payload: DivisionRow[] }
  | { type: 'SET_COURSES'; payload: CourseRow[] }
  | { type: 'SET_TREE'; payload: { topics: UnitTopicRow[]; concepts: ConceptRow[] } }
  | { type: 'SELECT_DIVISION'; payload: DivisionRow | null }
  | { type: 'SELECT_CONTENT_DIVISION'; payload: DivisionRow | null }
  | { type: 'SELECT_COURSE'; payload: CourseRow | null }
  | { type: 'TOGGLE_CONCEPT'; payload: string }
  | { type: 'TOGGLE_TOPIC'; payload: { topicId: string; conceptIds: string[] } }
  | { type: 'TOGGLE_EXPAND'; payload: string }
  | { type: 'SELECT_ALL_CONCEPTS' }
  | { type: 'CLEAR_ALL_CONCEPTS' }
  | { type: 'SET_MODE'; payload: HeatType }
  | { type: 'SET_PROFILE'; payload: QuestionProfile }
  | { type: 'SET_INTEGRITY'; payload: IntegrityLevel }
  | { type: 'SET_QUESTION_COUNT'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_LEAGUE_PREFILL'; payload: { leagueId: string; scope: ContentScope | null } }
  | { type: 'SET_LOADING_CURRICULUM'; payload: boolean }
  | { type: 'SET_LOADING_COURSES'; payload: boolean }
  | { type: 'SET_LOADING_CONCEPTS'; payload: boolean }
  | { type: 'SET_CREATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: HeatConfigState, action: HeatConfigAction): HeatConfigState {
  switch (action.type) {
    case 'SET_DIVISIONS':
      return { ...state, divisions: action.payload, loadingCurriculum: false };

    case 'SET_COURSES':
      return { ...state, courses: action.payload, loadingCourses: false };

    case 'SET_TREE': {
      const allIds = new Set(action.payload.concepts.map((c) => c.id));
      const firstTopicId = action.payload.topics[0]?.id;
      return {
        ...state,
        unitTopics: action.payload.topics,
        concepts: action.payload.concepts,
        // Default: select all concepts so teacher can launch immediately.
        selectedConceptIds: allIds,
        // Expand only the first topic to avoid a wall of open cards.
        expandedTopics: firstTopicId ? new Set([firstTopicId]) : new Set(),
        loadingConcepts: false,
      };
    }

    case 'SELECT_DIVISION':
      // Cascade: changing ranking division clears course + concepts.
      // Also reset content division to null (same-as-ranking default).
      return {
        ...state,
        selectedDivision: action.payload,
        selectedContentDivision: null,
        selectedCourse: null,
        courses: [],
        unitTopics: [],
        concepts: [],
        selectedConceptIds: new Set(),
        expandedTopics: new Set(),
      };

    case 'SELECT_CONTENT_DIVISION':
      // Changing content division clears course + concepts (new curriculum).
      // Does NOT change the ranking division.
      return {
        ...state,
        selectedContentDivision: action.payload,
        selectedCourse: null,
        courses: [],
        unitTopics: [],
        concepts: [],
        selectedConceptIds: new Set(),
        expandedTopics: new Set(),
      };

    case 'SELECT_COURSE':
      // Cascade: changing course clears concepts.
      return {
        ...state,
        selectedCourse: action.payload,
        unitTopics: [],
        concepts: [],
        selectedConceptIds: new Set(),
        expandedTopics: new Set(),
      };

    case 'TOGGLE_CONCEPT': {
      const next = new Set(state.selectedConceptIds);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, selectedConceptIds: next };
    }

    case 'TOGGLE_TOPIC': {
      const { topicId, conceptIds } = action.payload;
      const next = new Set(state.selectedConceptIds);
      const allSelected = conceptIds.every((id) => next.has(id));
      if (allSelected) {
        for (const id of conceptIds) next.delete(id);
      } else {
        for (const id of conceptIds) next.add(id);
      }
      return { ...state, selectedConceptIds: next };
    }

    case 'TOGGLE_EXPAND': {
      const next = new Set(state.expandedTopics);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, expandedTopics: next };
    }

    case 'SELECT_ALL_CONCEPTS':
      return { ...state, selectedConceptIds: new Set(state.concepts.map((c) => c.id)) };

    case 'CLEAR_ALL_CONCEPTS':
      return { ...state, selectedConceptIds: new Set() };

    case 'SET_MODE': {
      const defaults = MODE_DEFAULTS[action.payload];
      return {
        ...state,
        mode: action.payload,
        questionCount: defaults.count,
        durationMinutes: defaults.minutes,
        integrityLevel: defaults.lockedIntegrity ?? state.integrityLevel,
      };
    }

    case 'SET_PROFILE':
      return { ...state, questionProfile: action.payload };

    case 'SET_INTEGRITY':
      return { ...state, integrityLevel: action.payload };

    case 'SET_QUESTION_COUNT':
      return { ...state, questionCount: action.payload };

    case 'SET_DURATION':
      return { ...state, durationMinutes: action.payload };

    case 'SET_LEAGUE_PREFILL':
      return { ...state, leagueId: action.payload.leagueId, leagueScope: action.payload.scope };

    case 'SET_LOADING_CURRICULUM':
      return { ...state, loadingCurriculum: action.payload };

    case 'SET_LOADING_COURSES':
      return { ...state, loadingCourses: action.payload };

    case 'SET_LOADING_CONCEPTS':
      return { ...state, loadingConcepts: action.payload };

    case 'SET_CREATING':
      return { ...state, creating: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

// ─── Initial state factory ────────────────────────────────────────────────────

function makeInitialState(lastSel: LastSelection): HeatConfigState {
  const initialMode: HeatType = lastSel.mode ?? 'sprint';
  const modeDefaults = MODE_DEFAULTS[initialMode];
  return {
    divisions: [],
    courses: [],
    unitTopics: [],
    concepts: [],
    selectedDivision: null,
    selectedContentDivision: null,
    selectedCourse: null,
    selectedConceptIds: new Set(),
    expandedTopics: new Set(),
    mode: initialMode,
    questionProfile: lastSel.profile ?? 'standard',
    integrityLevel: modeDefaults.lockedIntegrity ?? 'practice',
    questionCount: lastSel.questionCount ?? modeDefaults.count,
    durationMinutes: lastSel.durationMinutes ?? modeDefaults.minutes,
    leagueId: null,
    leagueScope: null,
    loadingCurriculum: true,
    loadingCourses: false,
    loadingConcepts: false,
    creating: false,
    error: null,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useHeatConfigState() {
  const lastSel = useMemo(loadLastSelection, []);
  const [state, dispatch] = useReducer(reducer, lastSel, makeInitialState);

  // ── Derived / memoized values ─────────────────────────────────────────────

  const conceptsByTopic = useMemo(() => {
    const map = new Map<string, ConceptRow[]>();
    for (const c of state.concepts) {
      const arr = map.get(c.unit_topic_id) ?? [];
      arr.push(c);
      map.set(c.unit_topic_id, arr);
    }
    return map;
  }, [state.concepts]);

  const selectedCount = state.selectedConceptIds.size;
  const totalConcepts = state.concepts.length;
  const MIN_CONCEPTS = 3;
  const enoughConcepts = selectedCount >= MIN_CONCEPTS;

  const stepsComplete =
    !!state.selectedDivision &&
    !!state.selectedCourse &&
    state.selectedCourse.available !== false &&
    enoughConcepts &&
    !!state.mode &&
    !!state.questionProfile &&
    state.questionCount >= 5 &&
    state.durationMinutes >= 5;

  const selectedTopicSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of state.concepts) {
      if (!state.selectedConceptIds.has(c.id)) continue;
      map.set(c.unit_topic_id, (map.get(c.unit_topic_id) ?? 0) + 1);
    }
    return state.unitTopics
      .filter((t) => (map.get(t.id) ?? 0) > 0)
      .map((t) => ({ name: t.name, count: map.get(t.id)! }));
  }, [state.concepts, state.selectedConceptIds, state.unitTopics]);

  // ── Stable action dispatchers ─────────────────────────────────────────────

  const selectDivision = useCallback(
    (d: DivisionRow | null) => dispatch({ type: 'SELECT_DIVISION', payload: d }),
    []
  );
  const selectContentDivision = useCallback(
    (d: DivisionRow | null) => dispatch({ type: 'SELECT_CONTENT_DIVISION', payload: d }),
    []
  );
  const selectCourse = useCallback(
    (c: CourseRow | null) => dispatch({ type: 'SELECT_COURSE', payload: c }),
    []
  );
  const toggleConcept = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_CONCEPT', payload: id }),
    []
  );
  const toggleTopic = useCallback(
    (topicId: string) => {
      const ids = (conceptsByTopic.get(topicId) ?? []).map((c) => c.id);
      dispatch({ type: 'TOGGLE_TOPIC', payload: { topicId, conceptIds: ids } });
    },
    [conceptsByTopic]
  );
  const toggleExpand = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_EXPAND', payload: id }),
    []
  );
  const selectAllConcepts = useCallback(
    () => dispatch({ type: 'SELECT_ALL_CONCEPTS' }),
    []
  );
  const clearAllConcepts = useCallback(
    () => dispatch({ type: 'CLEAR_ALL_CONCEPTS' }),
    []
  );
  const setMode = useCallback(
    (m: HeatType) => dispatch({ type: 'SET_MODE', payload: m }),
    []
  );
  const setProfile = useCallback(
    (p: QuestionProfile) => dispatch({ type: 'SET_PROFILE', payload: p }),
    []
  );
  const setIntegrity = useCallback(
    (l: IntegrityLevel) => dispatch({ type: 'SET_INTEGRITY', payload: l }),
    []
  );
  const setQuestionCount = useCallback(
    (n: number) => dispatch({ type: 'SET_QUESTION_COUNT', payload: n }),
    []
  );
  const setDuration = useCallback(
    (n: number) => dispatch({ type: 'SET_DURATION', payload: n }),
    []
  );

  // ── URL param hydration (league prefill) ──────────────────────────────────
  // Runs once on mount. Reads ?league_id and ?scope from the URL and stores
  // them in state so the ConfigForm can show the league lock banner.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const leagueId = params.get('league_id');
    if (!leagueId) return;
    let scope: ContentScope | null = null;
    const scopeParam = params.get('scope');
    if (scopeParam) {
      try {
        scope = JSON.parse(atob(scopeParam)) as ContentScope;
      } catch {
        // malformed scope — ignore
      }
    }
    dispatch({ type: 'SET_LEAGUE_PREFILL', payload: { leagueId, scope } });
  }, []);

  return {
    state,
    dispatch,
    // Derived
    conceptsByTopic,
    selectedCount,
    totalConcepts,
    MIN_CONCEPTS,
    enoughConcepts,
    stepsComplete,
    selectedTopicSummary,
    lastSel,
    // Stable dispatchers
    selectDivision,
    selectContentDivision,
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
  };
}
