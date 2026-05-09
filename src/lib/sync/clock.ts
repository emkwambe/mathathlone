// ============================================
// CLOCK SYNCHRONIZATION MODULE
// Ensures fair Time scoring across all devices
// ============================================

import type { ClockSyncData } from '@/types/database';

// ============================================
// CONSTANTS
// ============================================

const SYNC_ENDPOINT = '/api/time';
const SYNC_SAMPLES = 5;           // Number of round-trips to average
const SYNC_INTERVAL_MS = 60000;   // Re-sync every 60 seconds
const MAX_ACCEPTABLE_DRIFT_MS = 200; // Maximum acceptable clock drift

// ============================================
// STATE
// ============================================

let clockOffset = 0;              // Milliseconds to add to local time
let lastSyncTime = 0;
let syncInProgress = false;

// ============================================
// SYNC ALGORITHM
// ============================================

/**
 * Perform a single round-trip time measurement
 */
async function measureRoundTrip(): Promise<{
  offset: number;
  latency: number;
} | null> {
  const t0 = Date.now();
  
  try {
    const response = await fetch(SYNC_ENDPOINT, { 
      method: 'GET',
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('[Sync] Server error:', response.status);
      return null;
    }
    
    const t3 = Date.now();
    const data = await response.json();
    const serverTime = data.timestamp;
    
    // NTP-style calculation
    // t0 = client send time
    // t1 = server receive time ≈ serverTime
    // t2 = server send time ≈ serverTime
    // t3 = client receive time
    
    const roundTrip = t3 - t0;
    const oneWayLatency = roundTrip / 2;
    
    // Estimated server time when response arrived
    const estimatedServerNow = serverTime + oneWayLatency;
    
    // Offset = how much to add to client time to get server time
    const offset = estimatedServerNow - t3;
    
    return {
      offset,
      latency: oneWayLatency,
    };
  } catch (error) {
    console.error('[Sync] Network error:', error);
    return null;
  }
}

/**
 * Perform multiple round-trips and calculate median offset
 * Median is more robust to outliers than mean
 */
export async function synchronizeClock(): Promise<ClockSyncData | null> {
  if (syncInProgress) {
    console.warn('[Sync] Already in progress');
    return null;
  }
  
  syncInProgress = true;
  console.log('[Sync] Starting clock synchronization...');
  
  const measurements: Array<{ offset: number; latency: number }> = [];
  
  for (let i = 0; i < SYNC_SAMPLES; i++) {
    const result = await measureRoundTrip();
    if (result) {
      measurements.push(result);
    }
    // Small delay between samples
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  syncInProgress = false;
  
  if (measurements.length === 0) {
    console.error('[Sync] All measurements failed');
    return null;
  }
  
  // Sort by latency and take median
  measurements.sort((a, b) => a.latency - b.latency);
  const medianIndex = Math.floor(measurements.length / 2);
  const median = measurements[medianIndex];
  
  // Update global offset
  clockOffset = median.offset;
  lastSyncTime = Date.now();
  
  const syncData: ClockSyncData = {
    server_time: getServerTime(),
    client_time: Date.now(),
    offset: clockOffset,
    latency: median.latency,
  };
  
  console.log(`[Sync] Complete. Offset: ${clockOffset}ms, Latency: ${median.latency}ms`);
  
  return syncData;
}

// ============================================
// TIME FUNCTIONS
// ============================================

/**
 * Get current server time (client time + offset)
 */
export function getServerTime(): number {
  return Date.now() + clockOffset;
}

/**
 * Get current offset
 */
export function getClockOffset(): number {
  return clockOffset;
}

/**
 * Check if clock is synchronized (synced recently)
 */
export function isClockSynced(): boolean {
  return lastSyncTime > 0 && (Date.now() - lastSyncTime) < SYNC_INTERVAL_MS * 2;
}

/**
 * Check if drift is acceptable
 */
export function isDriftAcceptable(): boolean {
  return Math.abs(clockOffset) < MAX_ACCEPTABLE_DRIFT_MS;
}

// ============================================
// AUTO-SYNC
// ============================================

let syncIntervalId: NodeJS.Timeout | null = null;

/**
 * Start automatic periodic synchronization
 */
export function startAutoSync(): void {
  if (syncIntervalId) return;
  
  // Initial sync
  synchronizeClock();
  
  // Periodic sync
  syncIntervalId = setInterval(() => {
    synchronizeClock();
  }, SYNC_INTERVAL_MS);
  
  console.log('[Sync] Auto-sync started');
}

/**
 * Stop automatic synchronization
 */
export function stopAutoSync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('[Sync] Auto-sync stopped');
  }
}

// ============================================
// TIMESTAMP HELPERS
// ============================================

/**
 * Create a synchronized timestamp for submission
 */
export function createSyncedTimestamp(): string {
  return new Date(getServerTime()).toISOString();
}

/**
 * Calculate time elapsed since a synced timestamp
 */
export function getElapsedMs(startTimestamp: string): number {
  const startTime = new Date(startTimestamp).getTime();
  return getServerTime() - startTime;
}

// ============================================
// EXPORTS
// ============================================

export const clockSync = {
  synchronizeClock,
  getServerTime,
  getClockOffset,
  isClockSynced,
  isDriftAcceptable,
  startAutoSync,
  stopAutoSync,
  createSyncedTimestamp,
  getElapsedMs,
  MAX_ACCEPTABLE_DRIFT_MS,
};

export default clockSync;
