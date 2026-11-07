# higher.study — multi-exam portal (browser prototype)

Open `index.html` (serve with any static host, e.g. GitHub Pages; upload all files to the repo root).

Logins (prototype only — change before going public): student `demo@higher.study` / `Demo@12345`; admin `admin@higher.study` / `Admin@12345` (also works in the main-site login popup); `content@higher.study` / `Content@12345`; `leads@higher.study` / `Leads@12345`.

## What is in this build (spec: multi-exam upgrade)
- Unlimited exams with categories, sections (order, time, marks, negative, enable/disable), sectional or single timer, sectionless exams
- Question bank: MCQ / MSQ / numerical / true-false / text; per-exam & per-section counts; CSV/Excel import with exam_name + section_name, preview, error report, duplicate skip, create-missing
- UTM / gclid / gbraid / wbraid / fbclid first-touch + latest-touch capture (consent-gated, de-duplicated conversion event, no PII)
- Student dashboard, history, resume, back-button guard, Home / Dashboard / Exit with confirmation
- College Predictor driven only by admin-entered colleges and cutoffs, with disclaimer + enquiry
- Previous Year Papers, Study Material, Free Resources dropdown managed from admin
- Admin: 27 modules, generic filter/sort/pagination/saved-filter table, filtered/selected/all CSV+Excel export, role permissions, activity log
- Google Sheets secondary copy via `google-apps-script/Code.gs` (set the same secret in `config.js`; redeploy as a NEW VERSION after editing the script)

## Important: this is a prototype
All data lives in the browser (`localStorage`), so students registered on one device do not appear in the admin panel on another. Permissions are enforced in the browser only. Every mock `HS.api` method is commented with the Laravel endpoint it becomes. The next phase (Laravel 12 + MySQL: migrations, server-side filtering/pagination, Sanctum auth, server-side permissions, file storage, queued Sheets sync) turns these into the real thing.
