// =============================================================================
// SwissRoundView.tsx
// =============================================================================
// Renders the Swiss System round view inside the league dashboard Bracket tab.
// Shows current round pairings as matchup cards, round progress, and teacher
// controls:
//   - "Start Swiss Bracket" (when not started)
//   - "Record Result" button on each pending pairing card (teacher only)
//   - "Start Round N →" advance button when current round is fully complete
// =============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import type { SwissRoundStatus, SwissPairingRow } from '@/lib/competition/swiss-service';

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl: string | null; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, hsl(${hue},65%,50%), hsl(${hue + 30},55%,40%))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.35,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function PlayerSlot({
  player,
  isWinner,
  cta,
  isBye,
}: {
  player: SwissPairingRow['player1'] | null;
  isWinner: boolean;
  cta: number | null;
  isBye?: boolean;
}) {
  if (isBye) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', opacity: 0.4 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#374151', flexShrink: 0 }} />
        <span style={{ color: '#9ca3af', fontSize: 14, fontStyle: 'italic' }}>BYE</span>
      </div>
    );
  }
  if (!player) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', opacity: 0.4 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#374151', flexShrink: 0 }} />
        <span style={{ color: '#9ca3af', fontSize: 14 }}>TBD</span>
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: isWinner ? 'rgba(16,185,129,0.12)' : 'transparent',
        borderRadius: 8,
        transition: 'background 0.15s',
      }}
    >
      <Avatar name={player.name} avatarUrl={player.avatarUrl} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#f9fafb', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.name}
          </span>
          {isWinner && (
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: 4 }}>
              WIN
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>ELO {Math.round(player.elo)}</span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>{player.points} pts</span>
        </div>
      </div>
      {cta != null && (
        <span style={{ fontSize: 16, fontWeight: 700, color: isWinner ? '#10b981' : '#9ca3af', minWidth: 40, textAlign: 'right' }}>
          {cta.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ── Record Result Modal ───────────────────────────────────────────────────────

interface RecordResultModalProps {
  pairing: SwissPairingRow;
  onClose: () => void;
  onSubmit: (pairingId: string, winnerId: string, p1Cta: number, p2Cta: number) => Promise<void>;
}

function RecordResultModal({ pairing, onClose, onSubmit }: RecordResultModalProps) {
  const [winnerId, setWinnerId] = useState<string>(pairing.player1.id);
  const [p1Cta, setP1Cta] = useState<string>('');
  const [p2Cta, setP2Cta] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = parseFloat(p1Cta);
    const p2 = parseFloat(p2Cta);
    if (isNaN(p1) || isNaN(p2) || p1 < 0 || p2 < 0) {
      setErr('Enter valid CTA scores (≥ 0) for both players.');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await onSubmit(pairing.id, winnerId, p1, p2);
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const p2 = pairing.player2;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#111827',
          border: '1px solid #374151',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <h3 style={{ color: '#f9fafb', fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
          Record Result — Board {pairing.boardNumber}
        </h3>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 20px' }}>
          Select the winner and enter CTA scores.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Winner selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em' }}>
              WINNER
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Player 1 option */}
              <label
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  background: winnerId === pairing.player1.id ? 'rgba(99,102,241,0.15)' : '#1f2937',
                  border: `1px solid ${winnerId === pairing.player1.id ? '#6366f1' : '#374151'}`,
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="winner"
                  value={pairing.player1.id}
                  checked={winnerId === pairing.player1.id}
                  onChange={() => setWinnerId(pairing.player1.id)}
                  style={{ accentColor: '#6366f1' }}
                />
                <Avatar name={pairing.player1.name} avatarUrl={pairing.player1.avatarUrl} size={28} />
                <span style={{ color: '#f9fafb', fontSize: 14, fontWeight: 600 }}>{pairing.player1.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>ELO {Math.round(pairing.player1.elo)}</span>
              </label>

              {/* Player 2 option */}
              {p2 && (
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    background: winnerId === p2.id ? 'rgba(99,102,241,0.15)' : '#1f2937',
                    border: `1px solid ${winnerId === p2.id ? '#6366f1' : '#374151'}`,
                    borderRadius: 8, cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="winner"
                    value={p2.id}
                    checked={winnerId === p2.id}
                    onChange={() => setWinnerId(p2.id)}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <Avatar name={p2.name} avatarUrl={p2.avatarUrl} size={28} />
                  <span style={{ color: '#f9fafb', fontSize: 14, fontWeight: 600 }}>{p2.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>ELO {Math.round(p2.elo)}</span>
                </label>
              )}
            </div>
          </div>

          {/* CTA scores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.06em' }}>
                {pairing.player1.name.split(' ')[0].toUpperCase()} CTA
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={p1Cta}
                onChange={(e) => setP1Cta(e.target.value)}
                placeholder="0.0"
                required
                style={{
                  width: '100%', padding: '8px 10px',
                  background: '#1f2937', border: '1px solid #374151',
                  borderRadius: 6, color: '#f9fafb', fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.06em' }}>
                {p2 ? p2.name.split(' ')[0].toUpperCase() : 'P2'} CTA
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={p2Cta}
                onChange={(e) => setP2Cta(e.target.value)}
                placeholder="0.0"
                required
                style={{
                  width: '100%', padding: '8px 10px',
                  background: '#1f2937', border: '1px solid #374151',
                  borderRadius: 6, color: '#f9fafb', fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {err && (
            <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
              {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', background: '#1f2937', border: '1px solid #374151', borderRadius: 6, color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 20px',
                background: submitting ? '#374151' : '#6366f1',
                border: 'none', borderRadius: 6,
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Saving…' : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Pairing Card ──────────────────────────────────────────────────────────────

function PairingCard({
  pairing,
  isOwner,
  onRecordResult,
}: {
  pairing: SwissPairingRow;
  isOwner: boolean;
  onRecordResult: (pairing: SwissPairingRow) => void;
}) {
  const isCompleted = pairing.status === 'completed' || pairing.status === 'bye';
  const isLive = pairing.status === 'active';
  const isPending = pairing.status === 'pending';

  return (
    <div
      style={{
        background: '#111827',
        border: `1px solid ${isLive ? '#6366f1' : isCompleted ? '#1f2937' : '#1f2937'}`,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: isLive ? '0 0 0 1px rgba(99,102,241,0.3)' : 'none',
      }}
    >
      {/* Board number + status badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: '#0d1117',
          borderBottom: '1px solid #1f2937',
        }}
      >
        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, letterSpacing: '0.08em' }}>
          BOARD {pairing.boardNumber}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            padding: '2px 8px',
            borderRadius: 4,
            background: isLive
              ? 'rgba(99,102,241,0.2)'
              : isCompleted
              ? 'rgba(16,185,129,0.12)'
              : 'rgba(107,114,128,0.15)',
            color: isLive ? '#818cf8' : isCompleted ? '#10b981' : '#6b7280',
          }}
        >
          {pairing.isBye ? 'BYE' : isLive ? '● LIVE' : isCompleted ? 'DONE' : 'PENDING'}
        </span>
      </div>

      {/* Player 1 */}
      <PlayerSlot
        player={pairing.player1}
        isWinner={pairing.winnerId === pairing.player1.id}
        cta={pairing.player1Cta}
      />

      {/* Divider */}
      <div style={{ height: 1, background: '#1f2937', margin: '0 14px' }} />

      {/* Player 2 */}
      <PlayerSlot
        player={pairing.player2}
        isWinner={pairing.player2 ? pairing.winnerId === pairing.player2.id : false}
        cta={pairing.player2Cta}
        isBye={pairing.isBye}
      />

      {/* Record Result button — teacher only, pending/active matches */}
      {isOwner && !isCompleted && !pairing.isBye && (
        <div style={{ padding: '8px 14px 12px', borderTop: '1px solid #1f2937' }}>
          <button
            onClick={() => onRecordResult(pairing)}
            style={{
              width: '100%',
              padding: '7px 0',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 6,
              color: '#818cf8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            + Record Result
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SwissRoundViewProps {
  leagueId: string;
  bracketId: string | null;
  isOwner: boolean;
  onInit?: () => void;
}

export default function SwissRoundView({
  leagueId,
  bracketId,
  isOwner,
  onInit,
}: SwissRoundViewProps) {
  const [status, setStatus] = useState<SwissRoundStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingPairing, setRecordingPairing] = useState<SwissPairingRow | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!bracketId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/league/swiss/status?leagueId=${leagueId}&bracketId=${bracketId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load Swiss status');
      setStatus(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [leagueId, bracketId]);

  useEffect(() => {
    fetchStatus();
    // Poll every 15s while a round is active
    const interval = setInterval(() => {
      if (status?.roundStatus === 'active') fetchStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus, status?.roundStatus]);

  const handleInit = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/league/swiss/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start Swiss bracket');
      onInit?.();
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceRound = async () => {
    if (!bracketId) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/league/swiss/advance-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId, bracketId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to advance round');
      await fetchStatus();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordResult = async (
    pairingId: string,
    winnerId: string,
    p1Cta: number,
    p2Cta: number
  ) => {
    const res = await fetch('/api/league/swiss/record-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pairingId,
        winnerId,
        player1Cta: p1Cta,
        player2Cta: p2Cta,
        heatId: recordingPairing?.heatId ?? '',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to record result');
    // Refresh status after recording
    await fetchStatus();
  };

  // ── Not started ────────────────────────────────────────────────────────────
  if (!bracketId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          gap: 16,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48 }}>⚡</div>
        <h3 style={{ color: '#f9fafb', fontSize: 20, fontWeight: 700, margin: 0 }}>
          Swiss System Not Started
        </h3>
        <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 360, margin: 0 }}>
          Start the Swiss bracket to generate Round 1 pairings. Every mathlete plays every round — no eliminations.
        </p>
        {isOwner && (
          <button
            onClick={handleInit}
            disabled={actionLoading}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: actionLoading ? '#374151' : '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: actionLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {actionLoading ? 'Starting…' : 'Start Swiss Bracket'}
          </button>
        )}
        {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && !status) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div style={{ color: '#6b7280', fontSize: 14 }}>Loading round data…</div>
      </div>
    );
  }

  if (!status) return null;

  const allRoundsComplete = status.isComplete;
  const canAdvance =
    isOwner &&
    status.roundStatus === 'completed' &&
    !allRoundsComplete;

  const progressPct =
    status.totalPairings > 0
      ? Math.round((status.completedPairs / status.totalPairings) * 100)
      : 0;

  return (
    <>
      {/* Record Result Modal */}
      {recordingPairing && (
        <RecordResultModal
          pairing={recordingPairing}
          onClose={() => setRecordingPairing(null)}
          onSubmit={handleRecordResult}
        />
      )}

      <div style={{ padding: '24px 16px', maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ color: '#f9fafb', fontSize: 20, fontWeight: 700, margin: 0 }}>
              {allRoundsComplete
                ? 'Swiss Phase Complete'
                : `Round ${status.currentRound} of ${status.totalRounds}`}
            </h2>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
              {allRoundsComplete
                ? 'All rounds completed — final standings are set.'
                : `${status.completedPairs} of ${status.totalPairings} pairings completed`}
            </p>
          </div>

          {/* Round progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {[...Array(status.totalRounds)].map((_, i) => {
              const rNum = i + 1;
              const isDone = rNum < status.currentRound;
              const isCurrent = rNum === status.currentRound;
              return (
                <div
                  key={rNum}
                  title={`Round ${rNum}`}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    background: isDone
                      ? '#10b981'
                      : isCurrent
                      ? '#6366f1'
                      : '#1f2937',
                    color: isDone || isCurrent ? '#fff' : '#6b7280',
                    border: isCurrent ? '2px solid #818cf8' : '2px solid transparent',
                  }}
                >
                  {isDone ? '✓' : rNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        {!allRoundsComplete && (
          <div
            style={{
              height: 4,
              background: '#1f2937',
              borderRadius: 2,
              marginBottom: 24,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        )}

        {/* Pairing cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {status.pairings.map((pairing) => (
            <PairingCard
              key={pairing.id}
              pairing={pairing}
              isOwner={isOwner}
              onRecordResult={(p) => setRecordingPairing(p)}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              color: '#ef4444',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Teacher actions */}
        {isOwner && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            {canAdvance && (
              <button
                onClick={handleAdvanceRound}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  background: actionLoading ? '#374151' : '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {actionLoading ? 'Generating…' : `Start Round ${status.currentRound + 1} →`}
              </button>
            )}
            {allRoundsComplete && (
              <div
                style={{
                  padding: '10px 20px',
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 8,
                  color: '#10b981',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                ✓ All {status.totalRounds} rounds complete — check Standings for final rankings
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
