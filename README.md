# Morden Park Half

A mobile-first PWA for a 22-week half marathon plan (race: Sun 14 Mar 2027). It has no manual
logging: progress is filled in from Strava data that a weekly scheduled Claude run refreshes.

- **Home**: days to race, progress through the 22 weeks, km run, sessions done, this week, and the skipped list.
- **Plan**: week picker on top, one card per day, swipe left/right to move between days. Opens on today (the phone's date).
- Missed sessions show a **Skipped** tag. A run done on a different day of the same week fills a missed session of the same type.
- A day only becomes *Skipped* once a Strava refresh has covered it; until then it reads *Awaiting sync*.

## Install on your phone

Open the Pages URL in Safari (iPhone: Share → Add to Home Screen) or Chrome (Android: Install app).

## Develop

```sh
npm install
npm run dev      # local dev server
npm test         # matching logic + data script tests
npm run build    # production build in dist/
```

## Data refresh

See [REFRESH.md](REFRESH.md). In short: `public/data/activities.json` is regenerated weekly from the
Strava connector with `scripts/update-activities.mjs`, committed to `main`, and the GitHub Actions
workflow redeploys to GitHub Pages.

Stack: Vite, React 18, vite-plugin-pwa, Outfit font (self-hosted), Ember design tokens.
