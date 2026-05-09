// =============================================================================
// MathAthlone Heat Creation Page with Integrity Settings
// =============================================================================
// src/app/compete/create/page.tsx
// =============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  Flame,
  Clock,
  Target,
  Trophy,
  ChevronRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  Video,
  UserCheck,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type IntegrityLevel = 'practice' | 'school' | 'district' | 'regional' | 'state' | 'national';
type HeatType = 'sprint' | 'target' | 'practice' | 'championship';

interface IntegrityConfig {
  level: IntegrityLevel;
  display_name: string;
  description: string;
  focus_mode_enabled: boolean;
  fullscreen_required: boolean;
  copy_paste_blocked: boolean;
  lockdown_browser_required: boolean;
  synchronized_start: boolean;
  teacher_attestation_required: boolean;
  identity_verification_required: boolean;
  session_recording_enabled: boolean;
  anomaly_detection_enabled: boolean;
  warning_threshold: number;
  flag_threshold: number;
}

interface Topic {
  id: string;
  name: string;
  course_id: string;
}

// -----------------------------------------------------------------------------
// Integrity Level Card Component
// -----------------------------------------------------------------------------

interface IntegrityLevelCardProps {
  config: IntegrityConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function IntegrityLevelCard({ config, isSelected, onSelect }: IntegrityLevelCardProps) {
  const levelIcons: Record<IntegrityLevel, React.ReactNode> = {
    practice: <Shield className="w-6 h-6" />,
    school: <ShieldCheck className="w-6 h-6" />,
    district: <ShieldCheck className="w-6 h-6" />,
    regional: <ShieldAlert className="w-6 h-6" />,
    state: <Lock className="w-6 h-6" />,
    national: <Lock className="w-6 h-6" />,
  };

  const levelColors: Record<IntegrityLevel, { bg: string; border: string; text: string; icon: string }> = {
    practice: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'text-cyan-500' },
    school: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' },
    district: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-600' },
    regional: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' },
    state: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' },
    national: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500' },
  };

  const colors = levelColors[config.level];

  // Features to display
  const features = [
    { enabled: config.focus_mode_enabled, label: 'Focus Mode', icon: Eye },
    { enabled: config.fullscreen_required, label: 'Fullscreen', icon: Lock },
    { enabled: config.lockdown_browser_required, label: 'Lockdown', icon: ShieldAlert },
    { enabled: config.teacher_attestation_required, label: 'Attestation', icon: UserCheck },
    { enabled: config.session_recording_enabled, label: 'Recording', icon: Video },
  ].filter(f => f.enabled);

  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-4 rounded-xl border-2 transition-all text-left
        ${isSelected
          ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ring-${config.level === 'practice' ? 'cyan' : config.level === 'school' ? 'green' : config.level === 'district' ? 'yellow' : config.level === 'regional' ? 'orange' : config.level === 'state' ? 'red' : 'purple'}-400`
          : 'bg-white border-gray-200 hover:border-gray-300'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isSelected ? colors.bg : 'bg-gray-100'}`}>
          <div className={isSelected ? colors.icon : 'text-gray-400'}>
            {levelIcons[config.level]}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${isSelected ? colors.text : 'text-gray-900'}`}>
              {config.display_name}
            </h3>
            {isSelected && (
              <Check className={`w-5 h-5 ${colors.text}`} />
            )}
          </div>
          
          <p className="text-sm text-gray-500 mt-1">
            {config.description}
          </p>

          {/* Features */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {features.map((f, i) => (
                <span
                  key={i}
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                    ${isSelected ? colors.bg + ' ' + colors.text : 'bg-gray-100 text-gray-600'}
                  `}
                >
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------

export default function CreateHeatPage() {
  const router = useRouter();

  // Form state
  const [heatType, setHeatType] = useState<HeatType>('sprint');
  const [integrityLevel, setIntegrityLevel] = useState<IntegrityLevel>('school');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(2);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [timeMinutes, setTimeMinutes] = useState<number>(15);

  // Data state
  const [integrityConfigs, setIntegrityConfigs] = useState<IntegrityConfig[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Load integrity configs
        const { data: configs, error: configError } = await supabase
          .from('integrity_configs')
          .select('*')
          .order('level');

        if (configError) throw configError;
        setIntegrityConfigs(configs || []);

        // Load topics
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('*')
          .order('name');

        if (topicsError) throw topicsError;
        setTopics(topicsData || []);

        if (topicsData && topicsData.length > 0) {
          setSelectedTopic(topicsData[0].id);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Get current integrity config
  const currentConfig = integrityConfigs.find(c => c.level === integrityLevel);

  // Heat type configs
  const heatTypes: { type: HeatType; label: string; icon: React.ReactNode; time: number; questions: number }[] = [
    { type: 'sprint', label: 'Sprint', icon: <Flame className="w-5 h-5" />, time: 15, questions: 20 },
    { type: 'target', label: 'Target', icon: <Target className="w-5 h-5" />, time: 20, questions: 10 },
    { type: 'practice', label: 'Practice', icon: <Clock className="w-5 h-5" />, time: 30, questions: 15 },
    { type: 'championship', label: 'Championship', icon: <Trophy className="w-5 h-5" />, time: 25, questions: 25 },
  ];

  // Update time/questions when heat type changes
  useEffect(() => {
    const config = heatTypes.find(h => h.type === heatType);
    if (config) {
      setTimeMinutes(config.time);
      setQuestionCount(config.questions);
    }
  }, [heatType]);

  // Generate heat code
  function generateHeatCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MA-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create heat
  async function handleCreateHeat() {
    if (!selectedTopic) {
      setError('Please select a topic');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const code = generateHeatCode();

      const { data: heat, error: createError } = await supabase
        .from('heats')
        .insert({
          code,
          heat_type: heatType,
          integrity_level: integrityLevel,
          topic_id: selectedTopic,
          difficulty,
          question_count: questionCount,
          time_limit_minutes: timeMinutes,
          status: 'waiting',
          created_by: user.id,
          requires_attestation: currentConfig?.teacher_attestation_required || false,
          lockdown_required: currentConfig?.lockdown_browser_required || false,
          synchronized_start_at: currentConfig?.synchronized_start 
            ? new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min from now
            : null,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Navigate to the heat lobby
      router.push(`/compete/${code}`);
    } catch (err) {
      console.error('Error creating heat:', err);
      setError(err instanceof Error ? err.message : 'Failed to create Heat');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create a Heat</h1>
          <p className="text-gray-600 mt-2">
            Set up a new competition for your students
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid gap-8">
          {/* Section 1: Heat Type */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Heat Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {heatTypes.map(({ type, label, icon, time, questions }) => (
                <button
                  key={type}
                  onClick={() => setHeatType(type)}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-center
                    ${heatType === type
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className={`mx-auto mb-2 ${heatType === type ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {icon}
                  </div>
                  <p className={`font-medium ${heatType === type ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {time}min • {questions}Q
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Section 2: Integrity Level */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Integrity Level</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info className="w-4 h-4" />
                <span>Higher stakes = stricter monitoring</span>
              </div>
            </div>
            
            <div className="grid gap-3">
              {integrityConfigs.map((config) => (
                <IntegrityLevelCard
                  key={config.level}
                  config={config}
                  isSelected={integrityLevel === config.level}
                  onSelect={() => setIntegrityLevel(config.level)}
                />
              ))}
            </div>

            {/* Requirements summary */}
            {currentConfig && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  What this means for students:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  {currentConfig.focus_mode_enabled && (
                    <li className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-500" />
                      Tab switches and window changes will be detected
                    </li>
                  )}
                  {currentConfig.fullscreen_required && (
                    <li className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-500" />
                      Fullscreen mode required throughout
                    </li>
                  )}
                  {currentConfig.copy_paste_blocked && (
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      Copy/paste and right-click disabled
                    </li>
                  )}
                  {currentConfig.anomaly_detection_enabled && (
                    <li className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-purple-500" />
                      AI anomaly detection active
                    </li>
                  )}
                  {currentConfig.teacher_attestation_required && (
                    <li className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-500" />
                      You must attest to supervising this Heat
                    </li>
                  )}
                  {!currentConfig.focus_mode_enabled && (
                    <li className="flex items-center gap-2 text-gray-400">
                      <Shield className="w-4 h-4" />
                      Light logging only — trust-based
                    </li>
                  )}
                </ul>
              </div>
            )}
          </section>

          {/* Section 3: Topic & Difficulty */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Settings</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty: {['Bronze', 'Silver', 'Gold', 'Platinum'][difficulty - 1]}
                </label>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Bronze</span>
                  <span>Silver</span>
                  <span>Gold</span>
                  <span>Platinum</span>
                </div>
              </div>

              {/* Question count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Questions: {questionCount}
                </label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Time limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit: {timeMinutes} minutes
                </label>
                <input
                  type="range"
                  min={5}
                  max={45}
                  step={5}
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </section>

          {/* Create Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateHeat}
              disabled={creating || !selectedTopic}
              className={`
                px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                ${creating || !selectedTopic
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'}
              `}
            >
              {creating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  Create Heat
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
