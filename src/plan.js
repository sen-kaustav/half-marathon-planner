// The 22-week Morden Park Half plan. Static: only the Strava data changes week to week.
import { addDays, isoOf, parseIso } from './lib/dates.js';

export const START_ISO = '2026-10-12'; // Monday of week 1
export const RACE_ISO = '2027-03-14'; // Sunday of week 22
export const GOAL = { time: '1:54', pace: '5:25/km', stretch: 'sub-1:50' };

export const PHASES = {
  base: { name: 'Base', weeks: 6 },
  build: { name: 'Build', weeks: 6 },
  spec: { name: 'Race-specific', weeks: 6 },
  taper: { name: 'Peak & taper', weeks: 4 },
};

// [phase, focus, tue, thu, sun] where each session is [km, kind, description]
const W = [
  ['base', 'Restart the habit', [5, 'Easy', '5 km easy + 4 × 20 s strides'], [5, 'Easy', '5 km easy, slower than feels natural'], [8, 'Long', '8 km easy']],
  ['base', 'Build frequency', [6, 'Easy', '6 km easy + 4 strides'], [5, 'Easy', '5 km easy'], [10, 'Long', '10 km easy, no walk breaks']],
  ['base', 'First faster running', [6, 'Fartlek', '6 km with 6 × 1 min threshold, 1 min easy'], [5, 'Easy', '5 km easy'], [11, 'Long', '11 km easy']],
  ['base', 'Cutback + benchmark', [5, 'Easy', '5 km easy + 4 strides'], [5, 'Easy', '5 km easy'], [8, '5k time trial', '2 km warm-up, 5 km all-out, 1 km cool-down. Parkrun on Sat works too.']],
  ['base', 'Threshold intro', [7, 'Threshold', '2 km easy, 3 × 5 min threshold (2 min jog), easy to 7 km'], [6, 'Easy', '6 km easy'], [12, 'Long', '12 km easy']],
  ['base', 'Base complete', [7, 'Threshold', '2 km easy, 4 × 5 min threshold (2 min jog), easy to 7 km'], [6, 'Easy', '6 km easy + 4 strides'], [13, 'Long', '13 km easy']],
  ['build', 'Longer tempo', [8, 'Tempo', '2 km easy, 2 × 10 min tempo (3 min jog), easy to 8 km'], [6, 'Easy', '6 km easy + 4 strides'], [14, 'Long', '14 km easy']],
  ['build', 'First intervals', [8, 'Intervals', '2 km easy, 6 × 800 m @ interval (2 min jog), easy to 8 km'], [6, 'Easy', '6 km easy'], [15, 'Long', '15 km easy']],
  ['build', 'Threshold volume', [9, 'Threshold', '2 km easy, 3 × 10 min threshold (2 min jog), easy to 9 km'], [6, 'Easy', '6 km easy'], [16, 'Long', '16 km easy, take a gel at 10 km']],
  ['build', 'Taste of race pace', [8, 'Intervals', '2 km easy, 5 × 1 km @ interval (2 min jog), easy to 8 km'], [7, 'Easy', '7 km easy'], [16, 'Long + HMP', '16 km: 13 easy, last 3 @ HMP']],
  ['build', 'Christmas cutback', [6, 'Easy', '6 km easy + strides, any day'], [6, 'Easy', '6 km easy, any day'], [12, 'Long', '12 km easy, any day']],
  ['build', 'Back to it', [9, 'Tempo', '2 km easy, 20 min continuous tempo, easy to 9 km'], [7, 'Easy', '7 km easy'], [16, 'Long', '16 km easy']],
  ['spec', 'Race-pace blocks', [10, 'HMP reps', '2 km easy, 3 × 2 km @ HMP (2 min jog), easy to 10 km'], [7, 'Easy', '7 km easy + 4 strides'], [17, 'Long', '17 km easy, practise gels']],
  ['spec', 'Fast finish', [9, 'Intervals', '2 km easy, 6 × 1 km @ interval (90 s jog), easy to 9 km'], [7, 'Easy', '7 km easy'], [18, 'Long + HMP', '18 km: 13 easy, last 5 @ HMP']],
  ['spec', 'Cutback + 10k test', [7, 'Easy', '7 km easy + 4 strides'], [6, 'Easy', '6 km easy'], [14, '10k time trial', '2 km warm-up, 10 km hard, 2 km cool-down. Update paces from the result.']],
  ['spec', 'Sustained threshold', [10, 'Threshold', '2 km easy, 2 × 15 min threshold (3 min jog), easy to 10 km'], [7, 'Easy', '7 km easy'], [18, 'Long + HMP', '18 km with 3 × 3 km @ HMP inside (1 km easy between)']],
  ['spec', 'Longest easy run', [10, 'Intervals', '2 km easy, 4 × 1.6 km at 4:40/km (2 min jog), easy to 10 km'], [8, 'Easy', '8 km easy'], [19, 'Long', '19 km easy']],
  ['spec', 'Race rehearsal', [11, 'HMP run', '2 km easy, 8 km continuous @ HMP, 1 km easy'], [7, 'Easy', '7 km easy + 4 strides'], [16, 'Long', '16 km easy']],
  ['taper', 'Peak week', [10, 'Threshold', '2 km easy, 3 × 3 km threshold (2 min jog), easy to 10 km'], [8, 'Easy', '8 km easy'], [20, 'Peak long run', '20 km: 14 easy, last 6 @ HMP. Race kit + breakfast.']],
  ['taper', 'Hold fitness', [10, 'Intervals', '2 km easy, 6 × 1 km @ interval (2 min jog), easy to 10 km'], [7, 'Easy', '7 km easy'], [18, 'Long', '18 km easy']],
  ['taper', 'Taper begins', [9, 'HMP reps', '2 km easy, 2 × 4 km @ HMP (2 min jog), 1 km easy'], [6, 'Easy', '6 km easy + 4 strides'], [14, 'Long + HMP', '14 km with 5 km @ HMP in the middle']],
  ['taper', 'Race week', [6, 'Sharpener', '2 km easy, 3 × 1 km @ HMP (2 min jog), 1 km easy'], [4, 'Easy', '4 km easy + 4 strides. Rest Fri & Sat.'], [21.1, 'Race day', 'Start at 5:30/km for 5 km, settle at 5:25, push from 16 km.']],
];

// Target pace and feel by session kind (from the paces table in the original plan).
const EASY = { pace: '6:00–6:30', feel: 'Full sentences' };
const TARGETS = {
  Easy: EASY,
  Long: EASY,
  Fartlek: { pace: '4:55–5:05 on reps', feel: 'Comfortably hard' },
  Threshold: { pace: '4:55–5:05', feel: 'Comfortably hard' },
  Tempo: { pace: '4:55–5:05', feel: 'Comfortably hard' },
  Intervals: { pace: '4:25–4:35 on reps', feel: 'Hard, a few words' },
  'Long + HMP': { pace: '5:20–5:30 on HMP', feel: 'Controlled' },
  'HMP reps': { pace: '5:20–5:30 on reps', feel: 'Controlled' },
  'HMP run': { pace: '5:20–5:30', feel: 'Controlled' },
  Sharpener: { pace: '5:20–5:30 on reps', feel: 'Quick, relaxed' },
  'Peak long run': { pace: '5:20–5:30 on HMP', feel: 'Controlled' },
  '5k time trial': { pace: 'All-out', feel: 'Hard' },
  '10k time trial': { pace: 'Hard, even', feel: 'Hard' },
  'Race day': { pace: '5:25', feel: 'Settle, then push' },
};

const DOW = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Day-of-week index (Mon = 0) -> session slot
const RUN_SLOT = { 1: 2, 3: 3, 6: 4 }; // Tue, Thu, Sun -> W[...] index
const SWIM_DOW = new Set([2, 5]); // Wed, Sat

export function runTitle(kind) {
  if (kind === 'Easy') return 'Easy run';
  if (kind === 'Long') return 'Long run';
  return kind;
}

export function buildPlan() {
  const start = parseIso(START_ISO);
  const weeks = [];
  const days = [];
  W.forEach((w, wi) => {
    const [phase, focus] = w;
    const weekStart = addDays(start, wi * 7);
    let plannedKm = 0;
    for (let dow = 0; dow < 7; dow++) {
      const date = addDays(weekStart, dow);
      const base = {
        index: wi * 7 + dow,
        iso: isoOf(date),
        date,
        weekIdx: wi,
        dow,
        dowName: DOW[dow],
      };
      if (RUN_SLOT[dow]) {
        const [kmPlanned, kind, desc] = w[RUN_SLOT[dow]];
        plannedKm += kmPlanned;
        days.push({ ...base, type: 'run', km: kmPlanned, kind, title: runTitle(kind), desc, target: TARGETS[kind] || EASY, isRace: kind === 'Race day' });
      } else if (SWIM_DOW.has(dow) && !(wi === W.length - 1 && dow === 5)) {
        days.push({ ...base, type: 'swim', km: 1, kind: 'Swim', title: 'Swim', desc: 'Easy ~1 km, recovery' });
      } else {
        const raceEve = wi === W.length - 1 && dow === 5;
        days.push({ ...base, type: 'rest', km: 0, kind: 'Rest', title: 'Rest', desc: raceEve ? 'Rest the day before the race.' : 'Rest day. Let the legs absorb the work.' });
      }
    }
    weeks.push({
      index: wi,
      phase,
      phaseName: PHASES[phase].name,
      focus,
      startIso: isoOf(weekStart),
      endIso: isoOf(addDays(weekStart, 6)),
      startDate: weekStart,
      endDate: addDays(weekStart, 6),
      plannedKm,
    });
  });
  return { weeks, days, totalKm: weeks.reduce((a, w) => a + w.plannedKm, 0) };
}
