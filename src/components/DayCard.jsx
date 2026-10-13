import React from 'react';
import { fmtDuration, fmtLong, fmtPace, fmtShort, fmtWeekday } from '../lib/dates.js';
import { CheckIcon, ClockIcon, CrossIcon } from './Icons.jsx';

const TAGS = {
  done: { text: 'Done', cls: 'tag-done', Icon: CheckIcon },
  skipped: { text: 'Skipped', cls: 'tag-skipped', Icon: CrossIcon },
  awaiting: { text: 'Awaiting sync', cls: 'tag-awaiting' },
};

function Strava({ day, match }) {
  const distKm = match.distanceM / 1000;
  const pace = distKm > 0 && day.type === 'run' ? match.movingTimeS / distKm : null;
  const pct = day.type === 'run' && day.km ? Math.round((distKm / day.km) * 100) : null;
  return (
    <div className="strava">
      <div className="strava-head">
        <span className="label">From Strava</span>
        <span className="small">{match.names.length > 1 ? `${match.names.length} activities` : match.names[0]}</span>
      </div>
      <div className="strava-grid">
        <div>
          <b>{day.type === 'swim' ? `${Math.round(match.distanceM)} m` : `${distKm.toFixed(1)} km`}</b>
          <span className="small">{day.type === 'run' ? `planned ${day.km} km` : 'planned ~1 km'}</span>
        </div>
        <div>
          <b>{fmtDuration(match.movingTimeS)}</b>
          <span className="small">moving time</span>
        </div>
        {pace && (
          <div>
            <b>{fmtPace(pace)}</b>
            <span className="small">avg pace /km</span>
          </div>
        )}
        {day.type === 'run' && (
          <div>
            <b>{match.elevationM} m</b>
            <span className="small">elevation</span>
          </div>
        )}
      </div>
      {pct !== null && (
        <div className="progress">
          <div className="progress-bar">
            <div style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <span className="small">{pct}% of planned distance</span>
        </div>
      )}
      {match.moved && <div className="small moved">Ran on {fmtLong(new Date(match.date + 'T00:00:00'))} instead of this day.</div>}
    </div>
  );
}

export default function DayCard({ day, result, isToday }) {
  const { status, match } = result;
  const tag = isToday && status !== 'done' ? { text: 'Today', cls: 'tag-today' } : TAGS[status];
  const cardCls = `card card-${status}`;

  return (
    <article className={cardCls} aria-label={`${day.dowName} ${day.title}${tag ? `, ${tag.text}` : ''}`}>
      <div className="card-top">
        <span className="small nowrap">{fmtWeekday(day.date)} {fmtShort(day.date)}</span>
        {tag && (
          <span className={`tag ${tag.cls}`}>
            {tag.Icon && <tag.Icon width={14} height={14} />}
            {isToday && status === 'done' ? 'Done · Today' : tag.text}
          </span>
        )}
      </div>

      {day.type === 'rest' ? (
        <div className="card-body">
          <div className="kind">Rest</div>
          <div className="card-desc">{day.desc}</div>
        </div>
      ) : (
        <div className="card-body">
          <div className="kind">{day.title}</div>
          <div className={`big${status === 'skipped' ? ' struck' : ''}`}>
            {day.type === 'swim' ? '~1' : day.km} <span className="big-unit">km</span>
          </div>
          <div className="card-desc">{day.desc}</div>
        </div>
      )}

      {day.type === 'run' && status !== 'skipped' && status !== 'done' && (
        <div className="targets">
          <div>
            <span className="small">Pace</span>
            <b>{day.target.pace}</b>
          </div>
          <div>
            <span className="small">Feel</span>
            <b>{day.target.feel}</b>
          </div>
        </div>
      )}

      {status === 'done' && match && <Strava day={day} match={match} />}

      {status === 'skipped' && (
        <div className="strava">
          <span className="label">From Strava</span>
          <span className="strava-none">No {day.type === 'swim' ? 'swim' : 'run'} found this week to cover {day.dowName}.</span>
          <span className="small">Don't make it up. Carry on with the next session.</span>
        </div>
      )}

      {status === 'today' && day.type !== 'rest' && (
        <div className="waiting">
          <ClockIcon width={22} height={22} />
          <span className="small">Waiting for Strava. This ticks itself off when your {day.type === 'swim' ? 'swim' : 'run'} appears in the weekly data.</span>
        </div>
      )}

      {status === 'awaiting' && (
        <div className="waiting">
          <ClockIcon width={22} height={22} />
          <span className="small">Nothing in the data yet. It will show as done or skipped after the next Strava refresh.</span>
        </div>
      )}
    </article>
  );
}
