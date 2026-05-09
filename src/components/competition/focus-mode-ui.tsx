// =============================================================================
// MathAthlone Focus Mode UI Components
// =============================================================================
// src/components/competition/focus-mode-ui.tsx
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  X, 
  Eye, 
  Lock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { FocusViolation, IntegrityLevel } from '@/lib/competition/focus-mode';

// -----------------------------------------------------------------------------
// Warning Overlay Component
// -----------------------------------------------------------------------------

interface FocusWarningOverlayProps {
  isVisible: boolean;
  message: string;
  violationCount: number;
  maxViolations: number;
  penaltySeconds?: number;
  onDismiss: () => void;
}

export function FocusWarningOverlay({
  isVisible,
  message,
  violationCount,
  maxViolations,
  penaltySeconds,
  onDismiss,
}: FocusWarningOverlayProps) {
  const [countdown, setCountdown] = useState(penaltySeconds || 5);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onDismiss]);

  useEffect(() => {
    setCountdown(penaltySeconds || 5);
  }, [penaltySeconds, isVisible]);

  if (!isVisible) return null;

  const severity = violationCount >= maxViolations - 1 ? 'critical' : 
                   violationCount >= maxViolations - 2 ? 'warning' : 'info';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`
        max-w-md w-full mx-4 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200
        ${severity === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-600' :
          severity === 'warning' ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
          'bg-gradient-to-br from-amber-400 to-yellow-500'}
      `}>
        <div className="flex items-start gap-4">
          <div className={`
            w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
            ${severity === 'critical' ? 'bg-white/20' : 'bg-white/30'}
            animate-pulse
          `}>
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-1">
              {severity === 'critical' ? 'Final Warning!' : 'Focus Lost'}
            </h3>
            <p className="text-white/90 text-sm mb-3">
              {message}
            </p>
            
            {/* Violation counter */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                {Array.from({ length: maxViolations }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < violationCount 
                        ? 'bg-white' 
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/80 text-xs">
                {violationCount} of {maxViolations} violations
              </span>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="text-center">
            <div className="text-4xl font-bold text-white font-mono">
              {countdown}
            </div>
            <div className="text-white/70 text-xs">seconds</div>
          </div>
        </div>

        {penaltySeconds && penaltySeconds > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Clock className="w-4 h-4" />
              <span>+{penaltySeconds}s penalty applied to your time</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Flagged Banner Component
// -----------------------------------------------------------------------------

interface FlaggedBannerProps {
  reason: string;
  onAcknowledge?: () => void;
}

export function FlaggedBanner({ reason, onAcknowledge }: FlaggedBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Session Flagged for Review</p>
            <p className="text-sm text-red-100">{reason}</p>
          </div>
        </div>
        {onAcknowledge && (
          <button
            onClick={onAcknowledge}
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            I Understand
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Focus Mode Status Indicator
// -----------------------------------------------------------------------------

interface FocusModeStatusProps {
  isActive: boolean;
  integrityLevel: IntegrityLevel;
  violationCount: number;
  maxViolations: number;
  isFlagged: boolean;
}

export function FocusModeStatus({
  isActive,
  integrityLevel,
  violationCount,
  maxViolations,
  isFlagged,
}: FocusModeStatusProps) {
  const levelColors: Record<IntegrityLevel, string> = {
    practice: 'bg-cyan-500',
    school: 'bg-green-500',
    district: 'bg-yellow-500',
    regional: 'bg-orange-500',
    state: 'bg-red-500',
    national: 'bg-purple-500',
  };

  const levelLabels: Record<IntegrityLevel, string> = {
    practice: 'Practice',
    school: 'School',
    district: 'District',
    regional: 'Regional',
    state: 'State',
    national: 'National',
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Integrity level badge */}
      <div className={`
        px-2.5 py-1 rounded-full text-white font-medium text-xs
        ${levelColors[integrityLevel]}
      `}>
        {levelLabels[integrityLevel]}
      </div>

      {/* Focus mode indicator */}
      {isActive && (
        <div className="flex items-center gap-1.5 text-gray-600">
          <Lock className="w-4 h-4" />
          <span>Focus Mode</span>
        </div>
      )}

      {/* Violation indicator */}
      {violationCount > 0 && (
        <div className={`
          flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
          ${isFlagged 
            ? 'bg-red-100 text-red-700' 
            : 'bg-amber-100 text-amber-700'}
        `}>
          {isFlagged ? (
            <XCircle className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
          <span>{violationCount}/{maxViolations}</span>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Pre-Competition Integrity Check Modal
// -----------------------------------------------------------------------------

interface IntegrityCheckModalProps {
  isOpen: boolean;
  integrityLevel: IntegrityLevel;
  requirements: {
    focusMode: boolean;
    fullscreen: boolean;
    lockdown: boolean;
  };
  onAccept: () => void;
  onDecline: () => void;
}

export function IntegrityCheckModal({
  isOpen,
  integrityLevel,
  requirements,
  onAccept,
  onDecline,
}: IntegrityCheckModalProps) {
  const [accepted, setAccepted] = useState({
    rules: false,
    monitoring: false,
    consequences: false,
  });

  const allAccepted = Object.values(accepted).every(Boolean);

  if (!isOpen) return null;

  const levelDescriptions: Record<IntegrityLevel, string> = {
    practice: 'This is a practice session with minimal monitoring.',
    school: 'This is a school league Heat. Focus Mode is enabled.',
    district: 'This is a district competition. All activity is monitored and reviewed.',
    regional: 'This is a regional qualifier. Teacher attestation is required.',
    state: 'This is a state championship. Lockdown browser and supervision required.',
    national: 'This is a national final. Full proctoring and identity verification required.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-w-lg w-full mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Competition Integrity</h2>
              <p className="text-indigo-200 text-sm capitalize">{integrityLevel} Level</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {levelDescriptions[integrityLevel]}
          </p>

          {/* Requirements list */}
          <div className="space-y-3 mb-6">
            {requirements.focusMode && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <Eye className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-amber-800">
                  Tab switches and window changes will be detected and logged
                </span>
              </div>
            )}
            {requirements.fullscreen && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Lock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Fullscreen mode is required throughout the Heat
                </span>
              </div>
            )}
            {requirements.lockdown && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-800">
                  Lockdown browser mode — all other applications will be blocked
                </span>
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted.rules}
                onChange={(e) => setAccepted((prev) => ({ ...prev, rules: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                I understand the competition rules and will not use external resources
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted.monitoring}
                onChange={(e) => setAccepted((prev) => ({ ...prev, monitoring: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                I consent to browser activity monitoring during this Heat
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted.consequences}
                onChange={(e) => setAccepted((prev) => ({ ...prev, consequences: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                I understand that violations may result in penalties or disqualification
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              disabled={!allAccepted}
              className={`
                flex-1 px-4 py-3 rounded-xl font-medium transition-all
                ${allAccepted
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              Begin Heat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Violations Summary (for teacher dashboard)
// -----------------------------------------------------------------------------

interface ViolationsSummaryProps {
  violations: FocusViolation[];
  participantName: string;
  isFlagged: boolean;
  integrityScore: number;
}

export function ViolationsSummary({
  violations,
  participantName,
  isFlagged,
  integrityScore,
}: ViolationsSummaryProps) {
  const violationTypeLabels: Record<string, string> = {
    tab_switch: 'Tab switch',
    window_blur: 'Window blur',
    fullscreen_exit: 'Fullscreen exit',
    copy_attempt: 'Copy attempt',
    paste_attempt: 'Paste attempt',
    right_click: 'Right-click',
    dev_tools: 'Dev tools opened',
    screenshot_attempt: 'Screenshot attempt',
    lockdown_exit: 'Lockdown exit',
  };

  const totalAwayTime = violations.reduce((sum, v) => sum + (v.duration_ms || 0), 0);
  const totalPenalty = violations.reduce((sum, v) => sum + (v.penalty_seconds || 0), 0);

  return (
    <div className={`
      rounded-xl border p-4
      ${isFlagged ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
            ${isFlagged ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-700'}
          `}>
            {participantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{participantName}</p>
            <p className="text-sm text-gray-500">
              {violations.length} violation{violations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Integrity score */}
        <div className={`
          px-3 py-1.5 rounded-lg text-sm font-medium
          ${integrityScore >= 80 ? 'bg-green-100 text-green-700' :
            integrityScore >= 50 ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'}
        `}>
          {integrityScore}/100 integrity
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-100 rounded-lg p-2 text-center">
          <p className="text-lg font-semibold text-gray-900">{violations.length}</p>
          <p className="text-xs text-gray-500">Violations</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-2 text-center">
          <p className="text-lg font-semibold text-gray-900">
            {Math.round(totalAwayTime / 1000)}s
          </p>
          <p className="text-xs text-gray-500">Time away</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-2 text-center">
          <p className="text-lg font-semibold text-gray-900">+{totalPenalty}s</p>
          <p className="text-xs text-gray-500">Penalty</p>
        </div>
      </div>

      {/* Violations list */}
      {violations.length > 0 && (
        <div className="space-y-2">
          {violations.map((v, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm py-2 border-t border-gray-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Q{v.question_number}</span>
                <span className="text-gray-900">
                  {violationTypeLabels[v.violation_type] || v.violation_type}
                </span>
              </div>
              {v.duration_ms && (
                <span className="text-gray-500">
                  {Math.round(v.duration_ms / 1000)}s away
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Flagged indicator */}
      {isFlagged && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-sm font-medium">Flagged for review</span>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Export all components
// -----------------------------------------------------------------------------

export default {
  FocusWarningOverlay,
  FlaggedBanner,
  FocusModeStatus,
  IntegrityCheckModal,
  ViolationsSummary,
};
