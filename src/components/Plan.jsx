import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { fmtShort } from '../lib/dates.js';
import { weekStatus } from '../lib/stats.js';
import DayCard from './DayCard.jsx';
import { ChevronLeft, ChevronRight } from './Icons.jsx';

const GAP = 12;
const RENDER_RADIUS = 4; // only fully render cards near the selected day

export default function Plan({ plan, results, stats, today, active, selIdx, setSelIdx }) {
  const { days, weeks } = plan;
  const day = days[selIdx];
  const week = weeks[day.weekIdx];
  const scroller = useRef(null);
  const weekBar = useRef(null);
  const fromScroll = useRef(-1);
  const mounted = useRef(false);

  const step = () => {
    const first = scroller.current && scroller.current.children[0];
    return first ? first.offsetWidth + GAP : 0;
  };

  // Programmatic moves (week tap, day tap, arrows, "Today") scroll the card strip.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !active) return;
    if (fromScroll.current === selIdx) return;
    const left = selIdx * step();
    const far = Math.abs(el.scrollLeft - left) > step() * 7;
    el.scrollTo({ left, behavior: mounted.current && !far ? 'smooth' : 'auto' });
    mounted.current = true;
  }, [selIdx, active]);

  // Swiping updates the selected day.
  const onScroll = () => {
    const el = scroller.current;
    const s = step();
    if (!el || !s) return;
    const idx = Math.max(0, Math.min(days.length - 1, Math.round(el.scrollLeft / s)));
    if (idx !== selIdx) {
      fromScroll.current = idx;
      setSelIdx(idx);
    }
  };

  // Keep the selected week centred in the week bar.
  useEffect(() => {
    const bar = weekBar.current;
    if (!bar || !active) return;
    const btn = bar.children[week.index];
    if (btn) bar.scrollTo({ left: btn.offsetLeft - (bar.clientWidth - btn.offsetWidth) / 2, behavior: 'auto' });
  }, [week.index, active]);

  const weekDays = days.filter((d) => d.weekIdx === week.index);
  const goWeek = (wi) => setSelIdx(wi === stats.weekIdx ? stats.todayIdx : wi * 7);

  return (
    <div className="page plan">
      <header className="plan-head">
        <h1>Plan</h1>
        <button type="button" className={`pill${selIdx === stats.todayIdx ? '' : ' pill-hot'}`} onClick={() => setSelIdx(stats.todayIdx)}>
          {selIdx === stats.todayIdx ? 'Today' : 'Back to today'}
        </button>
      </header>

      <nav className="weekpick" ref={weekBar} aria-label="Weeks">
        {weeks.map((w) => {
          const s = weekStatus(plan, results, w.index, stats.weekIdx);
          const on = w.index === week.index;
          return (
            <button key={w.index} type="button" className={`wbtn${on ? ' wbtn-on' : ''}`} aria-pressed={on} onClick={() => goWeek(w.index)}>
              <span className="wbtn-label">WEEK</span>
              <span className="wbtn-num">{w.index + 1}</span>
              <span className={`wbtn-bar wbtn-${s}`} />
            </button>
          );
        })}
      </nav>

      <div className="weeksum">
        <span className="small">
          {fmtShort(week.startDate)}–{fmtShort(week.endDate)} · {week.phaseName} · <b>{week.focus}</b>
        </span>
        <span className="small nowrap">
          {weekDays.reduce((s, d) => s + (results[d.index].match && d.type === 'run' ? results[d.index].match.distanceM / 1000 : 0), 0).toFixed(1)} / {week.plannedKm} km
        </span>
      </div>

      <div className="dayrow" role="tablist" aria-label="Days of the week" style={{ '--sel': Math.max(0, selIdx - weekDays[0].index) }}>
        <span className="dayrow-pill" aria-hidden="true" />
        {weekDays.map((d) => {
          const r = results[d.index];
          const on = d.index === selIdx;
          return (
            <button key={d.index} type="button" role="tab" aria-selected={on} className={`dayrow-day${on ? ' on' : ''}`} onClick={() => setSelIdx(d.index)} aria-label={`${d.dowName} ${fmtShort(d.date)}`}>
              <span className="dayrow-dn">{d.dowName[0]}</span>
              <span className="dayrow-date">{d.date.getDate()}</span>
              <span className={`dot-sm dot-${r.status}${d.iso === today ? ' dot-now' : ''}`} />
            </button>
          );
        })}
      </div>

      <div className="strip" ref={scroller} onScroll={onScroll}>
        {days.map((d) =>
          Math.abs(d.index - selIdx) <= RENDER_RADIUS ? (
            <div className="slide" key={d.index}>
              <DayCard day={d} result={results[d.index]} isToday={d.iso === today} />
            </div>
          ) : (
            <div className="slide" key={d.index} aria-hidden="true">
              <div className="card card-ghost" />
            </div>
          ),
        )}
      </div>

      <div className="pager">
        <button type="button" className="icon-btn" aria-label="Previous day" disabled={selIdx === 0} onClick={() => setSelIdx(selIdx - 1)}>
          <ChevronLeft />
        </button>
        <div className="pager-dots" aria-hidden="true">
          {weekDays.map((d) => (
            <span key={d.index} className={d.index === selIdx ? 'on' : ''} />
          ))}
        </div>
        <button type="button" className="icon-btn" aria-label="Next day" disabled={selIdx === days.length - 1} onClick={() => setSelIdx(selIdx + 1)}>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
