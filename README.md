# Discipline OS

A personal weekly planner and productivity tracker. React, TypeScript, Vite, Tailwind CSS, Zustand, React Router, React Hook Form, Zod, Recharts. Data lives in your browser's localStorage.

## Run it

    npm install
    npm run dev        # start the dev server
    npm test           # all tests (domain logic + UI flows)
    npm run typecheck
    npm run build      # typecheck + production build into dist/

## What it does

- **Dashboard**: today's progress, timeline with current / upcoming / completed / missed states, weekly overview.
- **Weekly Planner**: Monday to Sunday, split into morning / afternoon / evening. Full week on desktop, a day selector on mobile. Week menu: copy another week, start from a template, carry unfinished tasks forward, save as template.
- **My Tasks**: search and filter by time range, category, status and priority.
- **Analytics**: daily and weekly completion, completed vs unfinished, scheduled vs focused time, category breakdown, streak, weekday pattern, most-missed tasks.
- **Daily Journal**: five-prompt daily entry, searchable history, weekly review.
- **Routine Templates**: day and week templates you can create, edit, duplicate and apply.
- **Settings**: category manager, JSON backup / restore, reset.

## Architecture

    src/
      app/          router, layout, navigation, lazy dialogs
      components/   shared UI (Modal, Menu, Field, ErrorBoundary...)
      domain/       pure logic, no React: types + Zod schemas, time math,
                    stats, analytics, templates, journal, migration, seed
      storage/      StorageAdapter interface + LocalStorageAdapter
      stores/       Zustand: app data (persisted) and UI state (dialogs, toasts)
      hooks/        useNow, useTheme, useTaskActions, useMediaQuery
      features/     one folder per screen
      test/         shared test setup and helpers

Key decisions:

- **Dates are `YYYY-MM-DD` strings (local); times are minutes since midnight.** This keeps overlap checks and duration math simple and avoids timezone bugs. Day of week and period (morning / afternoon / evening) are derived, never stored.
- **Status is derived at read time** (completed, current, upcoming, missed), so it cannot go stale in storage.
- **Templates are copied, never linked.** Editing a template never changes tasks already scheduled. Replacing a day or week only removes unfinished tasks; completed tasks are history and are always kept.
- **Focused time is never estimated.** It is only what you enter when editing a task.
- **All persistence goes through `StorageAdapter`.** Stored data is versioned and validated with Zod on load; unreadable data is backed up under a `:corrupt-<timestamp>` key rather than overwritten. Open tabs stay in sync through the `storage` event.

## Moving to Supabase later

Implement `StorageAdapter` (`load` / `save`) in `src/storage/` against Supabase and swap the exported `storage` instance. Because `load` and `save` are currently synchronous, the one real change is making them async and loading before first render. Components and the domain layer do not need to change.

## Known limitations

- Data is stored per browser. Use Settings > Export backup regularly, and to move devices.
- localStorage holds about 5 MB; years of daily use stay well below that, but the app shows a banner if a save fails.
- No recurring-task engine: repetition is done by applying or copying templates, which is what keeps history safe.
- Mobile layout and charts are tested with automated render tests, not on physical devices.
