# optra

A personal internship & job opportunity tracker.

## Running it

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Data lives in a local SQLite file at `data/optra.db` (gitignored, created
automatically on first run). Back it up by copying that file.

## Features

- **Dashboard**: every application in one table with search, season/category
  filters, status filter pills, and sortable columns. Change an application's
  status straight from the table.
- **Statuses**: Saved → Applied → Online Assessment → Interviewing →
  Offer / Rejected / Ghosted / Withdrawn, plus stats: active pipeline, offers,
  response rate.
- **CSV import** (`/import`): export any tracking spreadsheet as CSV and drop
  it in. Header rows are auto-detected (title/summary rows above them are
  skipped), columns are auto-mapped with manual override, and statuses, dates,
  seasons, and categories are normalized on the way in.
- **Per-application detail**: posting + portal links, season (e.g.
  "Summer 2027"), category (SWE / Data / AI-ML / Quant / Research), location,
  deadline, resume version, cover letter, referral flag, free-form notes.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · SQLite via Drizzle ORM +
better-sqlite3.
