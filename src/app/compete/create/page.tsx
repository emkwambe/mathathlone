// ============================================================
// MathAthlone — Create Heat Page (Schema-Corrected)
// src/app/compete/create/page.tsx
// Maps to actual heats table columns
// © Mpingo Systems LLC
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Flame, Clock, Target, Trophy, Shield, ShieldCheck, ShieldAlert,
  Lock, Eye, Video, UserCheck, AlertTriangle, Check, ChevronRight,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

interface Topic {
  id: string;
  name: string;
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

type HeatPreset = 'sprint' | 'target' | 'practice' | 'championship';
type IntegrityLevel = 'practice' | 'school' | 'district' | 'regional' | 'state' | 'national';
type DifficultyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// ────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────

const HEAT_PRESETS: Record<HeatPreset, { label: string; icon: React.ReactNode; questions: number; minutes: number; desc: string }> = {
  sprint:       { label: 'Sprint',       icon: <Flame className="w-5 h-5" />,  questions: 20, minutes: 15, desc: '15 min · 20 questions' },
  target:       { label: 'Target',       icon: <Target className="w-5 h-5" />, questions: 10, minutes: 20, desc: '20 min · 10 questions' },
  practice:     { label: 'Practice',     icon: <Clock className="w-5 h-5" />,  questions: 15, minutes: 30, desc: '30 min · 15 questions' },
  championship: { label: 'Championship', icon: <Trophy className="w-5 h-5" />, questions: 25, minutes: 25, desc: '25 min · 25 questions' },
};

const DIFFICULTY_TIERS: Record<DifficultyTier, { label: string; depthMin: number; depthMax: number; color: string }> = {
  bronze:   { label: 'Bronze',   depthMin: 1, depthMax: 2, color: 'text-amber-700 bg-amber-100 border-amber-300' },
  silver:   { label: 'Silver',   depthMin: 2, depthMax: 3, color: 'text-gray-600 bg-gray-100 border-gray-300' },
  gold:     { label: 'Gold',     depthMin: 3, depthMax: 4, color: 'text-yellow-700 bg-yellow-100 border-yellow-300' },
  platinum: { label: 'Platinum', depthMin: 4, depthMax: 4, color: 'text-indigo-700 bg-indigo-100 border-indigo-300' },
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
    config: { focus_mode_enabled: true, fullscreen_required: false, copy_paste_blocked: false, anomaly_detection: false, teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false },
  },
  district: {
    label: 'District League', icon: <ShieldAlert className="w-5 h-5" />,
    desc: 'District competition requiring review',
    config: { focus_mode_enabled: true, fullscreen_required: true, copy_paste_blocked: true, anomaly_detection: true, teacher_attestation_required: false, lockdown_browser_required: false, recording_required: false, synchronized_start: false },
  },
  regional: {
    label: 'Regional Qualifier', icon: <Eye className="w-5 h-5" />,
    desc: 'Regional competition with teacher attestation',
    config: { focus_mode_enabled: true, fullscreen_required: true, copy_paste_blocked: true, anomaly_detection: true, teacher_attestation_required: true, lockdown_browser_required: false, recording_required: false, synchronized_start: true },
  },
  state: {
    label: 'State Championship', icon: <Lock className="w-5 h-5" />,
    desc: 'State competition with lockdown browser',
    config: { focus_mode_enabled: true, fullscreen_required: true, copy_paste_blocked: true, anomaly_detection: true, teacher_attestation_required: true, lockdown_browser_required: true, recording_required: false, synchronized_start: true },
  },
  national: {
    label: 'National Finals', icon: <Video className="w-5 h-5" />,
    desc: 'National competition with full proctoring',
    config: { focus_mode_enabled: true, fullscreen_required: true, copy_paste_blocked: true, anomaly_detection: true, teacher_attestation_required: true, lockdown_browser_required: true, recording_required: true, synchronized_start: true },
  },
};

function generateHeatCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MA';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ────────────────────────────────────────────────────────────
// INTEGRITY BADGES
// ────────────────────────────────────────────────────────────

function IntegrityBadges({ config }: { config: IntegrityConfig }) {
  const badges = [
    { on: config.focus_mode_enabled, label: 'Focus Mode', icon: <Eye className="w-3 h-3" /> },
    { on: config.fullscreen_required, label: 'Fullscreen', icon: <Lock className="w-3 h-3" /> },
    { on: config.lockdown_browser_required, label: 'Lockdown', icon: <ShieldAlert className="w-3 h-3" /> },
    { on: config.teacher_attestation_required, label: 'Attestation', icon: <UserCheck className="w-3 h-3" /> },
    { on: config.recording_required, label: 'Recording', icon: <Video className="w-3 h-3" /> },
  ];

  const active = badges.filter(b => b.on);
  if (active.length === 0) return <span className="text-xs text-gray-400 italic">No restrictions</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map(b => (
        <span key={b.label} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

export default function CreateHeatPage() {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [heatPreset, setHeatPreset] = useState<HeatPreset>('sprint');
  const [difficulty, setDifficulty] = useState<DifficultyTier>('silver');
  const [integrityLevel, setIntegrityLevel] = useState<IntegrityLevel>('practice');
  const [questionCount, setQuestionCount] = useState(20);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load topics
  useEffect(() => {
    async function loadTopics() {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name')
        .order('name');
      if (data) {
        setTopics(data);
        if (data.length > 0) setSelectedTopic(data[0].id);
      }
      if (error) console.error('Failed to load topics:', error);
      setLoading(false);
    }
    loadTopics();
  }, []);

  // Sync preset → question count + duration
  useEffect(() => {
    const preset = HEAT_PRESETS[heatPreset];
    setQuestionCount(preset.questions);
    setDurationMinutes(preset.minutes);
  }, [heatPreset]);

  const currentIntegrity = INTEGRITY_LEVELS[integrityLevel];
  const currentDifficulty = DIFFICULTY_TIERS[difficulty];

  // ── CREATE HEAT ──────────────────────────────────────────
  async function handleCreateHeat() {
    if (!selectedTopic) {
      setError('Please select a topic');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated — please log in');

      // Get user's school
      const { data: profile } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', user.id)
        .single();

      const code = generateHeatCode();

      // Insert with ACTUAL heats table columns
      const { data: heat, error: createError } = await supabase
        .from('heats')
        .insert({
          code,
          type: heatPreset,                                       // sprint, target, practice, championship
          integrity_level: integrityLevel,                        // practice, school, district, etc.
          topic_id: selectedTopic,
          depth_min: currentDifficulty.depthMin,                  // 1-4
          depth_max: currentDifficulty.depthMax,                  // 1-4
          question_count: questionCount,
          duration_seconds: durationMinutes * 60,                  // convert to seconds
          status: 'lobby',
          created_by: user.id,
          school_id: profile?.school_id || null,
          requires_attestation: currentIntegrity.config.teacher_attestation_required,
          lockdown_required: currentIntegrity.config.lockdown_browser_required,
          synchronized_start_at: currentIntegrity.config.synchronized_start
            ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
            : null,
        })
        .select()
        .single();

      if (createError) throw createError;

      router.push(`/compete/${code}`);
    } catch (err) {
      console.error('Error creating heat:', err);
      setError(err instanceof Error ? err.message : 'Failed to create Heat');
    } finally {
      setCreating(false);
    }
  }

  // ── LOADING ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Loading topics...</p>
        </div>
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Flame className="w-8 h-8 text-amber-500" />
            Create a Heat
          </h1>
          <p className="text-gray-500 mt-1">Set up a new competition for your mathletes</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to create Heat</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── SECTION 1: Heat Type ────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Heat type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(HEAT_PRESETS) as [HeatPreset, typeof HEAT_PRESETS[HeatPreset]][]).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setHeatPreset(key)}
                className={`p-4 rounded-xl border-2 text-center transition-all
                  ${heatPreset === key
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'}`}
              >
                <div className={`mx-auto mb-2 ${heatPreset === key ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {preset.icon}
                </div>
                <p className={`font-semibold text-sm ${heatPreset === key ? 'text-indigo-900' : 'text-gray-700'}`}>
                  {preset.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── SECTION 2: Integrity Level ──────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Integrity level</h2>
          <p className="text-xs text-gray-400 mb-4">Higher stakes = stricter monitoring</p>

          <div className="space-y-2">
            {(Object.entries(INTEGRITY_LEVELS) as [IntegrityLevel, typeof INTEGRITY_LEVELS[IntegrityLevel]][]).map(([key, level]) => (
              <button
                key={key}
                onClick={() => setIntegrityLevel(key)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 text-left transition-all
                  ${integrityLevel === key
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'}`}
              >
                <div className={`${integrityLevel === key ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {level.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${integrityLevel === key ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {level.label}
                  </p>
                  <p className="text-xs text-gray-400">{level.desc}</p>
                </div>
                {integrityLevel === key && <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Active enforcement badges */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-400 mb-2 font-medium">What this means for students:</p>
            <IntegrityBadges config={currentIntegrity.config} />
          </div>
        </div>

        {/* ── SECTION 3: Topic & Difficulty ────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Content settings</h2>

          {/* Topic */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-all
                    ${selectedTopic === topic.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(DIFFICULTY_TIERS) as [DifficultyTier, typeof DIFFICULTY_TIERS[DifficultyTier]][]).map(([key, tier]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className={`p-3 rounded-xl border-2 text-center transition-all text-sm font-semibold
                    ${difficulty === key
                      ? `${tier.color} border-current`
                      : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  {tier.label}
                  <p className="text-[10px] font-normal mt-0.5 opacity-60">
                    Depth {tier.depthMin}–{tier.depthMax}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Questions & Time (customizable) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
              <input
                type="number"
                min={5}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time limit</label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SUMMARY & CREATE ────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Summary</h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Type</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{heatPreset}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Difficulty</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{difficulty}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Topic</p>
              <p className="text-sm font-semibold text-gray-900">
                {topics.find(t => t.id === selectedTopic)?.name || '—'}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Format</p>
              <p className="text-sm font-semibold text-gray-900">
                {questionCount}Q · {durationMinutes} min
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 mb-6">
            <p className="text-xs text-indigo-400 mb-1 font-medium">Integrity: {currentIntegrity.label}</p>
            <IntegrityBadges config={currentIntegrity.config} />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateHeat}
              disabled={creating || !selectedTopic}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all
                ${creating || !selectedTopic
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5" />
                  Create Heat
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
