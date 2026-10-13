// All dates are handled as local calendar dates (the phone's date), never UTC.
const pad = (n) => String(n).padStart(2, '0');

export const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseIso = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const daysBetween = (a, b) => Math.round((b - a) / 864e5);

export const fmtShort = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export const fmtLong = (d) =>
  d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

export const fmtWeekday = (d) => d.toLocaleDateString('en-GB', { weekday: 'short' });

export function fmtPace(secPerKm) {
  if (!isFinite(secPerKm) || secPerKm <= 0) return '–';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtDuration(totalSec) {
  const t = Math.round(totalSec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export const km = (meters, dp = 1) => Math.round((meters / 1000) * 10 ** dp) / 10 ** dp;
