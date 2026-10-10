// Thin client for the game server. The browser only keeps sign-in tokens; all game state lives on the server.
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

export async function api(path, { body, admin = false, method } = {}) {
  const token = admin ? adminToken.get() : teamToken.get();
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiError('Cannot reach the event server. Check your connection.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status}).`, res.status);
  return data;
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
