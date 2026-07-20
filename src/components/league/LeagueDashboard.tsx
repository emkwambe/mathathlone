// ============================================================
// MathAthlone League Dashboard — React Component
// components/league/LeagueDashboard.tsx
// Beautiful bracket visualization + live standings + season view
// © Mpingo Systems LLC
// ============================================================

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

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
// MOCK DATA (replace with Supabase realtime in production)
// ────────────────────────────────────────────────────────────

const MOCK_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Amara Osei', avatar_url: null, seed: 1, school: 'Lincoln MS', rating: 1847, division: 'D1' },
  { id: '2', name: 'Jordan Chen', avatar_url: null, seed: 2, school: 'Westlake Prep', rating: 1792, division: 'D1' },
  { id: '3', name: 'Priya Sharma', avatar_url: null, seed: 3, school: 'Oak Ridge', rating: 1756, division: 'D1' },
  { id: '4', name: 'Marcus Williams', avatar_url: null, seed: 4, school: 'Riverside', rating: 1723, division: 'D1' },
  { id: '5', name: 'Yuki Tanaka', avatar_url: null, seed: 5, school: 'Hamilton', rating: 1698, division: 'D1' },
  { id: '6', name: 'Sofia Reyes', avatar_url: null, seed: 6, school: 'Cedar Park', rating: 1671, division: 'D1' },
  { id: '7', name: 'Kwame Asante', avatar_url: null, seed: 7, school: 'Northside', rating: 1654, division: 'D1' },
  { id: '8', name: 'Elena Volkov', avatar_url: null, seed: 8, school: 'Crestwood', rating: 1639, division: 'D1' },
];

function generateMockBracket(): BracketMatch[] {
  const p = MOCK_PARTICIPANTS;
  return [
    // QF
    { id: 'm1', round: 1, position: 0, side: null, participant1: p[0], participant2: p[7], winner_id: '1', p1_cta_score: 94.2, p2_cta_score: 78.1, is_bye: false, is_grand_final: false, status: 'completed' },
    { id: 'm2', round: 1, position: 1, side: null, participant1: p[3], participant2: p[4], winner_id: '4', p1_cta_score: 81.5, p2_cta_score: 79.3, is_bye: false, is_grand_final: false, status: 'completed' },
    { id: 'm3', round: 1, position: 2, side: null, participant1: p[1], participant2: p[6], winner_id: '2', p1_cta_score: 91.8, p2_cta_score: 72.4, is_bye: false, is_grand_final: false, status: 'completed' },
    { id: 'm4', round: 1, position: 3, side: null, participant1: p[2], participant2: p[5], winner_id: '3', p1_cta_score: 88.6, p2_cta_score: 85.1, is_bye: false, is_grand_final: false, status: 'live' },
    // SF
    { id: 'm5', round: 2, position: 0, side: null, participant1: p[0], participant2: p[3], winner_id: '1', p1_cta_score: 96.1, p2_cta_score: 84.7, is_bye: false, is_grand_final: false, status: 'completed' },
    { id: 'm6', round: 2, position: 1, side: null, participant1: p[1], participant2: null, winner_id: null, p1_cta_score: null, p2_cta_score: null, is_bye: false, is_grand_final: false, status: 'pending' },
    // Final
    { id: 'm7', round: 3, position: 0, side: null, participant1: null, participant2: null, winner_id: null, p1_cta_score: null, p2_cta_score: null, is_bye: false, is_grand_final: true, status: 'pending' },
  ];
}

function generateMockStandings(): StandingRow[] {
  return MOCK_PARTICIPANTS.map((p, i) => ({
    rank: i + 1,
    athlete: p,
    wins: 8 - i,
    losses: i,
    draws: Math.floor(Math.random() * 2),
    points: (8 - i) * 3 + Math.floor(Math.random() * 2),
    avg_cta: 95 - i * 3.5 + Math.random() * 5,
    best_cta: 98 - i * 2,
    current_elo: p.rating,
    elo_change: Math.round((Math.random() - 0.3) * 40),
    heats_played: 8 + Math.floor(Math.random() * 3),
    first_places: Math.max(0, 5 - i),
  }));
}

function generateMockChampionship(): ChampionshipEntry[] {
  return MOCK_PARTICIPANTS.map((p, i) => ({
    rank: i + 1,
    athlete: p,
    total_points: 300 - i * 35 + Math.floor(Math.random() * 20),
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
}> = ({ match, x, y, highlightId, onHover }) => {
  const isLive = match.status === 'live';
  const isComplete = match.status === 'completed';
  const isFinal = match.is_grand_final;

  const borderColor = isLive
    ? '#f59e0b'
    : isComplete
    ? '#10b981'
    : 'rgba(255,255,255,0.08)';

  const renderSlot = (
    participant: Participant | null,
    cta: number | null,
    isWinner: boolean,
    isTop: boolean
  ) => {
    const isHighlighted =
      participant && highlightId === participant.id;

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
              {participant.name}
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
        {renderSlot(
          match.participant1,
          match.p1_cta_score,
          match.winner_id === match.participant1?.id,
          true
        )}
        {renderSlot(
          match.participant2,
          match.p2_cta_score,
          match.winner_id === match.participant2?.id,
          false
        )}
      </div>
    </foreignObject>
  );
};

const BracketView: React.FC<{ matches: BracketMatch[] }> = ({ matches }) => {
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

  const maxMatchesInRound = Math.max(...rounds.map((r) => r.matches.length));
  const svgHeight = maxMatchesInRound * (MATCH_H + MATCH_GAP) + 100;
  const svgWidth = rounds.length * (MATCH_W + ROUND_GAP) + 60;

  // Calculate connector lines
  const getMatchCenter = (roundIdx: number, posIdx: number, totalInRound: number) => {
    const roundX = 30 + roundIdx * (MATCH_W + ROUND_GAP);
    const totalHeight = totalInRound * MATCH_H + (totalInRound - 1) * MATCH_GAP;
    const offsetY = (svgHeight - totalHeight) / 2;
    const matchY = offsetY + posIdx * (MATCH_H + MATCH_GAP);
    return { x: roundX, y: matchY, centerY: matchY + MATCH_H / 2 };
  };

  return (
    <div style={{ overflowX: 'auto', padding: '20px 0' }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ minWidth: svgWidth }}
      >
        <defs>
          <style>{`
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          `}</style>
        </defs>

        {/* Round labels */}
        {rounds.map((r, ri) => (
          <text
            key={`label-${r.round}`}
            x={30 + ri * (MATCH_W + ROUND_GAP) + MATCH_W / 2}
            y={24}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={11}
            fontWeight={700}
            fontFamily="'DM Sans', sans-serif"
            letterSpacing="0.08em"
            textDecoration="uppercase"
          >
            {roundLabels[ri].toUpperCase()}
          </text>
        ))}

        {/* Connector lines */}
        {rounds.map((r, ri) => {
          if (ri >= rounds.length - 1) return null;
          const nextRound = rounds[ri + 1];

          return r.matches.map((m, mi) => {
            const from = getMatchCenter(ri, mi, r.matches.length);
            const toPos = Math.floor(mi / 2);
            const to = getMatchCenter(ri + 1, toPos, nextRound.matches.length);

            const fromX = from.x + MATCH_W;
            const toX = to.x;
            const midX = fromX + (toX - fromX) / 2;

            const isHighlighted =
              highlightId &&
              (m.participant1?.id === highlightId ||
                m.participant2?.id === highlightId ||
                m.winner_id === highlightId);

            return (
              <path
                key={`line-${r.round}-${mi}`}
                d={`M ${fromX} ${from.centerY} H ${midX} V ${to.centerY} H ${toX}`}
                fill="none"
                stroke={isHighlighted ? '#6366f1' : 'rgba(255,255,255,0.08)'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeLinecap="round"
                style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
              />
            );
          });
        })}

        {/* Match cards */}
        {rounds.map((r, ri) =>
          r.matches.map((m, mi) => {
            const pos = getMatchCenter(ri, mi, r.matches.length);
            return (
              <BracketMatchCard
                key={m.id}
                match={m}
                x={pos.x}
                y={pos.y}
                highlightId={highlightId}
                onHover={setHighlightId}
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

const StandingsTable: React.FC<{ standings: StandingRow[] }> = ({ standings }) => {
  const medalColors: Record<number, string> = {
    1: '#fbbf24',
    2: '#94a3b8',
    3: '#cd7f32',
  };

  return (
    <div style={{ overflowX: 'auto' }}>
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
          {standings.map((row) => {
            const medal = medalColors[row.rank];
            return (
              <tr
                key={row.athlete.id}
                style={{
                  background: row.rank <= 3
                    ? 'rgba(99, 102, 241, 0.04)'
                    : 'transparent',
                  borderRadius: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    row.rank <= 3 ? 'rgba(99, 102, 241, 0.04)' : 'transparent')
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
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#e5e7eb',
                        }}
                      >
                        {row.athlete.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>
                        {row.athlete.school}
                      </div>
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#9ca3af',
                  }}
                >
                  {row.wins}-{row.losses}-{row.draws}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#e5e7eb',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {row.points}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#34d399',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {row.avg_cta.toFixed(1)}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 13,
                    color: '#9ca3af',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {row.best_cta.toFixed(1)}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#a78bfa',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {row.current_elo}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: row.elo_change > 0 ? '#34d399' : row.elo_change < 0 ? '#f87171' : '#6b7280',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {row.elo_change > 0 ? '+' : ''}
                  {row.elo_change}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  {row.heats_played}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: row.first_places > 0 ? '#fbbf24' : '#4b5563',
                  }}
                >
                  {row.first_places}
                </td>
              </tr>
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

const ChampionshipTracker: React.FC<{ entries: ChampionshipEntry[] }> = ({
  entries,
}) => {
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
              transition: 'transform 0.15s',
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#e5e7eb',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {entry.athlete.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {entry.qualified_for && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        color: qualColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: `1px solid ${qualColor}44`,
                      }}
                    >
                      {entry.qualified_for}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#e5e7eb',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {entry.total_points}
                  </span>
                </div>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${qualColor || '#6366f1'}, ${qualColor || '#8b5cf6'})`,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 4,
                  fontSize: 10,
                  color: '#6b7280',
                }}
              >
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
  { id: 's1', name: 'Fall Split', status: 'completed', start_date: '2025-08-18', end_date: '2025-11-14' },
  { id: 's2', name: 'Winter Split', status: 'completed', start_date: '2025-12-01', end_date: '2026-02-27' },
  { id: 's3', name: 'Spring Split', status: 'active', start_date: '2026-03-09', end_date: '2026-05-29' },
];

const SeasonTimeline: React.FC<{ splits?: SeasonSplit[] }> = ({ splits }) => {
  const displaySplits = splits && splits.length > 0 ? splits : MOCK_SPLITS;
  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    upcoming: { bg: 'rgba(107,114,128,0.1)', text: '#6b7280', dot: '#6b7280' },
    active: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', dot: '#6366f1' },
    playoffs: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', dot: '#f59e0b' },
    completed: { bg: 'rgba(16,185,129,0.08)', text: '#34d399', dot: '#10b981' },
  };

  return (
    <div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#e5e7eb',
          marginBottom: 20,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        2025–2026 Season
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displaySplits.map((split, i) => {
          const colors = statusColors[split.status];
          return (
            <div
              key={split.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 18px',
                borderRadius: 12,
                background: colors.bg,
                border: `1px solid ${colors.dot}22`,
              }}
            >
              {/* Timeline dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: colors.dot,
                    boxShadow: split.status === 'active' ? `0 0 10px ${colors.dot}55` : undefined,
                  }}
                />
                {i < displaySplits.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      height: 20,
                      background: 'rgba(255,255,255,0.06)',
                      position: 'relative',
                      top: 4,
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#e5e7eb',
                    marginBottom: 2,
                  }}
                >
                  {split.name}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  {new Date(split.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  –{' '}
                  {new Date(split.end_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: colors.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: `1px solid ${colors.dot}33`,
                }}
              >
                {split.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Season path */}
      <div
        style={{
          marginTop: 28,
          padding: 18,
          borderRadius: 12,
          background: 'rgba(17, 24, 39, 0.6)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 14,
          }}
        >
          Championship Path
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            flexWrap: 'wrap',
          }}
        >
          {['Classroom', 'School', 'District', 'Regional', 'State', 'National'].map(
            (level, i, arr) => (
              <React.Fragment key={level}>
                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: i <= 2 ? '#e5e7eb' : '#6b7280',
                    background: i <= 2 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${i <= 2 ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {level}
                </div>
                {i < arr.length - 1 && (
                  <span
                    style={{
                      color: '#4b5563',
                      fontSize: 14,
                      padding: '0 6px',
                    }}
                  >
                    →
                  </span>
                )}
              </React.Fragment>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ────────────────────────────────────────────────────────────

interface LeagueDashboardProps {
  /** When provided, real data replaces mock data. */
  leagueMeta?: {
    id: string;
    name: string;
    level: string;
    region: string;
    bracketName: string | null;
    bracketFormat: string | null;
  };
  initialStandings?: StandingRow[];
  initialBracket?: BracketMatch[];
  initialChampionship?: ChampionshipEntry[];
  initialSplits?: SeasonSplit[];
}

export default function LeagueDashboard({
  leagueMeta,
  initialStandings,
  initialBracket,
  initialChampionship,
  initialSplits,
}: LeagueDashboardProps = {}) {
  const [activeTab, setActiveTab] = useState<TabId>('bracket');
  const [bracketData] = useState<BracketMatch[]>(
    initialBracket && initialBracket.length > 0 ? initialBracket : generateMockBracket
  );
  const [standingsData] = useState<StandingRow[]>(
    initialStandings && initialStandings.length > 0 ? initialStandings : generateMockStandings
  );
  const [championshipData] = useState<ChampionshipEntry[]>(
    initialChampionship && initialChampionship.length > 0 ? initialChampionship : generateMockChampionship
  );

  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: 'bracket', label: 'Bracket', icon: '🏆' },
    { id: 'standings', label: 'Standings', icon: '📊' },
    { id: 'championship', label: 'Championship', icon: '⭐' },
    { id: 'season', label: 'Season', icon: '📅' },
  ];

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
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 28 }}>🏟️</span>
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
            ? `${leagueMeta.region ? leagueMeta.region + ' • ' : ''}${leagueMeta.level}${leagueMeta.bracketFormat ? ' • ' + leagueMeta.bracketFormat : ''} • ${standingsData.length} Mathletes`
            : 'Spring Split 2026 • Single Elimination • 8 Mathletes'}
        </p>
      </div>

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
              background:
                activeTab === tab.id
                  ? 'rgba(99, 102, 241, 0.15)'
                  : 'transparent',
              color:
                activeTab === tab.id ? '#818cf8' : '#6b7280',
              boxShadow:
                activeTab === tab.id
                  ? 'inset 0 0 0 1px rgba(99, 102, 241, 0.2)'
                  : 'none',
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
        {activeTab === 'bracket' && <BracketView matches={bracketData} />}
        {activeTab === 'standings' && <StandingsTable standings={standingsData} />}
        {activeTab === 'championship' && <ChampionshipTracker entries={championshipData} />}
        {activeTab === 'season' && <SeasonTimeline splits={initialSplits} />}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: 10,
          color: '#374151',
          fontWeight: 500,
        }}
      >
        MathAthlone League Engine • Precision Tools built to stay. • © Mpingo Systems LLC
      </div>
    </div>
  );
}
