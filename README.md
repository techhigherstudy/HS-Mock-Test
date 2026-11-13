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

## College Predictor: using your website's data
- Each result has a **View on higher.study** button (uses the college's "Page on higher.study" link, else higher.study/colleges) tagged `utm_source=mock-test&utm_medium=college-predictor&utm_campaign=<exam>` so you can see this traffic in your main site's analytics.
- **Sync from higher.study** (Admin > College Management): set `COLLEGES_FEED_URL` in `config.js` to a JSON feed on your site:
  `{"colleges":[{"externalId":"101","name":"…","city":"…","state":"…","type":"Government","courses":["MBA"],"fees":"…","eligibility":"…","pageUrl":"https://higher.study/colleges/…","admissionUrl":"…","logo":"https://…","cutoffs":[{"exam":"CAT","course":"MBA","category":"General","metric":"score","value":85,"year":2025}]}]}`
  New colleges arrive unpublished for review; existing ones are updated by `externalId` (or name + city), never duplicated.
  A browser can only read that feed if higher.study sends `Access-Control-Allow-Origin` for this site. In the Laravel phase the same sync runs as a scheduled server job, which has no such limit.

## Daily Quiz, Performance Analyzer, Flashcards
- **Daily Quiz** (`daily.html`): generated automatically from the existing Question Bank; a quiz stores only question IDs (nothing copied). Rules: configurable count, difficulty mix, per-section weights, generate time + publish time in the portal timezone, no repeats inside a quiz, recent questions avoided until the pool runs out, unique per (exam, date) so a repeated scheduler run never duplicates, an exam without enough eligible questions is skipped and the admin is notified, failures are logged with a retry. Questions and option order are shuffled per attempt and scored back against the original answers. One scored attempt per student (retakes optional, never ranked). Streak, leaderboard (first name + initial only) and achievements are derived from submitted attempts. Exclude a question from the quiz in Question Bank (bulk action) without touching mock tests.
- **My Performance** (`performance.html`): cards, subject and topic tables, bar/donut/trend charts, attempt comparison with improvement, rule-based suggestions built from the student's own numbers (no AI, nothing invented). Only submitted attempts count. Cohort comparison appears only when 10+ students attempted an exam.
- **Flashcard Learning** (`flashcards.html`): flip, shuffle, bookmark, Known / Need revision with spaced intervals (1, 3, 7, 14, 30 days; "need revision" returns in 10 minutes and is prioritised), private student decks, submit-for-approval. The optional AI card generator is **not included** (no AI integration here).
- **Admin**: Daily Quiz, Flashcards, Performance Analytics and Engagement Analytics modules with filters, sorting, pagination and CSV/Excel export, covered by the role permissions. Student activity (quiz, leaderboard, analyzer, flashcard and counselling-click events) is stored against the student with the original UTM source.

### Laravel phase (what replaces the browser stand-ins)
- Scheduler: `Schedule::command('dailyquiz:run')->everyMinute()->withoutOverlapping()`, called from the Hostinger cron (`* * * * * php artisan schedule:run`). Unique index on `daily_quizzes (exam_id, quiz_date)` is the duplicate-job protection; failures go to `failed_jobs` and an admin notification.
- Tables: daily_quizzes, daily_quiz_questions, daily_quiz_attempts/answers, leaderboard view, streaks, achievements, performance summaries (refreshed by queued jobs), flashcard_decks, flashcards, flashcard_progress, flashcard_bookmarks, learning_activity_events (indexed by student, exam, topic, created_at).
- Scoring, timers, permissions and the 10-student cohort rule must be enforced server-side; the browser versions here are for the UI and logic only.
