#!/usr/bin/env node
// Merges Strava connector output into public/data/activities.json.
//
//   node scripts/update-activities.mjs < strava-pages.json
//
// Input (stdin) is whatever the Strava connector's list_activities returned: a single
// response ({ "activities": [...] }), an array of such responses (one per page), or a plain
// array of activities. Only runs and swims on/after the plan start are kept. Activities are
// merged by id, so re-running with overlapping ranges is safe.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'public/data/activities.json');
const START_ISO = '2026-10-12';

const TYPE = { Run: 'run', TrailRun: 'run', VirtualRun: 'run', Swim: 'swim' };

export function collect(input) {
  const pages = Array.isArray(input) ? input : [input];
  const list = [];
  for (const p of pages) {
    if (p && Array.isArray(p.activities)) list.push(...p.activities);
    else if (p && p.id && (p.sport_type || p.type)) list.push(p);
  }
  return list;
}

export function normalise(a) {
  const type = TYPE[a.sport_type || a.type];
  if (!type || !a.start_local) return null;
  const s = a.summary || a;
  return {
    id: String(a.id),
    date: a.start_local.slice(0, 10),
    startLocal: a.start_local,
    type,
    name: a.name || (type === 'run' ? 'Run' : 'Swim'),
    distanceM: Math.round(s.distance || 0),
    movingTimeS: Math.round(s.moving_time || 0),
    elevationM: Math.round(s.elevation_gain || 0),
  };
}

export function merge(existing, incoming, now = new Date()) {
  const byId = new Map((existing.activities || []).map((a) => [a.id, a]));
  for (const a of incoming) if (a && a.date >= START_ISO) byId.set(a.id, a);
  const activities = [...byId.values()].sort((a, b) => (a.startLocal < b.startLocal ? -1 : 1));
  return { updatedAt: now.toISOString(), source: 'strava', activities };
}

function main() {
  const raw = readFileSync(0, 'utf8').trim();
  if (!raw) throw new Error('No input on stdin. Pipe the Strava list_activities JSON in.');
  const incoming = collect(JSON.parse(raw)).map(normalise).filter(Boolean);
  let existing = { activities: [] };
  try {
    existing = JSON.parse(readFileSync(OUT, 'utf8'));
  } catch {}
  const next = merge(existing, incoming);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n');
  const added = next.activities.length - (existing.activities || []).length;
  console.log(`Read ${incoming.length} run/swim activities; file now has ${next.activities.length} (${added >= 0 ? '+' : ''}${added}). updatedAt ${next.updatedAt}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
