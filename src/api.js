// Thin client for the game server. The browser only keeps sign-in tokens; all game state lives on the server.
import { ACTION_TIMEOUT_MS, POLL_TIMEOUT_MS } from './connection';
const TEAM_KEY = 'dtd_team_token';
const ADMIN_KEY = 'dtd_admin_token';

const read = (store, key) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const write = (store, key, value) => {
  try {
    if (value) store.setItem(key, value);
    else store.removeItem(key);
  } catch {
    // Storage blocked (private mode): the session lasts until the tab closes.
  }
};

export const teamToken = {
  get: () => read(localStorage, TEAM_KEY),
  set: (t) => write(localStorage, TEAM_KEY, t)
};
export const adminToken = {
  get: () => read(sessionStorage, ADMIN_KEY),
  set: (t) => write(sessionStorage, ADMIN_KEY, t)
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const networkError = (timedOut) =>
  new ApiError(
    timedOut
      ? "The event server didn't answer in time. Check your Wi-Fi and try again."
      : "Couldn't reach the event server. Check your Wi-Fi and try again.",
    0
  );

// Every request has a deadline, so a dead Wi-Fi link fails fast instead of freezing a screen.
// Status polls get POLL_TIMEOUT_MS; actions get longer because the server saves before replying.
export async function api(path, { body, admin = false, method, timeoutMs } = {}) {
  const token = admin ? adminToken.get() : teamToken.get();
  const isRead = body === undefined && (method ?? 'GET') === 'GET';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? (isRead ? POLL_TIMEOUT_MS : ACTION_TIMEOUT_MS));
  try {
    let res;
    try {
      res = await fetch(`/api${path}`, {
        method: method ?? (body === undefined ? 'GET' : 'POST'),
        headers: {
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal
      });
    } catch {
      throw networkError(controller.signal.aborted);
    }
    let data;
    try {
      data = await res.json();
    } catch {
      // A reply cut off by the timeout is a connection problem, not an empty answer. So is a
      // "successful" non-JSON page, e.g. a Wi-Fi login portal answering instead of our server.
      if (controller.signal.aborted || res.ok) throw networkError(controller.signal.aborted);
      data = {};
    }
    if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status}).`, res.status);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// Downloads an authenticated admin file (CSV standings or JSON backup).
export async function downloadAdminFile(path, filename) {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${adminToken.get()}` } });
  if (!res.ok) throw new ApiError('Download failed.', res.status);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
