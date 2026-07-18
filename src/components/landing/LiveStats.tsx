'use client';
// =============================================================================
// MathAthlone — LiveStats Component
// =============================================================================
// Fetches live platform stats from /api/stats and renders them in the
// landing page hero badge. Polls every 60 seconds so the number stays
// fresh without a full page reload.
//
// Falls back gracefully to "—" while loading or if the fetch fails.
// © Mpingo Systems LLC
// =============================================================================

import { useEffect, useState } from 'react';

interface PlatformStats {
  activeMathletes: number;
  competingNow: number;
  heatsToday: number;
}

interface LiveStatsProps {
  /** Which stat to display. Defaults to 'competingNow'. */
  stat?: keyof PlatformStats;
  /** Suffix text after the number, e.g. " mathletes competing right now" */
  suffix?: string;
  /** How often to re-fetch in ms. Defaults to 60000 (1 min). */
  pollInterval?: number;
}

export default function LiveStats({
  stat = 'competingNow',
  suffix = ' mathletes competing right now',
  pollInterval = 60_000,
}: LiveStatsProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats', { next: { revalidate: 60 } });
      if (res.ok) {
        const data: PlatformStats = await res.json();
        setStats(data);
      }
    } catch {
      // Silently fail — the fallback "—" will show
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  const value = stats ? stats[stat].toLocaleString() : '—';

  return (
    <span>
      {loading ? (
        <span className="inline-block w-12 h-3 bg-white/20 rounded animate-pulse align-middle" />
      ) : (
        value
      )}
      {suffix}
    </span>
  );
}
