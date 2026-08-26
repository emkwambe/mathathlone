'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const COHORTS = [
  { code: 'JR', label: 'Junior', detail: 'Grades 3–4' },
  { code: 'INT', label: 'Intermediate', detail: 'Grades 5–6' },
  { code: 'ADV', label: 'Advanced', detail: 'Grades 7–8' },
  { code: 'JV', label: 'Junior Varsity', detail: 'Grades 9–10' },
  { code: 'SV', label: 'Senior Varsity', detail: 'Grades 11–12' },
] as const;

interface LeagueRankingCohortPanelProps {
  leagueId: string;
  currentCode: string | null;
}

export default function LeagueRankingCohortPanel({
  leagueId,
  currentCode,
}: LeagueRankingCohortPanelProps) {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState(currentCode ?? 'ADV');
  const [editing, setEditing] = useState(currentCode === null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = COHORTS.find((cohort) => cohort.code === currentCode);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/league/${leagueId}/ranking-cohort`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankingDivisionCode: selectedCode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to save the ranking cohort.');
      }
      setEditing(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the ranking cohort.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`border-b px-4 py-3 ${current ? 'border-emerald-900/40 bg-emerald-950/20' : 'border-amber-800/40 bg-amber-950/30'}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${current ? 'text-emerald-300' : 'text-amber-300'}`}>
            Ranking cohort
          </p>
          <p className="mt-0.5 text-sm text-gray-300">
            {current
              ? `Results rank only among ${current.label} peers (${current.detail}), regardless of the selected course content.`
              : 'Set the peer cohort before recording an elimination result. Content may span grades; standings and ELO may not.'}
          </p>
        </div>

        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCode}
              disabled={saving}
              onChange={(event) => setSelectedCode(event.target.value)}
              className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
              aria-label="League ranking cohort"
            >
              {COHORTS.map((cohort) => (
                <option key={cohort.code} value={cohort.code}>
                  {cohort.label} — {cohort.detail}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save cohort'}
            </button>
            {current && (
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setSelectedCode(current.code);
                  setEditing(false);
                  setError(null);
                }}
                className="rounded-lg border border-gray-600 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:text-white disabled:opacity-60"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-fit rounded-lg border border-emerald-700/60 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-500 hover:text-white"
          >
            Change cohort
          </button>
        )}
      </div>
      {error && <p role="alert" className="mx-auto mt-2 max-w-7xl text-sm text-red-300">{error}</p>}
    </div>
  );
}
