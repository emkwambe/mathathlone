// =============================================================================
// MathAthlone — /league/[id]
// =============================================================================
// Server component that fetches real league data from Supabase and passes it
// to the LeagueDashboard client component.
//
// Data fetched:
//   • leagues row (name, level, region)
//   • league_standings joined to users + athlete_ratings
//   • brackets + bracket_matches for the most recent bracket
//   • championship_points + season_standings for the season tab
//   • splits for the season timeline
//   • league_advancement row (for classroom leagues — advancement banner)
// =============================================================================
import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import LeagueDashboard from '@/components/league/LeagueDashboard';
import BracketGenerateButton from '@/components/league/BracketGenerateButton';
import StartLeagueHeatButton from '@/components/league/StartLeagueHeatButton';
import RosterImportButton from '@/components/league/RosterImportButton';
import LeagueRankingCohortPanel from '@/components/league/LeagueRankingCohortPanel';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaguePage({ params }: PageProps) {
  const { id: leagueId } = await params;
  const supabase = await createSupabaseServer();

  // ── 0. Current user (for teacher / administrator actions) ───────────────
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // ── 1. League meta ────────────────────────────────────────────────────────
  const { data: league, error: leagueErr } = await supabase
    .from('leagues')
    .select('id, name, level, region, season_id, division_id, ranking_division_id, school_id, district_id, class_id, created_by, content_scope, ranking_division:ranking_division_id ( code )')
    .eq('id', leagueId)
    .maybeSingle();

  if (leagueErr || !league) {
    notFound();
  }

  // ── 2. Standings (joined to users + athlete_ratings) ──────────────────────
  const { data: standingsRaw } = await supabase
    .from('league_standings')
    .select(`
      rank, wins, losses, draws, points, heats_played,
      avg_cta, best_cta, current_elo, elo_change, first_places,
      athlete_id,
      users:athlete_id (
        display_name,
        avatar_url,
        grade_level
      ),
      athlete_ratings!athlete_ratings_athlete_id_fkey (
        rating,
        division_id,
        divisions:division_id ( name )
      )
    `)
    .eq('league_id', leagueId)
    .order('rank', { ascending: true });

  // ── 3. Most recent bracket + its matches ─────────────────────────────────
  const { data: brackets } = await supabase
    .from('brackets')
    .select('id, name, format, status, current_round, rounds_count')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })
    .limit(1);

  const bracket = brackets?.[0] ?? null;

  let bracketMatchesRaw: any[] = [];
  if (bracket) {
    const { data: matches } = await supabase
      .from('bracket_matches')
      .select(`
        id, round, position, side,
        participant1_id, participant2_id,
        participant1_seed, participant2_seed,
        winner_id,
        p1_cta_score, p2_cta_score,
        is_bye, is_grand_final, status,
        p1:participant1_id ( display_name, avatar_url ),
        p2:participant2_id ( display_name, avatar_url )
      `)
      .eq('bracket_id', bracket.id)
      .order('round', { ascending: true })
      .order('position', { ascending: true });
    bracketMatchesRaw = matches ?? [];
  }

  // ── 4. Championship points (season totals) ────────────────────────────────
  const { data: champRaw } = await supabase
    .from('season_standings')
    .select(`
      athlete_id, total_championship_points, splits_participated,
      best_placement, qualified_for,
      users:athlete_id ( display_name, avatar_url, grade_level )
    `)
    .eq('season_id', league.season_id ?? '')
    .order('total_championship_points', { ascending: false })
    .limit(50);

  // ── 5. Season splits timeline ─────────────────────────────────────────────
  const { data: splitsRaw } = await supabase
    .from('splits')
    .select('id, name, status, start_date, end_date')
    .eq('season_id', league.season_id ?? '')
    .order('split_number', { ascending: true });

  // ── 6. School names for standings ────────────────────────────────────────
  const athleteIds = (standingsRaw ?? []).map((r: any) => r.athlete_id);
  let schoolMap: Record<string, string> = {};
  if (athleteIds.length > 0) {
    const { data: userSchools } = await supabase
      .from('users')
      .select('id, schools:school_id ( name )')
      .in('id', athleteIds);
    for (const u of userSchools ?? []) {
      schoolMap[(u as any).id] = (u as any).schools?.name ?? '';
    }
  }

  // ── 7. Advancement info (classroom leagues only) ─────────────────────────
  // Fetch the league_advancement row where this league is the source, and
  // join the target league name so the banner can say "Top N → School League"
  let advancementInfo: { targetLeagueName: string; slotsAllocated: number } | null = null;
  if (league.level === 'classroom') {
    const { data: advRow } = await supabase
      .from('league_advancement')
      .select(`
        slots_allocated,
        target:target_league_id ( name )
      `)
      .eq('source_league_id', leagueId)
      .maybeSingle();
    if (advRow) {
      advancementInfo = {
        targetLeagueName: (advRow.target as any)?.name ?? 'School League',
        slotsAllocated: advRow.slots_allocated ?? 2,
      };
    }
  }

  // ── 8. Shape data for LeagueDashboard props ───────────────────────────────
  const standings = (standingsRaw ?? []).map((r: any) => {
    const user = r.users ?? {};
    const ratings = Array.isArray(r.athlete_ratings) ? r.athlete_ratings : [r.athlete_ratings].filter(Boolean);
    // An athlete can hold multiple ratings after advancement. The league page
    // must display the one that belongs to this league's ranking cohort.
    const ar = ratings.find((rating: any) => rating.division_id === (league as any).ranking_division_id) ?? null;
    const division = ar?.divisions?.name ?? '';
    return {
      rank: r.rank,
      athlete: {
        id: r.athlete_id,
        name: user.display_name ?? 'Mathlete',
        avatar_url: user.avatar_url ?? null,
        seed: r.rank,
        school: schoolMap[r.athlete_id] ?? '',
        rating: Number(r.current_elo ?? ar?.rating ?? 1200),
        division,
      },
      wins: r.wins ?? 0,
      losses: r.losses ?? 0,
      draws: r.draws ?? 0,
      points: r.points ?? 0,
      avg_cta: Number(r.avg_cta ?? 0),
      best_cta: Number(r.best_cta ?? 0),
      current_elo: Number(r.current_elo ?? 1200),
      elo_change: Number(r.elo_change ?? 0),
      heats_played: r.heats_played ?? 0,
      first_places: r.first_places ?? 0,
    };
  });

  const bracketMatches = bracketMatchesRaw.map((m: any) => {
    const makeParticipant = (
      id: string | null,
      user: any,
      seed: number | null,
      standing: (typeof standings)[0] | undefined
    ) => {
      if (!id || !user) return null;
      return {
        id,
        name: user.display_name ?? 'Mathlete',
        avatar_url: user.avatar_url ?? null,
        seed: seed ?? 0,
        school: standing?.athlete.school ?? '',
        rating: standing?.current_elo ?? 1200,
        division: standing?.athlete.division ?? '',
      };
    };
    const p1Standing = standings.find((s) => s.athlete.id === m.participant1_id);
    const p2Standing = standings.find((s) => s.athlete.id === m.participant2_id);
    return {
      id: m.id,
      round: m.round,
      position: m.position,
      side: m.side ?? null,
      participant1: makeParticipant(m.participant1_id, m.p1, m.participant1_seed, p1Standing),
      participant2: makeParticipant(m.participant2_id, m.p2, m.participant2_seed, p2Standing),
      winner_id: m.winner_id ?? null,
      p1_cta_score: m.p1_cta_score != null ? Number(m.p1_cta_score) : null,
      p2_cta_score: m.p2_cta_score != null ? Number(m.p2_cta_score) : null,
      is_bye: !!m.is_bye,
      is_grand_final: !!m.is_grand_final,
      status: m.status ?? 'pending',
    };
  });

  const championship = (champRaw ?? []).map((r: any, i: number) => {
    const user = r.users ?? {};
    const standing = standings.find((s) => s.athlete.id === r.athlete_id);
    return {
      rank: i + 1,
      athlete: {
        id: r.athlete_id,
        name: user.display_name ?? 'Mathlete',
        avatar_url: user.avatar_url ?? null,
        seed: i + 1,
        school: schoolMap[r.athlete_id] ?? '',
        rating: standing?.current_elo ?? 1200,
        division: standing?.athlete.division ?? '',
      },
      total_points: r.total_championship_points ?? 0,
      splits_played: r.splits_participated ?? 0,
      best_placement: r.best_placement ?? 0,
      qualified_for: r.qualified_for ?? null,
    };
  });

  const splits = (splitsRaw ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    status: s.status as 'upcoming' | 'active' | 'playoffs' | 'completed',
    start_date: s.start_date,
    end_date: s.end_date,
  }));

  const rankingCohortCode = (league as any).ranking_division?.code ?? null;

  const leagueMeta = {
    id: league.id,
    name: league.name,
    level: league.level as string,
    region: league.region ?? '',
    bracketName: bracket?.name ?? null,
    bracketFormat: bracket?.format ?? null,
    bracketId: bracket?.id ?? null,
    advancementInfo,
    contentScope: (league as any).content_scope ?? null,
  };

  // Sprint 16B: organization authority is resolved against the persisted
  // league scope, active delegation records, and the actor's current profile.
  // This avoids treating a school/district role as global access.
  const { data: mayManageLeague } = currentUser
    ? await supabase.rpc('can_manage_league', { p_league_id: leagueId })
    : { data: false };
  const isLeagueManager = Boolean(mayManageLeague);

  return (
    <div className="relative">
      {/* Teacher-only actions bar */}
      {isLeagueManager && (
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-950/60 border-b border-indigo-800/40">
          <span className="text-xs text-indigo-300 font-medium tracking-wide uppercase">
            Teacher Controls
          </span>
          <div className="flex items-center gap-2">
            <RosterImportButton
              leagueId={leagueId}
              leagueName={league.name}
            />
            <StartLeagueHeatButton
              leagueId={leagueId}
              contentScope={(league as any).content_scope ?? null}
            />
            <BracketGenerateButton
              leagueId={leagueId}
              hasBracket={bracket !== null}
            />
          </div>
        </div>
      )}
      {isLeagueManager && (
        <LeagueRankingCohortPanel
          leagueId={leagueId}
          currentCode={rankingCohortCode}
        />
      )}
      <LeagueDashboard
        leagueMeta={leagueMeta}
        initialStandings={standings}
        initialBracket={bracketMatches}
        initialChampionship={championship}
        initialSplits={splits}
        isOwner={isLeagueManager}
      />
    </div>
  );
}
