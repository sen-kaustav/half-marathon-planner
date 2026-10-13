import React, { useEffect, useMemo, useState } from 'react';
import { buildPlan } from './plan.js';
import { matchPlan } from './lib/match.js';
import { computeStats } from './lib/stats.js';
import { useActivities, useToday } from './hooks.js';
import Home from './components/Home.jsx';
import Plan from './components/Plan.jsx';
import { CalendarIcon, HomeIcon } from './components/Icons.jsx';

export default function App() {
  const today = useToday();
  const data = useActivities();
  const plan = useMemo(buildPlan, []);
  const results = useMemo(
    () => matchPlan(plan.days, data.activities, { todayIso: today, syncedAt: data.updatedAt }),
    [plan, data.activities, data.updatedAt, today],
  );
  const stats = useMemo(() => computeStats(plan, results, data.activities, today), [plan, results, data.activities, today]);

  const [tab, setTab] = useState('home');
  const [selIdx, setSelIdx] = useState(stats.todayIdx);

  // A new calendar day (or reopening the app next morning) puts the plan back on today.
  useEffect(() => setSelIdx(stats.todayIdx), [stats.todayIdx]);

  const openDay = (idx) => {
    setSelIdx(idx);
    setTab('plan');
  };

  const shared = { plan, results, stats, today, data };

  return (
    <div className="app">
      <main className="screen" hidden={tab !== 'home'}>
        <Home {...shared} onOpenDay={openDay} />
      </main>
      <main className="screen" hidden={tab !== 'plan'}>
        <Plan {...shared} active={tab === 'plan'} selIdx={selIdx} setSelIdx={setSelIdx} />
      </main>
      <nav className="tabbar" aria-label="Main">
        <button type="button" className="tab" aria-current={tab === 'home' ? 'page' : undefined} onClick={() => setTab('home')}>
          <HomeIcon />
          <span>Home</span>
        </button>
        <button type="button" className="tab" aria-current={tab === 'plan' ? 'page' : undefined} onClick={() => setTab('plan')}>
          <CalendarIcon />
          <span>Plan</span>
        </button>
      </nav>
    </div>
  );
}
