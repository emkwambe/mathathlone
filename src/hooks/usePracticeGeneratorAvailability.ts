'use client';

import { useEffect, useMemo, useState } from 'react';

export type PracticeGeneratorAvailabilityState =
  | { status: 'idle' | 'loading'; unavailableConceptIds: Set<string>; error: null }
  | { status: 'ready'; unavailableConceptIds: Set<string>; error: null }
  | { status: 'error'; unavailableConceptIds: Set<string>; error: string };

type StoredAvailabilityState = PracticeGeneratorAvailabilityState & {
  conceptIdsKey: string;
};

const IDLE_AVAILABILITY: PracticeGeneratorAvailabilityState = {
  status: 'idle',
  unavailableConceptIds: new Set(),
  error: null,
};

const LOADING_AVAILABILITY: PracticeGeneratorAvailabilityState = {
  status: 'loading',
  unavailableConceptIds: new Set(),
  error: null,
};

/**
 * Performs a read-only preflight against the same deterministic generator
 * registry that the worksheet API uses. It returns availability metadata only:
 * no questions, answers, scores, or records are created or exposed.
 */
export function usePracticeGeneratorAvailability(
  conceptIds: readonly string[],
  enabled: boolean,
): PracticeGeneratorAvailabilityState {
  const conceptIdsKey = useMemo(
    () => Array.from(new Set(conceptIds)).sort().join(','),
    [conceptIds],
  );
  const [state, setState] = useState<StoredAvailabilityState>({
    ...IDLE_AVAILABILITY,
    conceptIdsKey: '',
  });

  useEffect(() => {
    if (!enabled || !conceptIdsKey) return;

    let cancelled = false;
    void fetch(`/api/assessment/generate?conceptIds=${encodeURIComponent(conceptIdsKey)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok || typeof payload !== 'object' || payload === null) {
          throw new Error(
            (payload as { error?: string } | null)?.error
              ?? 'Could not check practice-generator availability.',
          );
        }
        const implemented = (payload as { implementedConceptIds?: unknown }).implementedConceptIds;
        if (!Array.isArray(implemented) || !implemented.every((id) => typeof id === 'string')) {
          throw new Error('Could not verify practice-generator availability.');
        }
        return new Set(implemented);
      })
      .then((implementedConceptIds) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          unavailableConceptIds: new Set(
            conceptIdsKey.split(',').filter((conceptId) => !implementedConceptIds.has(conceptId)),
          ),
          error: null,
          conceptIdsKey,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          unavailableConceptIds: new Set(),
          error: error instanceof Error ? error.message : 'Could not check practice-generator availability.',
          conceptIdsKey,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [conceptIdsKey, enabled]);

  if (!enabled || !conceptIdsKey) return IDLE_AVAILABILITY;
  if (state.conceptIdsKey !== conceptIdsKey) return LOADING_AVAILABILITY;
  return state;
}
