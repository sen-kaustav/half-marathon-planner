# Weekly Strava refresh (instructions for the scheduled Claude run)

The app is static. Its only changing input is `public/data/activities.json`.
Each week a scheduled Claude run in the cloud refreshes that file and pushes to `main`;
GitHub Actions then rebuilds and redeploys the site to GitHub Pages.

## Steps

1. Clone the repo and enter it:
   `gh repo clone sen-kaustav/half-marathon-planner && cd half-marathon-planner`
2. Fetch every run and swim since the plan started (Mon 12 Oct 2026) with the Strava
   connector's `list_activities`:
   - `range_start`: `2026-10-12T00:00:00`
   - `ordering`: `StartDateLocalAsc`, `first`: `100`
   - Follow `pageInfo.endCursor` / `end_cursor` via `after` while `has_next_page` is true.
3. Write the raw connector responses (one JSON object per page, as returned) to a temp file
   **outside the repo**, as a JSON array, e.g. `/tmp/strava-pages.json`.
4. Merge them: `node scripts/update-activities.mjs < /tmp/strava-pages.json`
   The script keeps only runs and swims, merges by activity id (safe to re-run), and stamps
   `updatedAt`. Do not edit `activities.json` by hand.
5. Check: `npm ci && npm test && npm run build` must pass.
6. If `git diff --stat public/data/activities.json` shows changes, commit and push to `main`:
   `git add public/data/activities.json && git commit -m "Refresh Strava data (YYYY-MM-DD)" && git push origin main`
   Even with no new activities the `updatedAt` stamp changes, which is intended: the app uses
   it to decide whether a missed day is "Skipped" (covered by the sync) or "Awaiting sync".
7. Confirm the "Deploy to GitHub Pages" workflow run succeeds (`gh run list --limit 1`).

## Rules

- Only touch `public/data/activities.json`. Never change plan, app code or workflows in a refresh run.
- Never commit raw connector output, tokens, polylines or locations. The repo is public.
- If the Strava connector is unavailable or errors, do not push anything; report the failure.
- The weekly run is scheduled for Sunday night so Sunday's long run is in the data.

## Data format (`public/data/activities.json`)

```json
{
  "updatedAt": "2026-10-13T21:25:11.652Z",
  "source": "strava",
  "activities": [
    { "id": "20571730793", "date": "2026-10-13", "startLocal": "2026-10-13T18:37:53",
      "type": "run", "name": "Evening Run", "distanceM": 5590, "movingTimeS": 2077, "elevationM": 16 }
  ]
}
```

`type` is `run` or `swim`; `date` is the local calendar date of the activity.
