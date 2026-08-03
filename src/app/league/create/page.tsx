// =============================================================================
// MathAthlone — /league/create
// =============================================================================
// Sprint 9: Added multi_course scope type — teacher can select 2+ courses for
// cross-grade / above-grade-level leagues.
// =============================================================================
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

type LevelValue    = 'classroom' | 'school' | 'district' | 'regional' | 'state' | 'national';
type FormatValue   = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
type LeagueType    = 'showdown' | 'campaign' | 'season';
type ScopeType     = 'course' | 'unit' | 'multi_course';

interface ContentScope {
  type:           ScopeType;
  // single course
  course_code?:   string;
  course_name?:   string;
  // single unit
  unit_code?:     string;
  unit_name?:     string;
  // multi-course
  courses?:       { course_code: string; course_name: string }[];
}

// ── Static data ───────────────────────────────────────────────────────────────

const LEAGUE_LEVELS: { value: LevelValue; label: string }[] = [
  { value: 'classroom', label: 'Classroom' },
  { value: 'school',    label: 'School-wide' },
  { value: 'district',  label: 'District' },
  { value: 'regional',  label: 'Regional' },
  { value: 'state',     label: 'State' },
  { value: 'national',  label: 'National' },
];

const LEVELS_WITHOUT_MAX: LevelValue[] = ['district', 'regional', 'state', 'national'];

const LEAGUE_TYPES: {
  value: LeagueType;
  label: string;
  icon: string;
  tagline: string;
  description: string;
  duration: string;
  heats: string;
}[] = [
  {
    value:       'showdown',
    label:       'Showdown',
    icon:        '⚡',
    tagline:     'One-day tournament',
    description: 'A single competitive session run in one class period. Perfect for test review days, end-of-unit celebrations, or Friday warm-ups.',
    duration:    '45–90 minutes',
    heats:       '3–5 rapid heats',
  },
  {
    value:       'campaign',
    label:       'Campaign',
    icon:        '🗓️',
    tagline:     'Unit-length league',
    description: 'A league that runs across a full unit — one heat per class period. ELO accumulates over 2–4 weeks, then a bracket is generated for the finale.',
    duration:    '2–4 weeks',
    heats:       '8–16 heats',
  },
  {
    value:       'season',
    label:       'Season',
    icon:        '🏆',
    tagline:     'Full-semester league',
    description: 'A semester-long league aligned to the full course. Each unit is a split. Championship brackets are generated at the end of the semester.',
    duration:    '12–18 weeks',
    heats:       '30–50 heats',
  },
];

const ALL_FORMATS: { value: FormatValue; label: string; description: string }[] = [
  {
    value:       'round_robin',
    label:       'Round Robin',
    description: 'Every athlete plays every other athlete. Best for small groups (4–16 mathletes).',
  },
  {
    value:       'single_elimination',
    label:       'Single Elimination',
    description: "One loss and you're out. Fast and dramatic — ideal for 16–64 mathletes.",
  },
  {
    value:       'double_elimination',
    label:       'Double Elimination',
    description: 'Two losses to be eliminated. Gives athletes a second chance. Best for 32–128 mathletes.',
  },
  {
    value:       'swiss',
    label:       'Swiss System',
    description: 'No eliminations — everyone plays every round, paired by similar record. Best for 32+ mathletes.',
  },
];

const LEVEL_FORMAT_CONFIG: Record<LevelValue, { allowed: FormatValue[]; recommended: FormatValue }> = {
  classroom: { allowed: ['round_robin', 'single_elimination'],                        recommended: 'round_robin' },
  school:    { allowed: ['single_elimination', 'swiss', 'double_elimination'],        recommended: 'single_elimination' },
  district:  { allowed: ['swiss', 'double_elimination'],                              recommended: 'swiss' },
  regional:  { allowed: ['double_elimination', 'single_elimination'],                 recommended: 'double_elimination' },
  state:     { allowed: ['single_elimination', 'double_elimination'],                 recommended: 'single_elimination' },
  national:  { allowed: ['single_elimination'],                                       recommended: 'single_elimination' },
};

const LEAGUE_TYPE_FORMAT_OVERRIDE: Partial<Record<LeagueType, FormatValue>> = {
  showdown: 'single_elimination',
  campaign: 'swiss',
  season:   'swiss',
};

const COURSES: { code: string; name: string; grade_band: string; units: { code: string; name: string }[] }[] = [
  {
    code: 'G6', name: 'NC Grade 6 Math', grade_band: 'Grade 6',
    units: [
      { code: 'G6.NS',  name: 'The Number System' },
      { code: 'G6.RP',  name: 'Ratios & Proportional Relationships' },
      { code: 'G6.EE',  name: 'Expressions & Equations' },
      { code: 'G6.G',   name: 'Geometry' },
      { code: 'G6.SP',  name: 'Statistics & Probability' },
    ],
  },
  {
    code: 'G7', name: 'NC Grade 7 Math', grade_band: 'Grade 7',
    units: [
      { code: 'G7.NS',  name: 'The Number System' },
      { code: 'G7.RP',  name: 'Ratios & Proportional Relationships' },
      { code: 'G7.EE',  name: 'Expressions & Equations' },
      { code: 'G7.GEO', name: 'Geometry' },
      { code: 'G7.SP',  name: 'Statistics & Probability' },
    ],
  },
  {
    code: 'G8', name: 'NC Grade 8 Math', grade_band: 'Grade 8',
    units: [
      { code: 'G8.NS',  name: 'The Number System' },
      { code: 'G8.EE',  name: 'Expressions & Equations' },
      { code: 'G8.F',   name: 'Functions' },
      { code: 'G8.G',   name: 'Geometry' },
      { code: 'G8.SP',  name: 'Statistics & Probability' },
    ],
  },
  {
    code: 'ALG1', name: 'Algebra 1', grade_band: 'Grades 8–9',
    units: [
      { code: 'ALG1.FND', name: 'Foundations of Algebra' },
      { code: 'ALG1.FLF', name: 'Functions & Linear Functions' },
      { code: 'ALG1.SYS', name: 'Systems of Equations' },
      { code: 'ALG1.EXP', name: 'Exponential Functions' },
      { code: 'ALG1.QUAD', name: 'Quadratic Functions' },
      { code: 'ALG1.STAT', name: 'Statistics' },
    ],
  },
  {
    code: 'NCM2', name: 'NC Math 2', grade_band: 'Grades 9–10',
    units: [
      { code: 'NCM2.REALNUMBER', name: 'Real Number System' },
      { code: 'NCM2.COMPLEXNUM', name: 'Complex Number System' },
      { code: 'NCM2.POLYNOMIAL', name: 'Polynomial & Rational Expressions' },
      { code: 'NCM2.CREATINGEQ', name: 'Creating Equations' },
      { code: 'NCM2.REASONINGW', name: 'Reasoning with Equations' },
      { code: 'NCM2.SIMILARITY', name: 'Similarity & Right Triangles' },
      { code: 'NCM2.CONGRUENCE', name: 'Congruence' },
      { code: 'NCM2.CIRCLES',    name: 'Circles' },
      { code: 'NCM2.PROBABILIT', name: 'Probability' },
    ],
  },
  {
    code: 'ALG2', name: 'Algebra 2', grade_band: 'Grades 10–11',
    units: [
      { code: 'ALG2.FUNCTIONST', name: 'Functions & Transformations' },
      { code: 'ALG2.QUADRATICF', name: 'Quadratic Functions (Advanced)' },
      { code: 'ALG2.POLYNOMIAL', name: 'Polynomial Functions' },
      { code: 'ALG2.RATIONALFU', name: 'Rational Functions' },
      { code: 'ALG2.EXPONENTIA', name: 'Exponential & Logarithmic Functions' },
      { code: 'ALG2.SEQUENCESS', name: 'Sequences & Series' },
      { code: 'ALG2.PROBABILIT', name: 'Probability & Statistics' },
      { code: 'ALG2.CONICSECTI', name: 'Conic Sections' },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateLeaguePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Form state
  const [leagueType,       setLeagueType]       = useState<LeagueType>('showdown');
  const [name,             setName]             = useState('');
  const [level,            setLevel]            = useState<LevelValue>('classroom');
  const [region,           setRegion]           = useState('');
  const [format,           setFormat]           = useState<FormatValue>('single_elimination');
  const [maxParticipants,  setMaxParticipants]  = useState<string>('');
  const [scopeType,        setScopeType]        = useState<ScopeType>('course');
  const [selectedCourse,   setSelectedCourse]   = useState<string>('G7');
  const [selectedUnit,     setSelectedUnit]     = useState<string>('');
  // Multi-course: set of selected course codes
  const [selectedCourses,  setSelectedCourses]  = useState<Set<string>>(new Set(['G7']));

  // Derived
  const showMaxParticipants = !LEVELS_WITHOUT_MAX.includes(level);
  const config              = LEVEL_FORMAT_CONFIG[level];
  const availableFormats    = ALL_FORMATS.filter((f) => config.allowed.includes(f.value));
  const currentCourse       = COURSES.find((c) => c.code === selectedCourse);
  const maxNum              = parseInt(maxParticipants, 10);
  const showRoundRobinWarn  = format === 'round_robin' && !isNaN(maxNum) && maxNum > 16;

  useEffect(() => {
    const override = LEAGUE_TYPE_FORMAT_OVERRIDE[leagueType];
    if (override && config.allowed.includes(override)) {
      setFormat(override);
    } else {
      setFormat(config.recommended);
    }
  }, [leagueType, level]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const override = LEAGUE_TYPE_FORMAT_OVERRIDE[leagueType];
    if (override && LEVEL_FORMAT_CONFIG[level].allowed.includes(override)) {
      setFormat(override);
    } else {
      setFormat(LEVEL_FORMAT_CONFIG[level].recommended);
    }
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedUnit('');
  }, [selectedCourse]);

  function toggleMultiCourse(code: string) {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size > 1) next.delete(code); // must keep at least one
      } else {
        next.add(code);
      }
      return next;
    });
  }

  function buildContentScope(): ContentScope | null {
    if (scopeType === 'course') {
      const c = COURSES.find((x) => x.code === selectedCourse);
      if (!c) return null;
      return { type: 'course', course_code: c.code, course_name: c.name };
    }
    if (scopeType === 'unit') {
      const c = COURSES.find((x) => x.code === selectedCourse);
      const u = c?.units.find((x) => x.code === selectedUnit);
      if (!c || !u) return null;
      return { type: 'unit', course_code: c.code, course_name: c.name, unit_code: u.code, unit_name: u.name };
    }
    if (scopeType === 'multi_course') {
      const courses = COURSES
        .filter((c) => selectedCourses.has(c.code))
        .map((c) => ({ course_code: c.code, course_name: c.name }));
      if (courses.length < 2) return null;
      return { type: 'multi_course', courses };
    }
    return null;
  }

  const isSubmitDisabled =
    loading ||
    !name.trim() ||
    (scopeType === 'unit' && !selectedUnit) ||
    (scopeType === 'multi_course' && selectedCourses.size < 2);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const contentScope = buildContentScope();

    try {
      const payload = {
        name:             name.trim(),
        level,
        region:           region.trim() || undefined,
        format,
        league_type:      leagueType,
        content_scope:    contentScope,
        max_participants: showMaxParticipants && maxParticipants ? parseInt(maxParticipants, 10) : undefined,
      };

      const res = await fetch('/api/league/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      const { leagueId } = await res.json();
      router.push(`/league/${leagueId}`);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Math<span className="text-amber-500">Athlone</span>
          </Link>
          <Link href="/dashboard/teacher" className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-1">🏟️ Create a League</h1>
          <p className="text-gray-500 text-sm">
            Set up a bracket competition with ELO ratings and championship points.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Step 1: League Type ─────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">
              <span className="text-violet-600 mr-2">1</span> What kind of league?
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {LEAGUE_TYPES.map((lt) => (
                <button
                  key={lt.value}
                  type="button"
                  onClick={() => setLeagueType(lt.value)}
                  className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                    leagueType === lt.value
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{lt.icon}</div>
                  <div className="font-bold text-gray-900 text-sm">{lt.label}</div>
                  <div className="text-xs text-violet-600 font-medium mb-1">{lt.tagline}</div>
                  <div className="text-xs text-gray-500 leading-snug">{lt.description}</div>
                  <div className="mt-3 space-y-0.5">
                    <div className="text-xs text-gray-400">⏱ {lt.duration}</div>
                    <div className="text-xs text-gray-400">🔥 {lt.heats}</div>
                  </div>
                  {leagueType === lt.value && (
                    <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ── Step 2: Content Scope ───────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">
              <span className="text-violet-600 mr-2">2</span> What content will this league cover?
            </h2>

            {/* Scope type toggle */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {([
                { value: 'course',       label: 'Full Course' },
                { value: 'unit',         label: 'Specific Unit' },
                { value: 'multi_course', label: 'Multi-Grade / Cross-Level' },
              ] as { value: ScopeType; label: string }[]).map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setScopeType(st.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    scopeType === st.value
                      ? 'bg-violet-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* ── Single course / unit picker ── */}
            {(scopeType === 'course' || scopeType === 'unit') && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {COURSES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.grade_band})
                      </option>
                    ))}
                  </select>
                </div>

                {scopeType === 'unit' && currentCourse && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Unit
                    </label>
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">— Select a unit —</option>
                      {currentCourse.units.map((u) => (
                        <option key={u.code} value={u.code}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* ── Multi-course picker ── */}
            {scopeType === 'multi_course' && (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  Select 2 or more courses. Heats will draw questions from all selected courses — ideal for above-grade-level students or district-wide competitions.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {COURSES.map((c) => {
                    const checked = selectedCourses.has(c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => toggleMultiCourse(c.code)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                          checked
                            ? 'border-violet-600 bg-violet-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                          checked ? 'border-violet-600 bg-violet-600' : 'border-gray-300'
                        }`}>
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.grade_band}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedCourses.size < 2 && (
                  <p className="mt-2 text-xs text-amber-600">Select at least 2 courses.</p>
                )}
              </div>
            )}

            {/* Scope summary */}
            <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              {scopeType === 'course' && selectedCourse && (
                <>Heats will draw questions from <strong>all units</strong> in {currentCourse?.name}.</>
              )}
              {scopeType === 'unit' && selectedUnit && (
                <>Heats will draw questions from <strong>{currentCourse?.units.find(u => u.code === selectedUnit)?.name}</strong> only.</>
              )}
              {scopeType === 'unit' && !selectedUnit && (
                <>Select a unit above to focus this league.</>
              )}
              {scopeType === 'multi_course' && selectedCourses.size >= 2 && (
                <>Heats will draw from <strong>{selectedCourses.size} courses</strong>: {
                  COURSES.filter(c => selectedCourses.has(c.code)).map(c => c.name).join(', ')
                }.</>
              )}
            </div>
          </section>

          {/* ── Step 3: League Details ──────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-800">
              <span className="text-violet-600 mr-2">3</span> League details
            </h2>

            {/* League Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="name">
                League Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Period 3 Ratios Showdown — Spring 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Level + Region */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="level">
                  Level
                </label>
                <select
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as LevelValue)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {LEAGUE_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="region">
                  Region / Label <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="region"
                  type="text"
                  placeholder="e.g. Charlotte EOG or Spring Split"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* District notice */}
            {level === 'district' && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <span className="text-blue-500 text-lg mt-0.5">🏫</span>
                <p className="text-sm text-blue-700 leading-snug">
                  <span className="font-semibold">District mode is enabled.</span>{' '}
                  Students from any school in your district can join this league using the join link.
                  Their school name will appear in the standings.
                </p>
              </div>
            )}

            {/* Format + Participants */}
            <div className={`grid gap-4 ${showMaxParticipants ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Bracket Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as FormatValue)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {availableFormats.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500 leading-snug">
                  {ALL_FORMATS.find((f) => f.value === format)?.description}
                </p>
              </div>

              {showMaxParticipants && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Number of Participants
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={256}
                    placeholder="e.g. 24"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Enter your actual class size. Brackets handle any number ≥ 4 using byes.
                  </p>
                </div>
              )}

              {!showMaxParticipants && (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
                  <p className="text-sm text-blue-700 leading-snug">
                    <span className="font-semibold">Participants are determined by advancement.</span>{' '}
                    At {LEAGUE_LEVELS.find(l => l.value === level)?.label} level, mathletes qualify
                    by advancing from lower-level leagues.
                  </p>
                </div>
              )}
            </div>

            {showRoundRobinWarn && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                <p className="text-sm text-amber-700 leading-snug">
                  <span className="font-semibold">Round Robin with {maxParticipants} players requires {
                    Math.floor(parseInt(maxParticipants) * (parseInt(maxParticipants) - 1) / 2)
                  } total matchups.</span>{' '}
                  This may be too many heats for a {leagueType === 'showdown' ? 'one-day session' : 'unit-length league'}.
                  Consider switching to <strong>Swiss System</strong> instead.
                </p>
              </div>
            )}
          </section>

          {/* ── Info box ────────────────────────────────────────────────────── */}
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-sm text-violet-700">
            <p className="font-semibold mb-1">What happens next?</p>
            <ul className="list-disc list-inside space-y-1 text-violet-600">
              <li>Your league dashboard opens immediately after creation.</li>
              <li>Share the league link with your students so they can see standings.</li>
              <li>ELO ratings update automatically after each Heat you run.</li>
              <li>Brackets are generated once enough athletes have competed.</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-8 py-3 bg-violet-700 text-white font-semibold rounded-lg hover:bg-violet-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create League'}
            </button>
            <Link href="/dashboard/teacher" className="text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </Link>
          </div>

        </form>
      </main>
    </div>
  );
}
