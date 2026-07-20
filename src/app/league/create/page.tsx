// =============================================================================
// MathAthlone — /league/create
// =============================================================================
// Teacher-facing form to create a new League. Submits to the
// /api/league/create route which inserts into the leagues table.
// =============================================================================
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const LEAGUE_LEVELS = [
  { value: 'school', label: 'School-wide' },
  { value: 'district', label: 'District' },
  { value: 'regional', label: 'Regional' },
  { value: 'state', label: 'State' },
  { value: 'national', label: 'National' },
];

const FORMATS = [
  { value: 'single_elimination', label: 'Single Elimination' },
  { value: 'double_elimination', label: 'Double Elimination' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'swiss', label: 'Swiss System' },
];

export default function CreateLeaguePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    level: 'school',
    region: '',
    format: 'single_elimination',
    max_participants: 8,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'max_participants' ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/league/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
            Set up a season-long bracket competition with ELO ratings and championship points.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
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
              placeholder="e.g. Period 3 Algebra League — Spring 2026"
              value={form.name}
              onChange={handleChange}
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
                name="level"
                value={form.level}
                onChange={handleChange}
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
                name="region"
                type="text"
                placeholder="e.g. District 7 or Spring Split"
                value={form.region}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Format + Max Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="format">
                Bracket Format
              </label>
              <select
                id="format"
                name="format"
                value={form.format}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="max_participants">
                Max Participants
              </label>
              <select
                id="max_participants"
                name="max_participants"
                value={form.max_participants}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {[4, 8, 16, 32].map((n) => (
                  <option key={n} value={n}>{n} athletes</option>
                ))}
              </select>
            </div>
          </div>

          {/* Info box */}
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
              disabled={loading || !form.name.trim()}
              className="px-8 py-3 bg-violet-700 text-white font-semibold rounded-lg hover:bg-violet-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create League'}
            </button>
            <Link
              href="/dashboard/teacher"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
