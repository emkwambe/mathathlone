'use client';
// =============================================================================
// StartLeagueHeatButton — Sprint 9
// =============================================================================
// Teacher-only button in the league controls bar.
// Builds a URL to /compete/create pre-populated with:
//   • league_id  — so the heat is tagged to this league
//   • scope      — the league's content_scope JSON (base64-encoded)
//
// When clicked, the teacher lands on the Create Heat page with the correct
// course/unit/multi-course pool already selected.
// =============================================================================

import Link from 'next/link';

interface ContentScope {
  type: 'course' | 'unit' | 'multi_course';
  course_code?: string;
  course_name?: string;
  unit_code?: string;
  unit_name?: string;
  courses?: { course_code: string; course_name: string }[];
}

interface Props {
  leagueId: string;
  contentScope: ContentScope | null;
}

export default function StartLeagueHeatButton({ leagueId, contentScope }: Props) {
  // Build the pre-fill query string
  const params = new URLSearchParams({ league_id: leagueId });
  if (contentScope) {
    // Base64-encode the scope so it survives URL encoding cleanly
    try {
      params.set('scope', btoa(JSON.stringify(contentScope)));
    } catch {
      // If btoa fails (e.g. non-ASCII), skip the scope param
    }
  }

  const href = `/compete/create?${params.toString()}`;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M3 8h10" />
      </svg>
      Start League Heat
    </Link>
  );
}
