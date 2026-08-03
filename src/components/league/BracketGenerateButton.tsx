'use client';
// =============================================================================
// BracketGenerateButton
// =============================================================================
// Shown to the league owner (teacher / admin) on the /league/[id] page.
// Calls POST /api/league/bracket/generate and refreshes the page on success.
// =============================================================================
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Loader2, ChevronDown } from 'lucide-react';

interface Props {
  leagueId: string;
  hasBracket: boolean;
}

export default function BracketGenerateButton({ leagueId, hasBracket }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<'single_elim' | 'double_elim'>('single_elim');

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/league/bracket/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId,
          format,
          name: hasBracket ? 'Playoffs (regenerated)' : 'Playoffs',
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Failed to generate bracket.');
        return;
      }
      // Refresh the server component to show the new bracket
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {/* Format picker */}
        <div className="relative">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as 'single_elim' | 'double_elim')}
            disabled={loading}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-indigo-300 text-sm text-indigo-700 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
          >
            <option value="single_elim">Single Elimination</option>
            <option value="double_elim">Double Elimination</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trophy className="w-4 h-4" />
          )}
          {hasBracket ? 'Regenerate Bracket' : 'Generate Bracket'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
