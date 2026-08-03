'use client';
// =============================================================================
// RosterImportModal — Sprint 9 Bulk Enrollment
// =============================================================================
// Teacher pastes a list of student names (one per line or comma-separated).
// On submit, calls POST /api/league/[id]/roster/import.
// On success, shows a printable PDF of login cards (name + username + PIN).
// =============================================================================

import React, { useState, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RosterEntry {
  display_name: string;
  username: string;
  pin: string;
  user_id: string;
  already_existed: boolean;
}

interface RosterImportModalProps {
  leagueId: string;
  leagueName: string;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

// ── PDF Login Card Generator ──────────────────────────────────────────────────

function generateLoginCardHTML(entries: RosterEntry[], leagueName: string): string {
  const cards = entries
    .map(
      (e) => `
    <div class="card">
      <div class="card-header">
        <span class="logo">MathAthlone</span>
        <span class="league">${escapeHtml(leagueName)}</span>
      </div>
      <div class="student-name">${escapeHtml(e.display_name)}</div>
      <div class="credentials">
        <div class="cred-row">
          <span class="cred-label">Username</span>
          <span class="cred-value">${escapeHtml(e.username)}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">PIN</span>
          <span class="cred-value pin">${e.already_existed ? '(existing account)' : e.pin}</span>
        </div>
      </div>
      <div class="url">mathathlone.vercel.app</div>
    </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Login Cards — ${escapeHtml(leagueName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; }
    .page { display: flex; flex-wrap: wrap; gap: 12px; padding: 20px; }
    .card {
      width: 240px;
      border: 2px solid #6366f1;
      border-radius: 10px;
      padding: 14px;
      page-break-inside: avoid;
      background: #f9f9ff;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .logo { font-weight: 800; font-size: 11px; color: #6366f1; }
    .league { font-size: 9px; color: #6b7280; max-width: 120px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .student-name { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    .credentials { margin-bottom: 8px; }
    .cred-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .cred-label { font-size: 9px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
    .cred-value { font-size: 12px; font-weight: 700; color: #111827; font-family: 'Courier New', monospace; }
    .cred-value.pin { font-size: 18px; color: #6366f1; letter-spacing: 0.15em; }
    .url { font-size: 8px; color: #9ca3af; text-align: center; margin-top: 4px; }
    @media print {
      body { background: white; }
      .page { padding: 10px; gap: 8px; }
    }
  </style>
</head>
<body>
  <div class="page">${cards}</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openLoginCardPDF(entries: RosterEntry[], leagueName: string) {
  const html = generateLoginCardHTML(entries, leagueName);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      setTimeout(() => win.print(), 500);
    };
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function RosterImportModal({
  leagueId,
  leagueName,
  onClose,
  onSuccess,
}: RosterImportModalProps) {
  const [csv, setCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ enrolled: RosterEntry[]; skipped: string[] } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const nameCount = csv
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length;

  async function handleImport() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/league/${leagueId}/roster/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Import failed');
        return;
      }
      setResult(data);
      onSuccess?.(data.enrolled.length);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  };
  const modal: React.CSSProperties = {
    background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 32, width: '100%', maxWidth: 560,
    maxHeight: '90vh', overflowY: 'auto',
  };
  const title: React.CSSProperties = {
    fontSize: 20, fontWeight: 700, color: '#e5e7eb', marginBottom: 4,
  };
  const subtitle: React.CSSProperties = {
    fontSize: 13, color: '#9ca3af', marginBottom: 24,
  };
  const label: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block',
  };
  const textarea: React.CSSProperties = {
    width: '100%', minHeight: 180, background: '#0d0d1a',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
    color: '#e5e7eb', fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
    padding: '12px 14px', resize: 'vertical', outline: 'none',
  };
  const hint: React.CSSProperties = {
    fontSize: 11, color: '#6b7280', marginTop: 6,
  };
  const btnRow: React.CSSProperties = {
    display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end',
  };
  const btnPrimary: React.CSSProperties = {
    background: '#6366f1', color: '#fff', border: 'none',
    borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
  };
  const btnSecondary: React.CSSProperties = {
    background: 'transparent', color: '#9ca3af',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '10px 22px', fontSize: 14, cursor: 'pointer',
  };

  // ── Success view ─────────────────────────────────────────────────────────────

  if (result) {
    const newStudents = result.enrolled.filter((e) => !e.already_existed);
    const existingStudents = result.enrolled.filter((e) => e.already_existed);

    return (
      <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={modal}>
          <div style={title}>Roster Imported</div>
          <div style={subtitle}>{leagueName}</div>

          <div style={{
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 10, padding: '16px 20px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#a5b4fc' }}>
              {result.enrolled.length}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>students enrolled</div>
            {result.skipped.length > 0 && (
              <div style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>
                {result.skipped.length} skipped due to errors: {result.skipped.join(', ')}
              </div>
            )}
          </div>

          {newStudents.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                New Accounts Created ({newStudents.length})
              </div>
              <div style={{ background: '#0d0d1a', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Name', 'Username', 'PIN'].map((h) => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {newStudents.map((e, i) => (
                      <tr key={e.user_id} style={{ borderBottom: i < newStudents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <td style={{ padding: '8px 12px', color: '#e5e7eb' }}>{e.display_name}</td>
                        <td style={{ padding: '8px 12px', color: '#a5b4fc', fontFamily: 'monospace' }}>{e.username}</td>
                        <td style={{ padding: '8px 12px', color: '#6366f1', fontFamily: 'monospace', fontWeight: 700, fontSize: 16, letterSpacing: '0.1em' }}>{e.pin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {existingStudents.length > 0 && (
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
              {existingStudents.length} existing account{existingStudents.length > 1 ? 's' : ''} enrolled: {existingStudents.map((e) => e.display_name).join(', ')}
            </div>
          )}

          <div style={btnRow}>
            {newStudents.length > 0 && (
              <button
                style={{ ...btnPrimary, background: '#059669' }}
                onClick={() => openLoginCardPDF(newStudents, leagueName)}
              >
                Print Login Cards
              </button>
            )}
            <button style={btnSecondary} onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Input view ────────────────────────────────────────────────────────────────

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={title}>Import Roster</div>
        <div style={subtitle}>{leagueName} — paste student names below</div>

        <label style={label}>Student Names</label>
        <textarea
          ref={textareaRef}
          style={textarea}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={"Jane Smith\nJohn Doe\nAlex Johnson\n..."}
          spellCheck={false}
        />
        <div style={hint}>
          One name per line (or comma-separated). Maximum 200 students.
          {nameCount > 0 && (
            <span style={{ color: '#a5b4fc', marginLeft: 8 }}>{nameCount} name{nameCount !== 1 ? 's' : ''} detected</span>
          )}
        </div>

        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, fontSize: 13, color: '#f87171',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 16, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
          New students will receive a generated username and 4-digit PIN.
          Print login cards after import to hand out to students.
          Existing students (matched by name + school) will be enrolled without a new account.
        </div>

        <div style={btnRow}>
          <button style={btnSecondary} onClick={onClose} disabled={loading}>Cancel</button>
          <button
            style={btnPrimary}
            onClick={handleImport}
            disabled={loading || nameCount === 0}
          >
            {loading ? 'Importing…' : `Import ${nameCount > 0 ? nameCount : ''} Students`}
          </button>
        </div>
      </div>
    </div>
  );
}
