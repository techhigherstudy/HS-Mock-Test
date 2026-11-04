# higher.study — frontend (phase 1)

Open `index.html` through any static server (e.g. `python3 -m http.server 8000`), not by double-click, so localStorage and relative paths behave.

Flow: index.html (landing + register/login popup) → instructions.html → exam.html (sectional timers, palette, TITA keypad, modals) → result.html (score, section analysis, solutions).

## Backend hand-off
- `assets/js/api.js` is a mock (localStorage). Each method has a comment with the Laravel endpoint it will become. Replace bodies with `fetch()`; pages do not change.
- Timer: `HS.api.clock` stands in for the server clock. In Laravel, return `serverNow` and section deadlines; the client only displays them.
- Answer keys are never sent to the exam page (`paper()` strips them); solutions load only after submission.
- `assets/js/data.js` holds SAMPLE questions only (68, matching the video's paper shape).
- Header menu (`HS.menu`), footer, exam instructions and stats are the CMS/DB-driven parts in phase 2.
- Each page maps to a Blade view; header/footer become partials; `app.css` tokens stay as-is.

## Not yet built (backend phase)
Mobile OTP, counselling form, CMS, admin panel, Google Sheets sync, real lead tracking (events are stored locally as a stub via HS.track).

## Admin panel (prototype) — open `admin.html`
Demo accounts (prototype only; replaced by real accounts in the Laravel phase):
- Super Admin: admin@higher.study / Admin@12345 (all modules)
- Content Manager: content@higher.study / Content@12345 (CMS + dashboard only)
- Lead Manager: leads@higher.study / Leads@12345 (leads, activity, students, counselling)

Working in the prototype: dashboard KPIs/charts with filters, lead filters + column chooser + filtered/selected/all CSV export,
lead drawer (stage change, counsellor, follow-up, remarks, timeline), students block/unblock, counselling pipeline, exam create/edit/duplicate/publish/delete
(shows on the public site), question bank add + CSV import preview + export, website CMS (hero, banner, menu, footer — shows on the public site),
admin users + custom roles + permission matrix (enforced per module), audit log.
Simulated only: Google Sheets sync and Database backup (demo counters/logs).
Data lives in the browser (localStorage); backend phase moves it to MySQL.

## Google Sheets connection (phase 1b)
1. Open your Google Sheet > Extensions > Apps Script, paste `google-apps-script/Code.gs`.
2. Change `SECRET` to a long random text; put the same text in `assets/js/config.js` as `SHEETS_TOKEN`.
3. Run function `setup` once (approve permissions): it creates the 11 tabs with headers.
4. Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone. Copy the URL into `SHEETS_URL` in `config.js`.
5. Use the website once, then check the tabs. Admin > Google Sheets shows the live queue and a Test connection button.

Behaviour: rows are appended or updated by unique id (retries never duplicate); failed sends stay queued in the browser and retry with growing delay;
deleting rows in the sheet never affects the website; new rows keep arriving. The script never deletes anything.
Note: in this browser-only phase the token is visible in the page source. In the Laravel phase the server sends to Sheets, so no token reaches the browser.
