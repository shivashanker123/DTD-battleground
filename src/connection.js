// Connection-status rules shared by the team app, organiser console and projector.
// Plain JavaScript (no React) so the rules can be unit-tested with node --test.

export const CONNECTION_LOST_TEXT = 'Connection lost - reconnecting...';
export const POLL_TIMEOUT_MS = 5_000; // a status poll that takes longer than this counts as failed
export const ACTION_TIMEOUT_MS = 10_000; // button actions get longer: they may wait for a save
const LOST_AFTER_FAILURES = 2;
const LOST_AFTER_SILENCE_MS = 5_000;
const MAX_POLL_DELAY_MS = 5_000;

// Network errors, timeouts (status 0) and server errors (5xx, including "busy" 503) mean the event
// cannot be reached right now. 401 means signed out, and other 4xx are real answers, not outages.
export function isConnectivityError(err) {
  const status = err?.status;
  return typeof status !== 'number' || status === 0 || status >= 500;
}

export const initialConnection = (now) => ({ failures: 0, lastSuccessAt: now, lost: false });

// outcome: { type: 'success' } | { type: 'failure', error } | { type: 'resumed' }
export function nextConnection(prev, outcome, now) {
  if (outcome.type === 'success') return { failures: 0, lastSuccessAt: now, lost: false };
  // A phone waking up or a tab coming back to the front starts a fresh window, so a poll that
  // stalled while the screen was off does not flash the warning.
  if (outcome.type === 'resumed') return { ...prev, failures: 0, lastSuccessAt: now, lost: false };
  if (!isConnectivityError(outcome.error)) return prev;
  const failures = prev.failures + 1;
  const lost = failures >= LOST_AFTER_FAILURES || now - prev.lastSuccessAt >= LOST_AFTER_SILENCE_MS;
  return { failures, lastSuccessAt: prev.lastSuccessAt, lost };
}

// Normal interval while connected; gentle backoff (doubling, capped at 5 s) while failing.
export function pollDelay(baseMs, failures) {
  if (failures <= 0) return baseMs;
  return Math.min(baseMs * 2 ** (failures - 1), Math.max(baseMs, MAX_POLL_DELAY_MS));
}
