import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan } from '../src/plan.js';
import { matchPlan } from '../src/lib/match.js';
import { collect, normalise, merge } from '../scripts/update-activities.mjs';

const plan = buildPlan();
const day = (iso) => plan.days.find((d) => d.iso === iso);
const run = (date, km = 5, extra = {}) => ({ id: date + km, date, startLocal: date + 'T08:00:00', type: 'run', name: 'Run', distanceM: km * 1000, movingTimeS: km * 360, elevationM: 10, ...extra });
const swim = (date) => ({ id: 's' + date, date, startLocal: date + 'T18:00:00', type: 'swim', name: 'Swim', distanceM: 1000, movingTimeS: 1500, elevationM: 0 });

test('plan shape: 22 weeks, race on Sunday 14 Mar 2027', () => {
  assert.equal(plan.weeks.length, 22);
  assert.equal(plan.days.length, 154);
  assert.equal(plan.days[153].iso, '2027-03-14');
  assert.equal(plan.days[153].isRace, true);
  assert.equal(plan.days[0].type, 'rest'); // Monday
  assert.equal(day('2026-10-13').type, 'run');
});

test('run on the planned day is done', () => {
  const r = matchPlan(plan.days, [run('2026-10-13', 5.59)], { todayIso: '2026-10-14', syncedAt: '2026-10-13T21:00:00Z' });
  assert.equal(r[day('2026-10-13').index].status, 'done');
  assert.equal(r[day('2026-10-13').index].match.moved, false);
});

test('missed day is skipped once a sync has covered it, awaiting before that', () => {
  const synced = matchPlan(plan.days, [], { todayIso: '2026-10-16', syncedAt: '2026-10-15T22:30:00' });
  assert.equal(synced[day('2026-10-13').index].status, 'skipped'); // Tue
  assert.equal(synced[day('2026-10-15').index].status, 'skipped'); // Thu, sync was late that day
  const stale = matchPlan(plan.days, [], { todayIso: '2026-10-16', syncedAt: '2026-10-13T09:00:00' });
  assert.equal(stale[day('2026-10-15').index].status, 'awaiting');
});

test('a run on a different day fills the missed session in that week', () => {
  const r = matchPlan(plan.days, [run('2026-10-16', 5)], { todayIso: '2026-10-18', syncedAt: '2026-10-17T22:00:00' }); // Friday run, Tue/Thu missed
  const thu = r[day('2026-10-15').index]; // closest missed run day to Friday
  assert.equal(thu.status, 'done');
  assert.equal(thu.match.moved, true);
  assert.equal(r[day('2026-10-13').index].status, 'skipped');
});

test('activities from another week do not fill this week', () => {
  const r = matchPlan(plan.days, [run('2026-10-20', 5)], { todayIso: '2026-10-19', syncedAt: '2026-10-19T08:00:00' });
  assert.equal(r[day('2026-10-13').index].status, 'skipped'); // week 1 stays skipped
  assert.equal(r[day('2026-10-20').index].status, 'done'); // week 2 Tuesday
});

test('swims match swim days only; runs never count as swims', () => {
  const r = matchPlan(plan.days, [swim('2026-10-14'), run('2026-10-14', 4)], { todayIso: '2026-10-15', syncedAt: '2026-10-14T23:00:00' });
  assert.equal(r[day('2026-10-14').index].status, 'done');
  assert.equal(r[day('2026-10-14').index].match.type, 'swim');
});

test('today is pending, future is upcoming, rest stays rest', () => {
  const r = matchPlan(plan.days, [], { todayIso: '2026-10-13', syncedAt: '2026-10-12T22:00:00' });
  assert.equal(r[day('2026-10-13').index].status, 'today');
  assert.equal(r[day('2026-10-15').index].status, 'upcoming');
  assert.equal(r[day('2026-10-12').index].status, 'rest');
});

test('update script normalises and merges Strava connector output', () => {
  const page = { activities: [
    { id: '1', name: 'Morning Run', sport_type: 'Run', start_local: '2026-10-13T07:00:00', summary: { distance: 5000.4, moving_time: 1800, elevation_gain: 12 } },
    { id: '2', name: 'Weights', sport_type: 'WeightTraining', start_local: '2026-10-13T12:00:00', summary: {} },
    { id: '3', name: 'Old', sport_type: 'Run', start_local: '2026-09-01T07:00:00', summary: { distance: 1000 } },
  ] };
  const incoming = collect([page]).map(normalise).filter(Boolean);
  assert.equal(incoming.length, 2);
  const out = merge({ activities: [] }, incoming, new Date('2026-10-14T00:00:00Z'));
  assert.equal(out.activities.length, 1); // weights dropped, pre-plan run dropped
  assert.equal(out.activities[0].distanceM, 5000);
  const again = merge(out, incoming);
  assert.equal(again.activities.length, 1); // idempotent
});
