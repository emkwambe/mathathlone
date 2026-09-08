'use client';

import { useEffect, useMemo, useState } from 'react';

export type ConceptSourceState =
  | 'procedural'
  | 'static'
  | 'mixed'
  | 'unverified_static'
  | 'unavailable';

export interface ClientConceptAvailability {
  conceptId: string;
  sourceState: ConceptSourceState;
  implementedGeneratorTypes: string[];
  verifiedStaticItemCount: number;
  unverifiedStaticItemCount: number;
  deliveryAvailable: boolean;
  unavailableReason: string | null;
}

export type PracticeGeneratorAvailabilityState =
  | {
    status: 'idle' | 'loading';
    unavailableConceptIds: Set<string>;
    availabilityByConceptId: ReadonlyMap<string, ClientConceptAvailability>;
    error: null;
  }
  | {
    status: 'ready';
    unavailableConceptIds: Set<string>;
    availabilityByConceptId: ReadonlyMap<string, ClientConceptAvailability>;
    error: null;
  }
  | {
    status: 'error';
    unavailableConceptIds: Set<string>;
    availabilityByConceptId: ReadonlyMap<string, ClientConceptAvailability>;
    error: string;
  };

type StoredAvailabilityState = PracticeGeneratorAvailabilityState & {
  conceptIdsKey: string;
};

const EMPTY_AVAILABILITY = new Map<string, ClientConceptAvailability>();

const IDLE_AVAILABILITY: PracticeGeneratorAvailabilityState = {
  status: 'idle',
  unavailableConceptIds: new Set(),
  availabilityByConceptId: EMPTY_AVAILABILITY,
  error: null,
};

const LOADING_AVAILABILITY: PracticeGeneratorAvailabilityState = {
  status: 'loading',
  unavailableConceptIds: new Set(),
  availabilityByConceptId: EMPTY_AVAILABILITY,
  error: null,
};

function isAvailabilityRow(value: unknown): value is ClientConceptAvailability {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.conceptId === 'string'
    && typeof row.sourceState === 'string'
    && Array.isArray(row.implementedGeneratorTypes)
    && row.implementedGeneratorTypes.every((generatorType) => typeof generatorType === 'string')
    && typeof row.verifiedStaticItemCount === 'number'
    && typeof row.unverifiedStaticItemCount === 'number'
    && typeof row.deliveryAvailable === 'boolean'
    && (typeof row.unavailableReason === 'string' || row.unavailableReason === null);
}

/**
 * Performs a read-only, source-aware preflight against the same deterministic
 * availability contract used at the worksheet boundary. It exposes no questions,
 * answers, scores, or records; it only distinguishes deliverable sources from
 * catalogue entries that are not yet supported by current worksheet/Heat paths.
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
              ?? 'Could not check content-source availability.',
          );
        }
        const rows = (payload as { conceptAvailability?: unknown }).conceptAvailability;
        if (!Array.isArray(rows) || !rows.every(isAvailabilityRow)) {
          throw new Error('Could not verify concept source availability.');
        }
        return rows;
      })
      .then((rows) => {
        if (cancelled) return;
        const availabilityByConceptId = new Map(rows.map((row) => [row.conceptId, row]));
        const requestedIds = conceptIdsKey.split(',');
        setState({
          status: 'ready',
          unavailableConceptIds: new Set(
            requestedIds.filter((conceptId) => !availabilityByConceptId.get(conceptId)?.deliveryAvailable),
          ),
          availabilityByConceptId,
          error: null,
          conceptIdsKey,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          unavailableConceptIds: new Set(),
          availabilityByConceptId: EMPTY_AVAILABILITY,
          error: error instanceof Error ? error.message : 'Could not check content-source availability.',
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
