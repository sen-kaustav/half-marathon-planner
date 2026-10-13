import { daysBetween, parseIso } from './dates.js';
import { START_ISO, RACE_ISO } from '../plan.js';

export function computeStats(plan, results, activities, todayIso) {
  const { days, weeks } = plan;
  const todayIdx = Math.min(days.length - 1, Math.max(0, daysBetween(parseIso(START_ISO), parseIso(todayIso))));
  const weekIdx = days[todayIdx].weekIdx;

  const runs = activities.filter((a) => a.type === 'run' && a.date >= START_ISO && a.date <= todayIso);
  const runKm = runs.reduce((s, a) => s + a.distanceM, 0) / 1000;
  const runSec = runs.reduce((s, a) => s + a.movingTimeS, 0);
  const avgPace = runKm > 0 ? runSec / runKm : null;

  let done = 0;
  let skipped = 0;
  const skippedList = [];
  for (const d of days) {
    const r = results[d.index];
    if (r.status === 'done') done++;
    if (r.status === 'skipped') {
      skipped++;
      skippedList.push(d);
    }
  }
  skippedList.reverse(); // newest first

  const weekDays = days.filter((d) => d.weekIdx === weekIdx);
  const weekRunKm = weekDays.reduce((s, d) => s + (d.type === 'run' && results[d.index].match ? results[d.index].match.distanceM / 1000 : 0), 0);

  const nextLong = days.find((d) => d.type === 'run' && /^Long|Peak|Race/.test(d.kind) && d.iso >= todayIso && results[d.index].status !== 'done');

  const raceDays = Math.max(0, daysBetween(parseIso(todayIso), parseIso(RACE_ISO)));
  const skippedKm = skippedList.reduce((s, d) => s + (d.type === 'run' ? d.km : 0), 0);

  return {
    todayIdx,
    weekIdx,
    week: weeks[weekIdx],
    runKm,
    avgPace,
    done,
    due: done + skipped,
    skipped,
    skippedList,
    skippedKm,
    weekRunKm,
    nextLong,
    raceDays,
    beforeStart: todayIso < START_ISO,
  };
}

/** Week-level status for the week bar: 'future' | 'current' | 'done' | 'skips' */
export function weekStatus(plan, results, weekIdx, currentWeek) {
  if (weekIdx > currentWeek) return 'future';
  if (weekIdx === currentWeek) return 'current';
  const hasSkip = plan.days.some((d) => d.weekIdx === weekIdx && results[d.index].status === 'skipped');
  return hasSkip ? 'skips' : 'done';
}
