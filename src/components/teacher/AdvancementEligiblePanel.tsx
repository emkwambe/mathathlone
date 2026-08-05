'use client';

// =============================================================================
// MathAthlone — AdvancementEligiblePanel (Sprint 14)
// =============================================================================
// Client component rendered on the teacher dashboard when one or more students
// have crossed the ELO advancement threshold (1350) in their home division.
//
// Each row shows:
//   - Student name, grade level, class name
//   - Current division and ELO rating
//   - "Unlock Next Division" button
//
// On click, the button calls POST /api/athlete/unlock-division and shows
// inline feedback (success → division name; error → message).
// =============================================================================

import { useState } from 'react';

interface AdvancementStudent {
  athlete_id: string;
  display_name: string;
  grade_level: number | null;
  rating: number;
  division_id: string;
  division_name: string | null;
  class_name: string;
}

interface Props {
  students: AdvancementStudent[];
}

interface UnlockState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string | null;
}

export default function AdvancementEligiblePanel({ students }: Props) {
  // Track unlock state per student (keyed by athlete_id)
  const [unlockStates, setUnlockStates] = useState<Record<string, UnlockState>>({});

  async function handleUnlock(student: AdvancementStudent) {
    setUnlockStates((prev) => ({
      ...prev,
      [student.athlete_id]: { status: 'loading', message: null },
    }));

    try {
      const res = await fetch('/api/athlete/unlock-division', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: student.athlete_id,
          current_division_id: student.division_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUnlockStates((prev) => ({
          ...prev,
          [student.athlete_id]: {
            status: 'error',
            message: data.error ?? 'Failed to unlock division.',
          },
        }));
        return;
      }

      setUnlockStates((prev) => ({
        ...prev,
        [student.athlete_id]: {
          status: 'success',
          message: `${data.unlocked_division?.name ?? 'Next division'} unlocked.`,
        },
      }));
    } catch (err) {
      setUnlockStates((prev) => ({
        ...prev,
        [student.athlete_id]: {
          status: 'error',
          message: 'Network error — please try again.',
        },
      }));
    }
  }

  if (students.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border-l-4 border-amber-400">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">⭐</span>
        <h2 className="text-lg font-semibold text-gray-900">Advancement Eligible</h2>
        <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
          {students.length} student{students.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        These students have exceeded the advancement threshold (ELO ≥ 1350) in their current
        division. Click <strong>Unlock</strong> to allow them to compete at the next level.
        Their current division standing is preserved.
      </p>

      {/* Student rows */}
      <div className="space-y-2">
        {students.map((s) => {
          const state = unlockStates[s.athlete_id] ?? { status: 'idle', message: null };
          const isLoading = state.status === 'loading';
          const isSuccess = state.status === 'success';
          const isError = state.status === 'error';

          return (
            <div
              key={s.athlete_id}
              className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
            >
              {/* Left: student info */}
              <div className="min-w-0">
                <span className="font-medium text-gray-900">{s.display_name}</span>
                {s.grade_level != null && (
                  <span className="ml-2 text-xs text-gray-500">Grade {s.grade_level}</span>
                )}
                <span className="ml-2 text-xs text-gray-400">{s.class_name}</span>
              </div>

              {/* Right: division badge + ELO + button */}
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {s.division_name && (
                  <span className="text-xs bg-white border border-amber-200 text-amber-700 px-2 py-0.5 rounded">
                    {s.division_name}
                  </span>
                )}
                <span className="text-sm font-semibold text-amber-700">
                  ★ {Math.round(s.rating)} ELO
                </span>

                {/* Feedback or button */}
                {isSuccess ? (
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    ✓ {state.message}
                  </span>
                ) : isError ? (
                  <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                    {state.message}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUnlock(s)}
                    disabled={isLoading}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Unlocking…' : 'Unlock ↑'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
