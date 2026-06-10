// =============================================================================
// MathAthlone — /assessment/[heatId]/[type]  (DEPRECATED)
// =============================================================================
// The assessment generator is now a standalone tool (a sibling to Create Heat),
// no longer tied to a completed heat. This legacy heat-scoped route just
// forwards to the standalone generator.
// =============================================================================

import { redirect } from 'next/navigation';

export default function DeprecatedHeatAssessmentRoute() {
  redirect('/assessment/generate');
}
