// ============================================================
// MathAthlone League Dashboard — React Component
// components/league/LeagueDashboard.tsx
// Beautiful bracket visualization + live standings + season view
// © Mpingo Systems LLC
// ============================================================

'use client';
import React, { useState, useMemo } from 'react';
import SwissRoundView from '@/components/league/SwissRoundView';

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

interface BracketMatch {
  id: string;
  round: number;
  position: number;
  side: 'winners' | 'losers' | null;
  participant1: Participant | null;
  participant2: Participant | null;
  winner_id: string | null;
  p1_cta_score: number | null;
  p2_cta_score: number | null;
  is_bye: boolean;
  is_grand_final: boolean;
  status: 'pending' | 'scheduled' | 'live' | 'completed';
}

interface Participant {
  id: string;
  name: string;
  avatar_url: string | null;
  seed: number;
  school: string;
  rating: number;
  division: string;
}

interface StandingRow {
  rank: number;
  athlete: Participant;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  avg_cta: number;
  best_cta: number;
  current_elo: number;
  elo_change: number;
  heats_played: number;
  first_places: number;
}

interface SeasonSplit {
  id: string;
  name: string;
  status: 'upcoming' | 'active' | 'playoffs' | 'completed';
  start_date: string;
  end_date: string;
}

interface ChampionshipEntry {
  rank: number;
  athlete: Participant;
  total_points: number;
  splits_played: number;
  best_placement: number;
  qualified_for: string | null;
}

type TabId = 'bracket' | 'standings' | 'championship' | 'season';

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────

/** Return just the first name for classroom-level display. */
function firstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}

/** Capitalise the level string for display. */
function levelLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/** Icon per league level. */
function levelIcon(level: string): string {
  switch (level) {
    case 'classroom': return '🏫';
    case 'school':    return '🏫';
    case 'district':  return '🏙️';
    case 'regional':  return '🗺️';
    case 'state':     return '🌟';
    case 'national':  return '🇺🇸';
    default:          return '🏟️';
  }
}

// ────────────────────────────────────────────────────────────
// MOCK DATA (used when no real data is provided)
// ────────────────────────────────────────────────────────────

const MOCK_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Amara Osei',     avatar_url: null, seed: 1, school: 'Lincoln MS',  rating: 1847, division: 'ADV' },
  { id: '2', name: 'Jordan Chen',    avatar_url: null, seed: 2, school: 'Westlake Prep',rating: 1792, division: 'ADV' },
  { id: '3', name: 'Priya Sharma',   avatar_url: null, seed: 3, school: 'Oak Ridge',    rating: 1756, division: 'ADV' },
  { id: '4', name: 'Marcus Williams',avatar_url: null, seed: 4, school: 'Riverside',    rating: 1723, division: 'ADV' },
  { id: '5', name: 'Yuki Tanaka',    avatar_url: null, seed: 5, school: 'Hamilton',     rating: 1698, division: 'ADV' },
  { id: '6', name: 'Sofia Reyes',    avatar_url: null, seed: 6, school: 'Cedar Park',   rating: 1671, division: 'ADV' },
  { id: '7', name: 'Kwame Asante',   avatar_url: null, seed: 7, school: 'Northside',    rating: 1654, division: 'ADV' },
  { id: '8', name: 'Elena Volkov',   avatar_url: null, seed: 8, school: 'Crestwood',    rating: 1639, division: 'ADV' },
];

function generateMockBracket(): BracketMatch[] {
  const p = MOCK_PARTICIPANTS;
  return [
    { id: 'm1', round: 1, position: 0, side: null, participant1: p[0], participant2: p[7], winner_id: '1', p1_cta_score: 94.2, p2_cta_score: 78.1, is_bye: false, is_grand_final: false, status: 'completed' },
    { id: 'm2', round: 1, position: 1, side: null, participant1: p[3], participant2: p[4], winner_id: '4', p1_cta_score: 81.5, p2_cta_score: 79.3, is_bye: false, is_grand_final: false, status: 'completed' },
    { id: 'm3', round: 1, position: 2, side: null, participant1: p[1], participant2: p[6], winner_id: '2', p1_cta_score: 91.8, p2_cta_score: 72.4, is_bye: false, is_grand_final: false, status: 'completed' },
    { id: 'm4', round: 1, position: 3, side: null, participant1: p[2], participant2: p[5], winner_id: '3', p1_cta_score: 88.6, p2_cta_score: 85.1, is_bye: false, is_grand_final: false, status: 'live'      },
    { id: 'm5', round: 2, position: 0, side: null, participant1: p[0], participant2: p[3], winner_id: '1', p1_cta_score: 96.1, p2_cta_score: 84.7, is_bye: false, is_grand_final: false, status: 'completed' },
    { id: 'm6', round: 2, position: 1, side: null, participant1: p[1], participant2: null, winner_id: null, p1_cta_score: null, p2_cta_score: null, is_bye: false, is_grand_final: false, status: 'pending'   },
    { id: 'm7', round: 3, position: 0, side: null, participant1: null, participant2: null, winner_id: null, p1_cta_score: null, p2_cta_score: null, is_bye: false, is_grand_final: true,  status: 'pending'   },
  ];
}

function generateMockStandings(): StandingRow[] {
  return MOCK_PARTICIPANTS.map((p, i) => ({
    rank: i + 1,
    athlete: p,
    wins: 8 - i,
    losses: i,
    draws: 0,
    points: (8 - i) * 3,
    avg_cta: 95 - i * 3.5,
    best_cta: 98 - i * 2,
    current_elo: p.rating,
    elo_change: 0,
    heats_played: 8,
    first_places: Math.max(0, 5 - i),
  }));
}

function generateMockChampionship(): ChampionshipEntry[] {
  return MOCK_PARTICIPANTS.map((p, i) => ({
    rank: i + 1,
    athlete: p,
    total_points: 300 - i * 35,
    splits_played: 3,
    best_placement: i + 1,
    qualified_for: i < 3 ? 'State' : i < 8 ? 'Regional' : null,
  }));
}

// ────────────────────────────────────────────────────────────
// AVATAR COMPONENT
// ────────────────────────────────────────────────────────────

const Avatar: React.FC<{ name: string; size?: number; seed?: number }> = ({
  name,
  size = 32,
  seed = 0,
}) => {
  const hues = [210, 340, 160, 30, 270, 190, 0, 45];
  const hue = hues[(seed - 1) % hues.length] || 210;
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, hsl(${hue}, 65%, 50%), hsl(${hue + 30}, 55%, 40%))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.38,
        fontFamily: "'DM Sans', sans-serif",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// ADVANCEMENT BANNER (classroom leagues only)
// ────────────────────────────────────────────────────────────

const AdvancementBanner: React.FC<{
  slots: number;
  targetName: string;
}> = ({ slots, targetName }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 18px',
      borderRadius: 12,
      background: 'linear-gradient(90deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
      border: '1px solid rgba(99,102,241,0.25)',
      marginBottom: 24,
    }}
  >
    <span style={{ fontSize: 20 }}>🎯</span>
    <div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#818cf8',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Top {slots} advance to{' '}
        <span style={{ color: '#a78bfa' }}>{targetName}</span>
      </span>
      <p
        style={{
          fontSize: 11,
          color: '#6b7280',
          margin: '2px 0 0',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Win your classroom bracket to earn a spot in the school-wide competition.
      </p>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
// BRACKET VISUALIZATION
// ────────────────────────────────────────────────────────────

const MATCH_W = 260;
const MATCH_H = 80;
const ROUND_GAP = 80;
const MATCH_GAP = 24;

const BracketMatchCard: React.FC<{
  match: BracketMatch;
  x: number;
  y: number;
  highlightId: string | null;
  onHover: (id: string | null) => void;
  isClassroom?: boolean;
}> = ({ match, x, y, highlightId, onHover, isClassroom }) => {
  const isLive = match.status === 'live';
  const isComplete = match.status === 'completed';
  const isFinal = match.is_grand_final;

  const borderColor = isLive
    ? '#f59e0b'
    : isComplete
    ? '#10b981'
    : 'rgba(255,255,255,0.08)';

  const displayName = (p: Participant | null) => {
    if (!p) return null;
    return isClassroom ? firstName(p.name) : p.name;
  };

  const renderSlot = (
    participant: Participant | null,
    cta: number | null,
    isWinner: boolean,
    isTop: boolean
  ) => {
    const isHighlighted = participant && highlightId === participant.id;
    const name = displayName(participant);

    return (
      <div
        onMouseEnter={() => participant && onHover(participant.id)}
        onMouseLeave={() => onHover(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderBottom: isTop ? '1px solid rgba(255,255,255,0.06)' : undefined,
          background: isWinner
            ? 'rgba(16, 185, 129, 0.08)'
            : isHighlighted
            ? 'rgba(99, 102, 241, 0.1)'
            : 'transparent',
          transition: 'background 0.15s',
          cursor: participant ? 'pointer' : 'default',
          borderRadius: isTop ? '10px 10px 0 0' : '0 0 10px 10px',
        }}
      >
        {participant ? (
          <>
            <span
              style={{
                fontSize: 10,
                color: '#6b7280',
                width: 18,
                textAlign: 'center',
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {participant.seed}
            </span>
            <Avatar name={participant.name} size={24} seed={participant.seed} />
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: isWinner ? 700 : 500,
                color: isWinner ? '#e5e7eb' : '#9ca3af',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name}
            </span>
            {cta !== null && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isWinner ? '#34d399' : '#6b7280',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {cta.toFixed(1)}
              </span>
            )}
          </>
        ) : (
          <span
            style={{
              fontSize: 12,
              color: '#4b5563',
              fontStyle: 'italic',
              paddingLeft: 26,
            }}
          >
            TBD
          </span>
        )}
      </div>
    );
  };

  return (
    <foreignObject x={x} y={y} width={MATCH_W} height={MATCH_H}>
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 12,
          border: `1.5px solid ${borderColor}`,
          background: isFinal
            ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))'
            : 'rgba(17, 24, 39, 0.9)',
          backdropFilter: 'blur(8px)',
          overflow: 'hidden',
          boxShadow: isLive
            ? '0 0 20px rgba(245, 158, 11, 0.15)'
            : '0 2px 8px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        {isLive && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 8,
              fontSize: 9,
              fontWeight: 800,
              color: '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#f59e0b',
                animation: 'pulse 1.5s infinite',
              }}
            />
            LIVE
          </div>
        )}
        {isFinal && (
          <div
            style={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 9,
              fontWeight: 800,
              color: '#a78bfa',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              background: '#111827',
              padding: '2px 10px',
              borderRadius: 4,
              border: '1px solid rgba(139,92,246,0.3)',
            }}
          >
            🏆 FINAL
          </div>
        )}
        {renderSlot(match.participant1, match.p1_cta_score, match.winner_id === match.participant1?.id, true)}
        {renderSlot(match.participant2, match.p2_cta_score, match.winner_id === match.participant2?.id, false)}
      </div>
    </foreignObject>
  );
};

const BracketView: React.FC<{ matches: BracketMatch[]; isClassroom?: boolean }> = ({
  matches,
  isClassroom,
}) => {
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const rounds = useMemo(() => {
    const map = new Map<number, BracketMatch[]>();
    for (const m of matches) {
      const arr = map.get(m.round) || [];
      arr.push(m);
      map.set(m.round, arr);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([round, ms]) => ({
        round,
        matches: ms.sort((a, b) => a.position - b.position),
      }));
  }, [matches]);

  const roundLabels = useMemo(() => {
    const total = rounds.length;
    return rounds.map((r, i) => {
      if (i === total - 1) return 'Final';
      if (i === total - 2) return 'Semifinals';
      if (i === total - 3) return 'Quarterfinals';
      return `Round ${r.round}`;
    });
  }, [rounds]);
  if (matches.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#4b5563',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>
          Bracket Not Yet Generated
        </p>
        <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 380, margin: '0 auto 12px' }}>
          Run at least 3 heats to seed your bracket fairly. Your standings will determine seeding.
        </p>
        <p style={{ fontSize: 12, color: '#4b5563', maxWidth: 340, margin: '0 auto' }}>
          Once standings are set, use the <strong style={{ color: '#818cf8' }}>Generate Bracket</strong> button above to create the playoff bracket.
        </p>
      </div>
    );
  }

  const maxMatchesInRound = Math.max(...rounds.map((r) => r.matches.length));
  const svgHeight = maxMatchesInRound * (MATCH_H + MATCH_GAP) + 100;
  const svgWidth = rounds.length * (MATCH_W + ROUND_GAP) + 60;
  const getMatchCenter = (roundIdx: number, posIdx: number, totalInRound: number) => {
    const roundX = 30 + roundIdx * (MATCH_W + ROUND_GAP);
    const totalHeight = totalInRound * MATCH_H + (totalInRound - 1) * MATCH_GAP;
    const offsetY = (svgHeight - totalHeight) / 2;
    const matchY = offsetY + posIdx * (MATCH_H + MATCH_GAP);
    return { x: roundX, y: matchY, centerY: matchY + MATCH_H / 2 };
  };

  return (
    <div style={{ overflowX: 'auto', padding: '20px 0' }}>
      <svg width={svgWidth} height={svgHeight} style={{ minWidth: svgWidth }}>
        <defs>
          <style>{`
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          `}</style>
        </defs>

        {/* Round labels */}
        {rounds.map((r, roundIdx) => {
          const { x } = getMatchCenter(roundIdx, 0, r.matches.length);
          return (
            <text
              key={r.round}
              x={x + MATCH_W / 2}
              y={20}
              textAnchor="middle"
              fill="#4b5563"
              fontSize={11}
              fontWeight={700}
              fontFamily="DM Sans, sans-serif"
              letterSpacing="0.08em"
            >
              {roundLabels[roundIdx].toUpperCase()}
            </text>
          );
        })}

        {/* Connector lines */}
        {rounds.slice(0, -1).map((r, roundIdx) => {
          const nextRound = rounds[roundIdx + 1];
          return r.matches.map((_, matchIdx) => {
            const from = getMatchCenter(roundIdx, matchIdx, r.matches.length);
            const toIdx = Math.floor(matchIdx / 2);
            const to = getMatchCenter(roundIdx + 1, toIdx, nextRound.matches.length);
            const midX = from.x + MATCH_W + ROUND_GAP / 2;
            return (
              <path
                key={`conn-${roundIdx}-${matchIdx}`}
                d={`M ${from.x + MATCH_W} ${from.centerY} H ${midX} V ${to.centerY} H ${to.x}`}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1.5}
                fill="none"
              />
            );
          });
        })}

        {/* Match cards */}
        {rounds.map((r, roundIdx) =>
          r.matches.map((match, matchIdx) => {
            const { x, y } = getMatchCenter(roundIdx, matchIdx, r.matches.length);
            return (
              <BracketMatchCard
                key={match.id}
                match={match}
                x={x}
                y={y}
                highlightId={highlightId}
                onHover={setHighlightId}
                isClassroom={isClassroom}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// STANDINGS TABLE
// ────────────────────────────────────────────────────────────

const StandingsTable: React.FC<{
  standings: StandingRow[];
  isClassroom?: boolean;
  advancementSlots?: number;
}> = ({ standings, isClassroom, advancementSlots }) => {
  const medalColors: Record<number, string> = {
    1: '#fbbf24',
    2: '#94a3b8',
    3: '#cd7f32',
  };

  if (standings.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>
          No Standings Yet
        </p>
        <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 360, margin: '0 auto' }}>
          Standings will appear here after the first heat is completed.
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Advancement cut-line label */}
      {isClassroom && advancementSlots && advancementSlots > 0 && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#6366f1',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 8,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Top {advancementSlots} advance ↑
        </div>
      )}
      <table
        style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0 4px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <thead>
          <tr>
            {['#', 'Mathlete', 'W-L-D', 'PTS', 'AVG CTA', 'BEST', 'ELO', 'Δ', 'HEATS', '🥇'].map(
              (h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 12px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    textAlign: i < 2 ? 'left' : 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, idx) => {
            const medal = medalColors[row.rank];
            const isAdvancing = isClassroom && advancementSlots && row.rank <= advancementSlots;
            // Draw cut-line after last advancing slot
            const showCutLine =
              isClassroom &&
              advancementSlots &&
              idx === advancementSlots - 1 &&
              standings.length > advancementSlots;

            return (
              <React.Fragment key={row.athlete.id}>
                <tr
                  style={{
                    background: isAdvancing
                      ? 'rgba(99, 102, 241, 0.06)'
                      : 'transparent',
                    borderRadius: 8,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isAdvancing
                      ? 'rgba(99, 102, 241, 0.06)'
                      : 'transparent')
                  }
                >
                  <td
                    style={{
                      padding: '10px 12px',
                      fontSize: 14,
                      fontWeight: 800,
                      color: medal || '#4b5563',
                      fontFamily: "'JetBrains Mono', monospace",
                      width: 40,
                    }}
                  >
                    {row.rank}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={row.athlete.name} size={30} seed={row.athlete.seed} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>
                          {isClassroom ? firstName(row.athlete.name) : row.athlete.name}
                        </div>
                        {!isClassroom && (
                          <div style={{ fontSize: 10, color: '#6b7280' }}>
                            {row.athlete.school}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: '#9ca3af' }}>
                    {row.wins}-{row.losses}-{row.draws}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#e5e7eb', fontFamily: "'JetBrains Mono', monospace" }}>
                    {row.points}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#34d399', fontFamily: "'JetBrains Mono', monospace" }}>
                    {row.avg_cta.toFixed(1)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
                    {row.best_cta.toFixed(1)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#a78bfa', fontFamily: "'JetBrains Mono', monospace" }}>
                    {row.current_elo}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: row.elo_change > 0 ? '#34d399' : row.elo_change < 0 ? '#f87171' : '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
                    {row.elo_change > 0 ? '+' : ''}{row.elo_change}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
                    {row.heats_played}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: row.first_places > 0 ? '#fbbf24' : '#4b5563' }}>
                    {row.first_places}
                  </td>
                </tr>
                {showCutLine && (
                  <tr key={`cut-${row.athlete.id}`}>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <div
                        style={{
                          height: 2,
                          background: 'linear-gradient(90deg, #6366f1, #a78bfa, #6366f1)',
                          margin: '4px 0',
                          position: 'relative',
                          boxShadow: '0 0 8px rgba(99,102,241,0.7), 0 0 2px rgba(167,139,250,0.9)',
                          borderRadius: 2,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: -9,
                            fontSize: 9,
                            fontWeight: 800,
                            color: '#a78bfa',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontFamily: "'DM Sans', sans-serif",
                            textShadow: '0 0 6px rgba(167,139,250,0.6)',
                          }}
                        >
                          ▲ Advancement cut
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// CHAMPIONSHIP TRACKER
// ────────────────────────────────────────────────────────────

const ChampionshipTracker: React.FC<{ entries: ChampionshipEntry[] }> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>
          Championship Tracker
        </p>
        <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 360, margin: '0 auto' }}>
          Season-long championship points will appear here once heats begin.
        </p>
      </div>
    );
  }

  const maxPoints = Math.max(...entries.map((e) => e.total_points), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map((entry) => {
        const pct = (entry.total_points / maxPoints) * 100;
        const qualColor =
          entry.qualified_for === 'State'
            ? '#6366f1'
            : entry.qualified_for === 'Regional'
            ? '#8b5cf6'
            : 'transparent';

        return (
          <div
            key={entry.athlete.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(17, 24, 39, 0.6)',
              border: entry.qualified_for
                ? `1px solid ${qualColor}33`
                : '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: entry.rank <= 3
                  ? ['#fbbf24', '#94a3b8', '#cd7f32'][entry.rank - 1]
                  : '#4b5563',
                fontFamily: "'JetBrains Mono', monospace",
                width: 28,
                textAlign: 'center',
              }}
            >
              {entry.rank}
            </span>
            <Avatar name={entry.athlete.name} size={32} seed={entry.athlete.seed} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.athlete.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {entry.qualified_for && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: qualColor, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 6px', borderRadius: 4, border: `1px solid ${qualColor}44` }}>
                      {entry.qualified_for}
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', fontFamily: "'JetBrains Mono', monospace" }}>
                    {entry.total_points}
                  </span>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: `linear-gradient(90deg, ${qualColor || '#6366f1'}, ${qualColor || '#8b5cf6'})`, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 10, color: '#6b7280' }}>
                <span>{entry.splits_played} splits</span>
                <span>Best: #{entry.best_placement}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// SEASON TIMELINE
// ────────────────────────────────────────────────────────────

const MOCK_SPLITS: SeasonSplit[] = [
  { id: 's1', name: 'Fall Split',   status: 'completed', start_date: '2025-08-18', end_date: '2025-11-14' },
  { id: 's2', name: 'Winter Split', status: 'completed', start_date: '2025-12-01', end_date: '2026-02-27' },
  { id: 's3', name: 'Spring Split', status: 'active',    start_date: '2026-03-09', end_date: '2026-05-29' },
];

const SeasonTimeline: React.FC<{
  splits?: SeasonSplit[];
  level?: string;
}> = ({ splits, level }) => {
  const displaySplits = splits && splits.length > 0 ? splits : MOCK_SPLITS;
  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    upcoming:  { bg: 'rgba(107,114,128,0.1)', text: '#6b7280', dot: '#6b7280' },
    active:    { bg: 'rgba(99,102,241,0.1)',  text: '#818cf8', dot: '#6366f1' },
    playoffs:  { bg: 'rgba(245,158,11,0.1)',  text: '#fbbf24', dot: '#f59e0b' },
    completed: { bg: 'rgba(16,185,129,0.08)', text: '#34d399', dot: '#10b981' },
  };

  // Determine which levels are "reached" based on current level
  const allLevels = ['Classroom', 'School', 'District', 'Regional', 'State', 'National'];
  const currentLevelIdx = allLevels.findIndex(
    (l) => l.toLowerCase() === (level ?? '').toLowerCase()
  );

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
        2025–2026 Season
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displaySplits.map((split, i) => {
          const colors = statusColors[split.status];
          return (
            <div
              key={split.id}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 12, background: colors.bg, border: `1px solid ${colors.dot}22` }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: colors.dot, boxShadow: split.status === 'active' ? `0 0 10px ${colors.dot}55` : undefined }} />
                {i < displaySplits.length - 1 && (
                  <div style={{ width: 2, height: 20, background: 'rgba(255,255,255,0.06)', position: 'relative', top: 4 }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', marginBottom: 2 }}>
                  {split.name}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  {new Date(split.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' – '}
                  {new Date(split.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 6, border: `1px solid ${colors.dot}33` }}>
                {split.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Championship path — highlights current level */}
      <div style={{ marginTop: 28, padding: 18, borderRadius: 12, background: 'rgba(17, 24, 39, 0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
          Championship Path
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
          {allLevels.map((lvl, i, arr) => {
            const isCurrentLevel = i === currentLevelIdx;
            const isReached = currentLevelIdx >= 0 && i <= currentLevelIdx;
            return (
              <React.Fragment key={lvl}>
                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: isCurrentLevel ? 800 : 600,
                    color: isCurrentLevel ? '#818cf8' : isReached ? '#e5e7eb' : '#6b7280',
                    background: isCurrentLevel
                      ? 'rgba(99,102,241,0.2)'
                      : isReached
                      ? 'rgba(99,102,241,0.1)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isCurrentLevel ? 'rgba(99,102,241,0.5)' : isReached ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isCurrentLevel ? '0 0 12px rgba(99,102,241,0.2)' : undefined,
                  }}
                >
                  {lvl}
                </div>
                {i < arr.length - 1 && (
                  <span style={{ color: '#4b5563', fontSize: 14, padding: '0 6px' }}>→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ────────────────────────────────────────────────────────────

interface LeagueDashboardProps {
  leagueMeta?: {
    id: string;
    name: string;
    level: string;
    region: string;
    bracketName: string | null;
    bracketFormat: string | null;
    bracketId?: string | null;
    advancementInfo?: {
      targetLeagueName: string;
      slotsAllocated: number;
    } | null;
  };
  initialStandings?: StandingRow[];
  initialBracket?: BracketMatch[];
  initialChampionship?: ChampionshipEntry[];
  initialSplits?: SeasonSplit[];
  isOwner?: boolean;
}

export default function LeagueDashboard({
  leagueMeta,
  initialStandings,
  initialBracket,
  initialChampionship,
  initialSplits,
  isOwner = false,
}: LeagueDashboardProps = {}) {
  const [activeTab, setActiveTab] = useState<TabId>('standings');

  const [bracketData] = useState<BracketMatch[]>(
    initialBracket && initialBracket.length > 0 ? initialBracket : []
  );
  const [standingsData] = useState<StandingRow[]>(
    initialStandings && initialStandings.length > 0 ? initialStandings : []
  );
  const [championshipData] = useState<ChampionshipEntry[]>(
    initialChampionship && initialChampionship.length > 0 ? initialChampionship : []
  );

  const isClassroom = leagueMeta?.level === 'classroom';
  const advancement = leagueMeta?.advancementInfo ?? null;

  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: 'bracket',      label: 'Bracket',      icon: '🏆' },
    { id: 'standings',    label: 'Standings',    icon: '📊' },
    { id: 'championship', label: 'Championship', icon: '⭐' },
    { id: 'season',       label: 'Season',       icon: '📅' },
  ];

  const icon = leagueMeta ? levelIcon(leagueMeta.level) : '🏟️';
  const levelDisplay = leagueMeta ? levelLabel(leagueMeta.level) : '';

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: '#0a0e1a',
        color: '#e5e7eb',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>{icon}</span>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            {leagueMeta ? leagueMeta.name : 'District 7 — D1 Playoffs'}
          </h1>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          {leagueMeta
            ? [
                leagueMeta.region,
                levelDisplay + ' League',
                leagueMeta.bracketFormat,
                `${standingsData.length} Mathletes`,
              ]
                .filter(Boolean)
                .join(' • ')
            : 'Spring Split 2026 • Single Elimination • 8 Mathletes'}
        </p>
      </div>

      {/* Advancement banner — classroom only */}
      {isClassroom && advancement && (
        <AdvancementBanner
          slots={advancement.slotsAllocated}
          targetName={advancement.targetLeagueName}
        />
      )}

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 24,
          padding: 4,
          background: 'rgba(17, 24, 39, 0.6)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.04)',
          width: 'fit-content',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === tab.id ? '#818cf8' : '#6b7280',
              boxShadow: activeTab === tab.id ? 'inset 0 0 0 1px rgba(99, 102, 241, 0.2)' : 'none',
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          background: 'rgba(17, 24, 39, 0.4)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.04)',
          padding: 24,
        }}
      >
        {activeTab === 'bracket' && (
          leagueMeta?.bracketFormat === 'swiss'
            ? <SwissRoundView
                leagueId={leagueMeta.id}
                bracketId={leagueMeta.bracketId ?? null}
                isOwner={isOwner}
              />
            : <BracketView matches={bracketData} isClassroom={isClassroom} />
        )}
        {activeTab === 'standings' && (
          <StandingsTable
            standings={standingsData}
            isClassroom={isClassroom}
            advancementSlots={advancement?.slotsAllocated}
          />
        )}
        {activeTab === 'championship' && (
          <ChampionshipTracker entries={championshipData} />
        )}
        {activeTab === 'season' && (
          <SeasonTimeline splits={initialSplits} level={leagueMeta?.level} />
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, textAlign: 'center', fontSize: 10, color: '#374151', fontWeight: 500 }}>
        MathAthlone League Engine • Precision Tools built to stay. • © Mpingo Systems LLC
      </div>
    </div>
  );
}
