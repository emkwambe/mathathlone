// =============================================================================
// MathAthlone Focus Mode - Browser Lock System
// =============================================================================
// src/lib/competition/focus-mode.ts
// =============================================================================

import { supabase } from '@/lib/supabase/client';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ViolationType = 
  | 'tab_switch'
  | 'window_blur'
  | 'fullscreen_exit'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'right_click'
  | 'dev_tools'
  | 'screenshot_attempt'
  | 'lockdown_exit';

export type IntegrityLevel = 
  | 'practice'
  | 'school'
  | 'district'
  | 'regional'
  | 'state'
  | 'national';

export interface FocusViolation {
  id?: string;
  heat_participation_id: string;
  violation_type: ViolationType;
  question_number: number;
  timestamp: number;
  duration_ms?: number;
  warning_shown: boolean;
  penalty_applied: boolean;
  penalty_seconds: number;
}

export interface IntegrityConfig {
  level: IntegrityLevel;
  display_name: string;
  focus_mode_enabled: boolean;
  fullscreen_required: boolean;
  copy_paste_blocked: boolean;
  lockdown_browser_required: boolean;
  synchronized_start: boolean;
  teacher_attestation_required: boolean;
  identity_verification_required: boolean;
  session_recording_enabled: boolean;
  anomaly_detection_enabled: boolean;
  in_person_verification_heat: boolean;
  warning_threshold: number;
  penalty_threshold: number;
  flag_threshold: number;
  disqualify_threshold: number;
  time_penalty_seconds: number;
  point_penalty_percent: number;
  results_require_approval: boolean;
  advancement_requires_review: boolean;
}

export interface FocusModeCallbacks {
  onViolation: (violation: FocusViolation, totalCount: number) => void;
  onWarning: (message: string, violationCount: number) => void;
  onPenalty: (seconds: number, totalPenalty: number) => void;
  onFlag: (reason: string) => void;
  onDisqualify: (reason: string) => void;
}

// -----------------------------------------------------------------------------
// Focus Mode Class
// -----------------------------------------------------------------------------

export class FocusMode {
  private isActive = false;
  private participationId: string;
  private config: IntegrityConfig;
  private callbacks: FocusModeCallbacks;
  
  private violations: FocusViolation[] = [];
  private currentQuestion = 1;
  private blurStart: number | null = null;
  private totalPenaltySeconds = 0;
  private isFullscreen = false;

  constructor(
    participationId: string,
    config: IntegrityConfig,
    callbacks: FocusModeCallbacks
  ) {
    this.participationId = participationId;
    this.config = config;
    this.callbacks = callbacks;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  start(): void {
    if (!this.config.focus_mode_enabled) {
      console.log('[FocusMode] Disabled for this integrity level');
      return;
    }

    this.isActive = true;
    console.log(`[FocusMode] Started for level: ${this.config.level}`);

    // Tab visibility (most reliable)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Window blur (catches alt-tab)
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);

    // Copy/paste blocking
    if (this.config.copy_paste_blocked) {
      document.addEventListener('copy', this.handleCopy);
      document.addEventListener('paste', this.handlePaste);
      document.addEventListener('cut', this.handleCopy);
    }

    // Right-click blocking
    document.addEventListener('contextmenu', this.handleContextMenu);

    // Fullscreen monitoring
    if (this.config.fullscreen_required) {
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
      this.requestFullscreen();
    }

    // Dev tools detection (basic)
    this.startDevToolsDetection();

    // Keyboard shortcuts blocking
    document.addEventListener('keydown', this.handleKeydown);
  }

  stop(): void {
    this.isActive = false;
    console.log('[FocusMode] Stopped');

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('paste', this.handlePaste);
    document.removeEventListener('cut', this.handleCopy);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('keydown', this.handleKeydown);

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  setCurrentQuestion(num: number): void {
    this.currentQuestion = num;
  }

  getViolations(): FocusViolation[] {
    return [...this.violations];
  }

  getViolationCount(): number {
    return this.violations.length;
  }

  getTotalPenaltySeconds(): number {
    return this.totalPenaltySeconds;
  }

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  private handleVisibilityChange = (): void => {
    if (!this.isActive) return;

    if (document.hidden) {
      this.blurStart = Date.now();
      this.recordViolation('tab_switch');
    } else if (this.blurStart) {
      const duration = Date.now() - this.blurStart;
      // Update the last violation with duration
      if (this.violations.length > 0) {
        this.violations[this.violations.length - 1].duration_ms = duration;
      }
      this.blurStart = null;
    }
  };

  private handleWindowBlur = (): void => {
    if (!this.isActive) return;
    this.blurStart = Date.now();
  };

  private handleWindowFocus = (): void => {
    if (!this.isActive || !this.blurStart) return;

    const duration = Date.now() - this.blurStart;
    
    // Only record if they were away for more than 500ms (ignore brief focus losses)
    if (duration > 500) {
      this.recordViolation('window_blur', duration);
    }
    
    this.blurStart = null;
  };

  private handleCopy = (e: ClipboardEvent): void => {
    if (!this.isActive) return;
    e.preventDefault();
    this.recordViolation('copy_attempt');
  };

  private handlePaste = (e: ClipboardEvent): void => {
    if (!this.isActive) return;
    e.preventDefault();
    this.recordViolation('paste_attempt');
  };

  private handleContextMenu = (e: MouseEvent): void => {
    if (!this.isActive) return;
    e.preventDefault();
    this.recordViolation('right_click');
  };

  private handleFullscreenChange = (): void => {
    if (!this.isActive) return;

    this.isFullscreen = !!document.fullscreenElement;

    if (!this.isFullscreen && this.config.fullscreen_required) {
      this.recordViolation('fullscreen_exit');
      
      // Re-request fullscreen after a short delay
      setTimeout(() => {
        if (this.isActive && !document.fullscreenElement) {
          this.requestFullscreen();
        }
      }, 1000);
    }
  };

  private handleKeydown = (e: KeyboardEvent): void => {
    if (!this.isActive) return;

    // Block common shortcuts
    const blockedCombos = [
      { ctrl: true, key: 'c' },   // Copy
      { ctrl: true, key: 'v' },   // Paste
      { ctrl: true, key: 'x' },   // Cut
      { ctrl: true, key: 'p' },   // Print
      { ctrl: true, key: 's' },   // Save
      { ctrl: true, key: 'a' },   // Select all
      { ctrl: true, key: 'f' },   // Find
      { ctrl: true, shift: true, key: 'i' },  // Dev tools
      { ctrl: true, shift: true, key: 'j' },  // Dev tools
      { ctrl: true, shift: true, key: 'c' },  // Inspect
      { key: 'F12' },             // Dev tools
      { key: 'PrintScreen' },     // Screenshot
    ];

    const isBlocked = blockedCombos.some(combo => {
      const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true;
      const shiftMatch = combo.shift ? e.shiftKey : !combo.shift || !e.shiftKey;
      const keyMatch = e.key.toLowerCase() === combo.key?.toLowerCase() || e.key === combo.key;
      return ctrlMatch && shiftMatch && keyMatch;
    });

    if (isBlocked) {
      e.preventDefault();
      e.stopPropagation();

      // Record specific violation types
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))) {
        this.recordViolation('dev_tools');
      } else if (e.key === 'PrintScreen') {
        this.recordViolation('screenshot_attempt');
      }
    }

    // Block Escape in fullscreen mode
    if (e.key === 'Escape' && this.config.fullscreen_required && this.isFullscreen) {
      e.preventDefault();
    }
  };

  // ---------------------------------------------------------------------------
  // Dev Tools Detection
  // ---------------------------------------------------------------------------

  private startDevToolsDetection(): void {
    // Method 1: Size-based detection
    const threshold = 160;
    let devtoolsOpen = false;

    const checkDevTools = () => {
      if (!this.isActive) return;

      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if ((widthThreshold || heightThreshold) && !devtoolsOpen) {
        devtoolsOpen = true;
        this.recordViolation('dev_tools');
      } else if (!widthThreshold && !heightThreshold) {
        devtoolsOpen = false;
      }
    };

    // Check periodically
    const interval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(interval);
        return;
      }
      checkDevTools();
    }, 1000);
  }

  // ---------------------------------------------------------------------------
  // Fullscreen Management
  // ---------------------------------------------------------------------------

  private async requestFullscreen(): Promise<void> {
    try {
      const elem = document.documentElement;
      
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      
      this.isFullscreen = true;
    } catch (err) {
      console.warn('[FocusMode] Could not enter fullscreen:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Violation Recording
  // ---------------------------------------------------------------------------

  private async recordViolation(type: ViolationType, duration?: number): Promise<void> {
    const violationCount = this.violations.length + 1;
    
    // Determine response based on thresholds
    const shouldWarn = violationCount <= this.config.warning_threshold;
    const shouldPenalize = violationCount > this.config.warning_threshold && 
                          violationCount <= this.config.flag_threshold;
    const shouldFlag = violationCount >= this.config.flag_threshold;
    const shouldDisqualify = violationCount >= this.config.disqualify_threshold;

    // Calculate penalty
    let penaltySeconds = 0;
    if (shouldPenalize && this.config.time_penalty_seconds > 0) {
      penaltySeconds = this.config.time_penalty_seconds;
      this.totalPenaltySeconds += penaltySeconds;
    }

    // Create violation record
    const violation: FocusViolation = {
      heat_participation_id: this.participationId,
      violation_type: type,
      question_number: this.currentQuestion,
      timestamp: Date.now(),
      duration_ms: duration,
      warning_shown: shouldWarn,
      penalty_applied: shouldPenalize,
      penalty_seconds: penaltySeconds,
    };

    this.violations.push(violation);

    // Persist to database
    await this.persistViolation(violation);

    // Trigger callbacks
    this.callbacks.onViolation(violation, violationCount);

    if (shouldWarn) {
      this.callbacks.onWarning(
        this.getWarningMessage(type, violationCount),
        violationCount
      );
    }

    if (shouldPenalize) {
      this.callbacks.onPenalty(penaltySeconds, this.totalPenaltySeconds);
    }

    if (shouldFlag) {
      this.callbacks.onFlag(`Exceeded violation threshold (${violationCount} violations)`);
    }

    if (shouldDisqualify) {
      this.callbacks.onDisqualify(`Automatic disqualification (${violationCount} violations)`);
      this.stop();
    }

    console.log(`[FocusMode] Violation #${violationCount}: ${type}`, {
      shouldWarn,
      shouldPenalize,
      shouldFlag,
      shouldDisqualify,
      penaltySeconds,
    });
  }

  private async persistViolation(violation: FocusViolation): Promise<void> {
    try {
      const { error } = await supabase
        .from('focus_violations')
        .insert({
          heat_participation_id: violation.heat_participation_id,
          violation_type: violation.violation_type,
          question_number: violation.question_number,
          timestamp: new Date(violation.timestamp).toISOString(),
          duration_ms: violation.duration_ms,
          warning_shown: violation.warning_shown,
          penalty_applied: violation.penalty_applied,
          penalty_seconds: violation.penalty_seconds,
          user_agent: navigator.userAgent,
          screen_resolution: `${screen.width}x${screen.height}`,
        });

      if (error) {
        console.error('[FocusMode] Failed to persist violation:', error);
      }
    } catch (err) {
      console.error('[FocusMode] Error persisting violation:', err);
    }
  }

  private getWarningMessage(type: ViolationType, count: number): string {
    const remaining = this.config.flag_threshold - count;
    
    const messages: Record<ViolationType, string> = {
      tab_switch: 'You switched away from the competition tab.',
      window_blur: 'The competition window lost focus.',
      fullscreen_exit: 'You exited fullscreen mode.',
      copy_attempt: 'Copying is not allowed during competition.',
      paste_attempt: 'Pasting is not allowed during competition.',
      right_click: 'Right-click is disabled during competition.',
      dev_tools: 'Developer tools are not allowed during competition.',
      screenshot_attempt: 'Screenshots are not allowed during competition.',
      lockdown_exit: 'You exited the lockdown browser.',
    };

    const base = messages[type] || 'A focus violation was detected.';
    
    if (remaining > 0) {
      return `${base} This has been logged. ${remaining} more violation${remaining === 1 ? '' : 's'} before automatic flag.`;
    }
    
    return `${base} Your session has been flagged for review.`;
  }
}

// -----------------------------------------------------------------------------
// Helper: Load Integrity Config
// -----------------------------------------------------------------------------

export async function loadIntegrityConfig(level: IntegrityLevel): Promise<IntegrityConfig | null> {
  
  const { data, error } = await supabase
    .from('integrity_configs')
    .select('*')
    .eq('level', level)
    .single();

  if (error) {
    console.error('[FocusMode] Failed to load config:', error);
    return null;
  }

  return data as IntegrityConfig;
}

// -----------------------------------------------------------------------------
// Default Export
// -----------------------------------------------------------------------------

export default FocusMode;
