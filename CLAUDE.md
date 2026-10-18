# Morden Park Half

Mobile-first PWA for a 22-week half marathon plan (race: Sun 14 Mar 2027, goal 1:54 / 5:25 per km). There is no manual logging: progress is filled in from Strava data, which a weekly scheduled Claude run refreshes. See `README.md` for the product overview and `REFRESH.md` for the refresh procedure.

## Stack

Vite, React 18 (JSX, no TypeScript), vite-plugin-pwa, Outfit font (self-hosted via `@fontsource/outfit`). Plain CSS with "Ember" design tokens in `src/styles.css` (`:root` variables such as `--surface-100`, `--ember`, `--ink`, `--line`).

## Commands

- `npm run dev`: dev server. Served at `http://localhost:5173/half-marathon-planner/` (the Vite `base` is `/half-marathon-planner/`).
- `npm test`: `node --test test/*.test.js` (matching logic and data script).
- `npm run build`: production build into `dist/`.
- `npm run update-data`: merges Strava pages into `public/data/activities.json` (see `REFRESH.md`).

## Layout

- `src/plan.js`: the static 22-week plan (phases, weekly sessions, `START_ISO`, `RACE_ISO`, `GOAL`).
- `src/lib/match.js`: matches Strava activities to planned sessions. `stats.js`: aggregates (week status, progress). `dates.js`: date helpers.
- `src/hooks.js`: `useToday` (the phone's date) and `useActivities` (network first, falls back to a cached copy).
- `src/App.jsx`: shell with two tabs. `src/components/`: `Home`, `Plan` (week picker, date row, swipeable day-card strip, pager), `DayCard`, `Icons`.
- `public/data/activities.json`: the only input that changes week to week.

## Behaviour to preserve

- Home shows days to race, progress through the 22 weeks, km run, sessions done, this week and the skipped list. Plan opens on today.
- A day is only **Skipped** once a Strava refresh (`updatedAt`) has covered it; until then it reads **Awaiting sync**.
- A run done on a different day of the same week fills a missed session of the same type.
- The Plan strip only fully renders cards within `RENDER_RADIUS` of the selected day; others are ghost cards. The pager is sticky at the bottom so its position doesn't depend on card height.
- Strava data is excluded from the service worker precache (`globIgnores: ['data/**']`) and must always be fetched from the network first.

## Rules

- Strava refresh runs touch only `public/data/activities.json` and commit as `Refresh Strava data (YYYY-MM-DD)`. Never edit that file by hand and never commit raw connector output, tokens, polylines or locations: the repo is public.
- `package-lock.json` often shows as modified locally; don't commit it unless dependencies actually changed.
- Pushing to `main` triggers the GitHub Pages deploy (`npm ci`, `npm test`, `npm run build`), so keep tests and the build green.

## Verifying UI changes

Test changes in the running app at `http://localhost:5173/half-marathon-planner/` (use the Chrome tools) rather than assuming CSS or layout changes work. Check the Plan page at a phone-width viewport (around 390px wide); the app is capped at 520px wide.
