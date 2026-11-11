# Swole: master prompt (v01)

Read this first in every session. It is the source of truth for what Swole is, what is in scope, and how to build it. Change it only when the owner agrees, and bump the version.

## What it is

Swole is a free, offline gym log that runs as an installable web app (PWA). Tap the muscles you want to train on a body map, log your sets, and let the app tell you which muscles are ready to train today.

- Free forever. No account, no ads, no analytics, nothing to sell.
- All data stays on the device.
- A portfolio piece: design and motion quality matter more than feature count.

Inspired by the idea of GymMane (github.com/InlitX/GymMane), but written from scratch. Do not copy its code, art, text or screenshots (it is GPL-3.0). Do not open its source to "see how they did it".

## How Swole is different

1. **Look and motion.** The owner is a motion designer. Every screen should feel designed, and every transition deliberate.
2. **Simpler and focused.** No nutrition, journal, calculators, widgets, medals or social. A short feature list done very well.
3. **Smart "what to train today".** The body map shows recovery per muscle and proposes today's focus.

## V1 scope

In:
- **Body map picker.** Front and back views, male and female figure toggle. Tap muscles to select them; the app lists matching exercises to build a session.
- **Session logging.** Add exercises, log sets (weight, reps), tick sets done, edit or delete, finish the session. Shows last time's numbers for each exercise.
- **Rest timer.** Starts automatically when a set is ticked. Adjustable length, sound and vibration when done.
- **What to train today.** Each muscle has a recovery state (fresh, recovering, just trained) worked out from recent sessions with simple rules. The body map is tinted by that state and the home screen suggests a focus. Offline rules only, no AI service.
- **Exercise library.** From an open dataset (see Data). Search, filter by muscle and equipment. Add custom exercises.
- **History.** List of past sessions, open one to see what was done.
- **Settings.** kg or lb, light / dark / system theme, figure choice, default rest time, export and import backup (JSON file), delete everything.

Later (not v1, do not build yet):
- Progress charts, records, estimated 1RM, streaks, heatmap
- Routines, weekly plans, progression rules
- Suggested next weight and reps, auto-built sessions
- Website / desktop layout, native Android wrapper
- More languages

## Design

- **Style:** clean minimal. Light theme is the primary design; dark mode is a full second theme, not an inversion.
- Generous spacing, soft shadows, rounded shapes, one accent color, large clear numbers for weight and reps.
- **Body map:** original abstract figures made of smooth rounded muscle shapes, drawn as SVG with one named path per muscle group so they can be tapped, tinted and animated. Male and female, front and back.
- **Motion:** calm and smooth. Soft easing, gentle fades and slides, no bounce, no confetti. Short durations (roughly 200 to 400 ms). Respect the reduced-motion setting.
- Built for one-handed phone use in a gym: big touch targets, key actions in thumb reach, readable at a glance.
- Phone first. It must not break on a wide screen, but desktop layout is not a v1 goal.

## Tech

- **Vite + React + TypeScript**, single-page app.
- **PWA**: installable, works fully offline after first load (service worker caches app and exercise data).
- **Storage**: IndexedDB (via Dexie) on the device. No backend, no network calls except loading the app's own files.
- **Motion**: Motion (Framer Motion) plus CSS transitions.
- **Styling**: CSS variables for theme tokens (colors, spacing, radii, shadows, durations) so light and dark share one system.
- **Tests**: Vitest for the logic that matters (recovery rules, unit conversion, backup import/export).
- **Hosting**: public GitHub repo, GitHub Actions builds and deploys to GitHub Pages on every push to `main`. The Pages link is how the owner checks work from their phone.

## Data

- Exercise data and images come from an open dataset (candidate: `yuhonas/free-exercise-db`). Before importing, confirm its license allows this use, and record the source and license in `CREDITS.md`.
- Map the dataset's muscle names onto Swole's own muscle groups (the ones drawn on the body map).
- User data model, roughly: Exercise, Session, SessionExercise, Set, Settings. Keep a schema version so later updates can migrate data safely.

## How we work

- The owner works from a PC and from their phone, so the repo is the shared memory. Keep this file, a `README.md` and a short `ROADMAP.md` up to date.
- Small steps: one feature or screen per change, each one deployed and checkable on the Pages link.
- The owner is a designer, not a developer. Explain choices in plain language and ask before making decisions about look, feel or scope.
- Show design before polish: get a screen working, let the owner react, then refine.
- Never add accounts, tracking, ads, or anything that sends user data off the device.

## Build order

1. Repo setup: project scaffold, theme tokens, light and dark, deploy to Pages.
2. Body map: figures, tap to select, front/back and male/female toggle.
3. Exercise library: import dataset, list, search, filter.
4. Session logging and rest timer.
5. History.
6. Recovery rules and "what to train today".
7. Settings, backup, PWA install and offline check.
8. Polish pass on motion and details.

## Open questions

- Accent color and typeface.
- Exact muscle groups on the body map (suggested 14 to 16: chest, front/side/rear delts, biceps, triceps, forearms, abs, obliques, traps, lats, lower back, glutes, quads, hamstrings, calves).
- Recovery rule numbers (how many hours until a muscle counts as fresh).
- Whether the owner draws the body figures or they are drafted as SVG first.
