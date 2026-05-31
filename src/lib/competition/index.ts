// =============================================================================
// MathAthlone Competition — Barrel Exports
// =============================================================================
// Public surface for src/lib/competition/*. Importers should pull from this
// file rather than reaching into individual modules.
// =============================================================================

// Question generators (procedural). DifficultyLevel is the canonical type
// here — visual-generators.ts re-declares an identical type but we expose
// only the procedural one from the barrel.
export * from './generators';

// Visual SVG generators (re-export selectively to avoid colliding with
// generators.ts's `DifficultyLevel` type).
export {
  VISUAL_GENERATORS,
  generateVisualQuestion,
  generateVisualQuestionSet,
  genInequalityNumberLine,
  genVerticalLineTest,
  genSlopeInterceptGraph,
  genHorizVertLines,
  genTwoVarInequality,
  genCompareFunctions,
  genSystemGraphing,
  genSystemInequalities,
  genScatterPlot,
  genTransformationType,
  genLineSymmetry,
  genRotationalSymmetry,
  type VisualQuestion,
} from './visual-generators';

// Answer validation + CTA scoring helpers
export * from './validation';

// Service layer — preferred for new code
export * from './heat-service';
export * from './question-delivery';
export * from './scoring-service';

// React hooks for live Heat state (re-exported here for convenience)
export {
  useHeatRealtime,
  useHeatParticipants,
  useHeatSubmissions,
  subscribeToHeat,
  broadcastSubmission,
} from './heat-realtime';

// Unified question service (in-memory question composition)
export * from './question-service';

// Backward-compatible factory + class for existing /compete pages
export {
  HeatEngine,
  createHeatEngine,
  type LegacyHeat,
  type LegacyHeatParticipation,
  type HeatQuestion,
  type LeaderboardEntry,
  type HeatRealtimeEvents,
} from './heat-engine';
