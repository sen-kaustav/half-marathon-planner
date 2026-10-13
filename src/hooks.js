import { useEffect, useState } from 'react';
import { isoOf } from './lib/dates.js';

/** The phone's current date (YYYY-MM-DD). Re-checks every minute and when the app is reopened. */
export function useToday() {
  const [today, setToday] = useState(() => isoOf(new Date()));
  useEffect(() => {
    const check = () => setToday(isoOf(new Date()));
    const id = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, []);
  return today;
}

const CACHE_KEY = 'mph-activities-v1';
const EMPTY = { updatedAt: null, activities: [], state: 'loading' };

/**
 * Loads data/activities.json (written by the weekly Claude run). Always asks the network first
 * so a fresh refresh shows up, and falls back to the last copy saved on the phone when offline.
 */
export function useActivities() {
  const [data, setData] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached) return { ...cached, state: 'cached' };
    } catch {}
    return EMPTY;
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/activities.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(json));
        } catch {}
        if (alive) setData({ ...json, state: 'live' });
      } catch {
        if (alive) setData((d) => (d.state === 'loading' ? { ...EMPTY, state: 'error' } : { ...d, state: 'offline' }));
      }
    };
    load();
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return data;
}
