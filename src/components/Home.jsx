import React from 'react';
import { GOAL, PHASES, RACE_ISO } from '../plan.js';
import { fmtLong, fmtPace, fmtShort, parseIso } from '../lib/dates.js';
import { weekStatus } from '../lib/stats.js';
import { CheckIcon, CrossIcon, PulseIcon } from './Icons.jsx';

const PHASE_ORDER = ['base', 'build', 'spec', 'taper'];
const PHASE_SHORT = { base: 'Base', build: 'Build', spec: 'Race pace', taper: 'Taper' };

function Stat({ value, unit, label }) {
  return (
    <div className="stat">
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit"> {unit}</span>}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function syncLine(data) {
  if (data.state === 'loading') return { title: 'Loading Strava data…', sub: '' };
  if (data.state === 'error') return { title: 'No Strava data yet', sub: "Couldn't load data/activities.json" };
  const t = new Date(data.updatedAt);
  const when = `${fmtShort(t)}, ${t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  const offline = data.state === 'offline' ? ' · offline, showing saved copy' : '';
  return { title: 'Synced from Strava', sub: `${data.activities.length} activities · last refresh ${when}${offline}` };
}

export default function Home({ plan, results, stats, today, data, onOpenDay }) {
  const { weeks, days } = plan;
  const week = stats.week;
  const weekDays = days.filter((d) => d.weekIdx === week.index);
  const sync = syncLine(data);
  const currentPhase = week.phase;
  const todayDate = parseIso(today);

  return (
    <div className="page home">
      <header className="home-head">
        <div className="small">
          {stats.beforeStart ? 'Starts Mon 12 Oct' : `${fmtLong(todayDate)} · Week ${week.index + 1} of ${weeks.length}`}
        </div>
        <h1>Morden Park Half</h1>
      </header>

      <section className="hero" aria-label="Race countdown">
        <div className="hero-top">
          <div>
            <div className="eyebrow">Race day</div>
            <div className="hero-date">{fmtLong(parseIso(RACE_ISO)).replace(/^\w+ /, 'Sun ')} 2027</div>
            <div className="hero-sub">
              Goal {GOAL.time} · {GOAL.pace}
            </div>
          </div>
          <div className="hero-count">
            <div className="hero-num">{stats.raceDays}</div>
            <div className="hero-sub">days to go</div>
          </div>
        </div>
        <div className="weekbar" aria-hidden="true">
          {weeks.map((w) => {
            const s = weekStatus(plan, results, w.index, week.index);
            return <span key={w.index} className={`wk wk-${s}`} />;
          })}
        </div>
        <div className="phases" aria-hidden="true">
          {PHASE_ORDER.map((p) => (
            <span key={p} className={p === currentPhase ? 'on' : ''} style={{ flex: PHASES[p].weeks }}>
              {PHASE_SHORT[p]}
            </span>
          ))}
        </div>
      </section>

      <section className="stats" aria-label="Progress">
        <Stat value={stats.runKm.toFixed(1)} unit="km" label={`run of ${Math.round(plan.totalKm)} km planned`} />
        <Stat value={stats.done} unit={`/ ${stats.due}`} label="sessions done so far" />
        <Stat value={stats.avgPace ? fmtPace(stats.avgPace) : '–'} unit={stats.avgPace ? '/km' : ''} label="average run pace" />
        <Stat value={stats.nextLong ? stats.nextLong.km : '–'} unit={stats.nextLong ? 'km' : ''} label={stats.nextLong ? `next long run · ${fmtShort(stats.nextLong.date)}` : 'no long run left'} />
      </section>

      <section className="block" aria-label="This week">
        <div className="block-head">
          <h2>This week</h2>
          <span className="small">
            {stats.weekRunKm.toFixed(1)} of {week.plannedKm} km
          </span>
        </div>
        <div className="weekstrip">
          {weekDays.map((d) => {
            const r = results[d.index];
            const isToday = d.iso === today;
            const cls = `dot dot-${r.status}${isToday ? ' dot-now' : ''}`;
            return (
              <button key={d.index} type="button" className="weekstrip-day" onClick={() => onOpenDay(d.index)} aria-label={`${d.dowName}: ${d.title}, ${r.status}`}>
                <span className="wd">{d.dowName[0]}</span>
                <span className={cls}>
                  {r.status === 'done' && <CheckIcon width={14} height={14} />}
                  {r.status === 'skipped' && <CrossIcon width={14} height={14} />}
                  {r.status === 'rest' && '–'}
                </span>
                <span className="wsub">{d.type === 'run' ? `${d.km} km` : d.type === 'swim' ? 'Swim' : 'Rest'}</span>
              </button>
            );
          })}
        </div>
        <div className="legend small">
          <span><i className="key key-done" />Done</span>
          <span><i className="key key-skipped" />Skipped</span>
          <span><i className="key key-today" />Today</span>
          <span><i className="key key-upcoming" />To come</span>
        </div>
      </section>

      <section className="block" aria-label="Skipped sessions">
        <div className="block-head">
          <h2>Skipped</h2>
          <span className="small">
            {stats.skipped} {stats.skipped === 1 ? 'session' : 'sessions'}
            {stats.skippedKm > 0 ? ` · ${stats.skippedKm} km` : ''}
          </span>
        </div>
        {stats.skippedList.length === 0 ? (
          <div className="empty">Nothing skipped. Keep going.</div>
        ) : (
          <div className="list">
            {stats.skippedList.map((d) => (
              <button key={d.index} type="button" className="row" onClick={() => onOpenDay(d.index)}>
                <span className="row-main">
                  <span className="row-title">{d.type === 'run' ? `${d.title} · ${d.km} km` : 'Swim · ~1 km'}</span>
                  <span className="small">
                    {d.dowName.slice(0, 3)} {fmtShort(d.date)} · Week {d.weekIdx + 1}
                  </span>
                </span>
                <span className="tag tag-skipped">Skipped</span>
              </button>
            ))}
          </div>
        )}
        <p className="small note">Missed sessions stay missed. The plan moves on; never double up.</p>
      </section>

      <div className="sync">
        <PulseIcon width={20} height={20} />
        <div>
          <div className="sync-title">{sync.title}</div>
          {sync.sub && <div className="small">{sync.sub}</div>}
        </div>
      </div>
    </div>
  );
}
