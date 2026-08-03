'use client';
// =============================================================================
// RosterImportButton — Sprint 9
// =============================================================================
// Thin client wrapper that holds modal open/close state and renders the
// "Import Roster" button in the teacher controls bar.
// =============================================================================

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const RosterImportModal = dynamic(() => import('./RosterImportModal'), { ssr: false });

interface Props {
  leagueId: string;
  leagueName: string;
}

export default function RosterImportButton({ leagueId, leagueName }: Props) {
  const [open, setOpen] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState<number | null>(null);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: 8,
          color: '#a5b4fc',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 15 }}>👥</span>
        Import Roster
        {enrolledCount !== null && (
          <span style={{
            background: '#6366f1',
            color: '#fff',
            borderRadius: 10,
            padding: '1px 7px',
            fontSize: 11,
            fontWeight: 700,
          }}>
            {enrolledCount}
          </span>
        )}
      </button>

      {open && (
        <RosterImportModal
          leagueId={leagueId}
          leagueName={leagueName}
          onClose={() => setOpen(false)}
          onSuccess={(count) => {
            setEnrolledCount(count);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
