'use client';

import { useEffect, useState } from 'react';

export interface BracketResultPlayer {
  id: string;
  name: string;
}

interface BracketResultModalProps {
  match: {
    id: string;
    round: number;
    participant1: BracketResultPlayer;
    participant2: BracketResultPlayer;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function BracketResultModal({
  match,
  onClose,
  onSuccess,
}: BracketResultModalProps) {
  const [winnerId, setWinnerId] = useState(match.participant1.id);
  const [player1Cta, setPlayer1Cta] = useState('');
  const [player2Cta, setPlayer2Cta] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, submitting]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const p1 = Number(player1Cta);
    const p2 = Number(player2Cta);
    if (
      player1Cta.trim() === '' ||
      player2Cta.trim() === '' ||
      !Number.isFinite(p1) ||
      !Number.isFinite(p2) ||
      p1 < 0 ||
      p2 < 0
    ) {
      setError('Enter valid CTA scores of zero or greater for both mathletes.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/league/bracket/record-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          winnerId,
          player1Cta: p1,
          player2Cta: p2,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to record this bracket result.');
      }
      onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to record this bracket result.');
    } finally {
      setSubmitting(false);
    }
  }

  const playerOptions = [match.participant1, match.participant2];

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bracket-result-title"
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#111827',
          border: '1px solid #374151',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}
      >
        <h2 id="bracket-result-title" style={{ color: '#f9fafb', fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>
          Record Bracket Result
        </h2>
        <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>
          Round {match.round}. Select the winner and enter both CTA scores. This updates the bracket, standings, and the league cohort’s ELO.
        </p>

        <form onSubmit={handleSubmit}>
          <fieldset style={{ border: 0, padding: 0, margin: '0 0 18px' }}>
            <legend style={{ color: '#9ca3af', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>
              WINNER
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {playerOptions.map((player) => {
                const selected = winnerId === player.id;
                return (
                  <label
                    key={player.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: submitting ? 'wait' : 'pointer',
                      background: selected ? 'rgba(99,102,241,0.15)' : '#1f2937',
                      border: `1px solid ${selected ? '#6366f1' : '#374151'}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="winner"
                      value={player.id}
                      checked={selected}
                      disabled={submitting}
                      onChange={() => setWinnerId(player.id)}
                      style={{ accentColor: '#6366f1' }}
                    />
                    <span style={{ color: '#f9fafb', fontSize: 14, fontWeight: 600 }}>{player.name}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <label style={{ color: '#9ca3af', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
              {match.participant1.name} CTA
              <input
                inputMode="decimal"
                type="number"
                min="0"
                step="0.1"
                value={player1Cta}
                disabled={submitting}
                onChange={(event) => setPlayer1Cta(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-100 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                aria-label={`${match.participant1.name} CTA score`}
              />
            </label>
            <label style={{ color: '#9ca3af', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
              {match.participant2.name} CTA
              <input
                inputMode="decimal"
                type="number"
                min="0"
                step="0.1"
                value={player2Cta}
                disabled={submitting}
                onChange={(event) => setPlayer2Cta(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-100 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                aria-label={`${match.participant2.name} CTA score`}
              />
            </label>
          </div>

          {error && (
            <p role="alert" style={{ margin: '0 0 14px', color: '#fca5a5', fontSize: 13, lineHeight: 1.45 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? 'Recording…' : 'Record Result'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
