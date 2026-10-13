// Matches Strava activities to planned days and decides done / skipped / etc.
import { isoOf } from './dates.js';

/** Sum all activities of one type on one calendar date into a single group. */
export function groupByDate(activities) {
  const groups = { run: new Map(), swim: new Map() };
  for (const a of activities) {
    const bucket = groups[a.type];
    if (!bucket) continue;
    const g = bucket.get(a.date) || { date: a.date, type: a.type, distanceM: 0, movingTimeS: 0, elevationM: 0, count: 0, names: [] };
    g.distanceM += a.distanceM || 0;
    g.movingTimeS += a.movingTimeS || 0;
    g.elevationM += a.elevationM || 0;
    g.count += 1;
    g.names.push(a.name);
    bucket.set(a.date, g);
  }
  return groups;
}

/**
 * A day is "covered" by the data once the sync happened after it (or late on that day),
 * so a missing activity can safely be called skipped instead of "not synced yet".
 */
export function makeCoverage(syncedAt, todayIso) {
  if (!syncedAt) return (iso) => iso < todayIso;
  const t = new Date(syncedAt);
  const syncIso = isoOf(t);
  const late = t.getHours() >= 20;
  return (iso) => iso < syncIso || (iso === syncIso && late);
}

/**
 * Returns one result per plan day: { status, match }.
 * status: done | skipped | awaiting | today | upcoming | rest
 *  - awaiting: day has passed but the latest sync is older than the day
 * match: aggregated Strava group (with moved: true if it was done on a different day that week)
 */
export function matchPlan(days, activities, { todayIso, syncedAt } = {}) {
  const groups = groupByDate(activities);
  const covered = makeCoverage(syncedAt, todayIso);
  const results = days.map((d) => ({ status: d.type === 'rest' ? 'rest' : null, match: null }));
  const used = { run: new Set(), swim: new Set() };
  const byIso = new Map(days.map((d) => [d.iso, d]));

  // Pass 1: activity on the planned day itself.
  for (const d of days) {
    if (d.type === 'rest') continue;
    const g = groups[d.type].get(d.iso);
    if (g) {
      results[d.index] = { status: 'done', match: { ...g, moved: false } };
      used[d.type].add(d.iso);
    }
  }

  // Pass 2: leftover activities fill a missed session of the same type in the same week
  // (the plan says swap days freely). Closest day wins, earlier on a tie.
  for (const type of ['run', 'swim']) {
    const leftovers = [...groups[type].values()].filter((g) => !used[type].has(g.date) && byIso.has(g.date)).sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const g of leftovers) {
      const gDay = byIso.get(g.date);
      let best = null;
      for (const d of days) {
        if (d.type !== type || d.weekIdx !== gDay.weekIdx || results[d.index].status) continue;
        const gap = Math.abs(d.index - gDay.index);
        if (!best || gap < best.gap || (gap === best.gap && d.index < best.day.index)) best = { day: d, gap };
      }
      if (best) {
        results[best.day.index] = { status: 'done', match: { ...g, moved: true } };
        used[type].add(g.date);
      }
    }
  }

  // Everything still unmatched: skipped / awaiting / today / upcoming.
  for (const d of days) {
    const r = results[d.index];
    if (r.status) continue;
    if (d.iso === todayIso) r.status = 'today';
    else if (d.iso > todayIso) r.status = 'upcoming';
    else r.status = covered(d.iso) ? 'skipped' : 'awaiting';
  }
  return results;
}
