import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, teamToken } from '../api';

const EventContext = createContext(null);

// Polls the server and keeps a clock offset so every countdown follows server time, not the device clock.
export function usePolledState(path, { admin = false, interval = 1500, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const timer = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const sentAt = Date.now();
      const usedToken = admin ? null : teamToken.get();
      const next = await api(path, { admin });
      next.usedToken = usedToken;
      const receivedAt = Date.now();
      setOffset(next.serverNow - (sentAt + receivedAt) / 2);
      setData(next);
      setError(null);
      return next;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [path, admin]);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const loop = async () => {
      const latest = await refresh();
      if (!cancelled) timer.current = setTimeout(loop, typeof interval === 'function' ? interval(latest) : interval);
    };
    loop();
    return () => {
      cancelled = true;
      clearTimeout(timer.current);
    };
  }, [refresh, interval, enabled]);

  return { data, error, offset, refresh };
}

// Re-renders on an interval and returns the current server time.
export function useServerNow(offset, interval = 250) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset), interval);
    return () => clearInterval(id);
  }, [offset, interval]);
  return now;
}

// The buzzer final needs snappier updates than the timed rounds.
const pollInterval = (latest) => (latest?.phase === 'round3' ? 700 : 1500);

export const EventProvider = ({ children }) => {
  const [notice, setNotice] = useState(null);
  const { data, error, offset, refresh } = usePolledState('/state', { interval: pollInterval });

  // A token the server no longer recognises means this member signed in on another device.
  useEffect(() => {
    if (data?.usedToken && !data.me && data.usedToken === teamToken.get()) {
      teamToken.set(null);
      setNotice('You were signed out: your name was used to sign in on another device, or an organiser removed your team.');
    }
  }, [data]);

  const signIn = async (mode, form) => {
    const { token } = await api(mode === 'create' ? '/register' : '/login', { body: form });
    teamToken.set(token);
    setNotice(null);
    await refresh();
  };

  const signOut = async () => {
    await api('/logout', { body: {} }).catch(() => {});
    teamToken.set(null);
    await refresh();
  };

  // Runs a team action, then refreshes so every screen reflects the server's answer.
  const act = async (path, body) => {
    try {
      return await api(path, { body });
    } finally {
      await refresh();
    }
  };

  return (
    <EventContext.Provider
      value={{ state: data, error, offset, refresh, signIn, signOut, act, notice, me: data?.me ?? null }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvent must be used within an EventProvider');
  return ctx;
};
