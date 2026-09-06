import { AlertTriangle, ClipboardCheck } from 'lucide-react';

import {
  getReadinessClasses,
  type ContentReadiness,
} from '@/lib/content/readiness';

interface ContentReadinessNoticeProps {
  readiness: ContentReadiness;
  selectedConceptCount: number;
  missingAnnouncedSkillCount?: number;
  purpose?: 'standalone_practice' | 'competition_preparation';
  compact?: boolean;
}

/**
 * Staff-facing only. It intentionally communicates the exact recorded gate
 * status and does not certify a scope as classroom-ready by implication.
 */
export function ContentReadinessNotice({
  readiness,
  selectedConceptCount,
  missingAnnouncedSkillCount = 0,
  purpose,
  compact = false,
}: ContentReadinessNoticeProps) {
  const classes = getReadinessClasses(readiness.tone);
  const hasSelection = selectedConceptCount > 0;
  const needsManualBriefingLabel =
    purpose === 'competition_preparation' && hasSelection && missingAnnouncedSkillCount > 0;

  return (
    <aside
      className={`rounded-xl border px-4 py-3 ${classes.container}`}
      aria-live="polite"
      aria-label="Content readiness status"
    >
      <div className="flex items-start gap-2.5">
        {readiness.classroomReady ? (
          <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">Content readiness</p>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${classes.badge}`}>
              {readiness.label}
            </span>
          </div>
          <p className={`mt-1 text-xs leading-relaxed ${compact ? '' : 'max-w-3xl'}`}>
            {readiness.summary}
          </p>
          {readiness.auditRecord && (
            <p className="mt-1.5 text-[11px] font-medium opacity-80">
              Recorded audit: {readiness.auditRecord}
            </p>
          )}
          {needsManualBriefingLabel && (
            <p className="mt-2 rounded-lg border border-current/20 bg-white/60 px-2.5 py-2 text-xs font-medium leading-relaxed">
              {missingAnnouncedSkillCount === 1
                ? 'One selected concept has no approved student-facing skill label. Competition-preparation worksheet generation will be blocked until manual curriculum review supplies it.'
                : `${missingAnnouncedSkillCount} selected concepts have no approved student-facing skill labels. Competition-preparation worksheet generation will be blocked until manual curriculum review supplies them.`}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
