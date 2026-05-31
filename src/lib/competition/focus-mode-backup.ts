// src/lib/competition/focus-mode.ts

export interface FocusViolation {
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'copy_attempt';
  timestamp: number;
  question_number: number;
  duration_ms?: number;
}

export class FocusMode {
  private violations: FocusViolation[] = [];
  private isActive = false;
  private blurStart: number | null = null;
  private onViolation: (v: FocusViolation) => void;
  private currentQuestion: number = 1;

  constructor(onViolation: (v: FocusViolation) => void) {
    this.onViolation = onViolation;
  }

  start() {
    this.isActive = true;
    
    // Tab visibility (most reliable)
    document.addEventListener('visibilitychange', this.handleVisibility);
    
    // Window blur (catches alt-tab)
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('focus', this.handleFocus);
    
    // Block copy/paste
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('contextmenu', this.handleContextMenu);
    
    // Fullscreen exit detection
    document.addEventListener('fullscreenchange', this.handleFullscreen);
  }

  stop() {
    this.isActive = false;
    document.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('focus', this.handleFocus);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('fullscreenchange', this.handleFullscreen);
  }

  private handleVisibility = () => {
    if (document.hidden && this.isActive) {
      this.recordViolation('tab_switch');
    }
  };

  private handleBlur = () => {
    if (this.isActive) {
      this.blurStart = Date.now();
    }
  };

  private handleFocus = () => {
    if (this.blurStart && this.isActive) {
      const duration = Date.now() - this.blurStart;
      if (duration > 500) { // Ignore brief focus losses
        this.recordViolation('window_blur', duration);
      }
      this.blurStart = null;
    }
  };

  private handleCopy = (e: ClipboardEvent) => {
    if (this.isActive) {
      e.preventDefault();
      this.recordViolation('copy_attempt');
    }
  };

  private handleContextMenu = (e: MouseEvent) => {
    if (this.isActive) e.preventDefault();
  };

  private handleFullscreen = () => {
    if (!document.fullscreenElement && this.isActive) {
      this.recordViolation('fullscreen_exit');
    }
  };

  private recordViolation(type: FocusViolation['type'], duration?: number) {
    const violation: FocusViolation = {
      type,
      timestamp: Date.now(),
      question_number: this.currentQuestion,
      duration_ms: duration,
    };
    this.violations.push(violation);
    this.onViolation(violation);
  }

  setCurrentQuestion(num: number) {
    this.currentQuestion = num;
  }

  getViolations() {
    return this.violations;
  }

  getViolationCount() {
    return this.violations.length;
  }
}