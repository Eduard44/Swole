# Swole

A free, offline gym log that runs as an installable web app. Tap the muscles you want to train on a body map, log your sets, and let the app tell you which muscles are ready to train today.

No account, no ads, no analytics. All data stays on your device.

**Live app:** https://eduard44.github.io/Swole/ (updates on every push to `main`)

## How changes get in

Each change is built on a side branch and opened as a pull request. GitHub runs the tests and the build on it and shows a green tick or a red cross. Pressing **Merge** puts the change on `main`, and the live app updates about half a minute later.

## Status

Steps 1 and 2 of 8 are done: project setup, themes and deploy, and the hand-drawn body map (front and back, male and female, tap a muscle to zoom in and mark it in red pencil). See [ROADMAP.md](ROADMAP.md) for what comes next.

## Run it on a computer

You need [Node.js](https://nodejs.org) 22 or newer.

```
npm install
npm run dev      # start the app locally
npm test         # run the tests
npm run build    # build the version that gets deployed
```

## Where things are

- `src/styles/tokens.css`: every color, spacing, radius and animation speed, plus the font. Change the look here.
- `src/styles/app.css`: how the screen is laid out and how the body map is colored.
- `src/drawn/`: the hand-drawn look (wobbly pencil lines, grain, drawn boxes).
- `src/bodymap/figures.ts`: the figure drawings, as lists of points. Reshape a muscle here.
- `src/bodymap/`: the body map itself, the 17 muscle groups, zoom and selection.
- `src/theme/`: the light / dark / system switch.
- `src/App.tsx`: the current screen.
- `.github/workflows/deploy.yml`: builds and publishes the app to GitHub Pages.
- `.github/workflows/check.yml`: runs the tests and the build on every pull request.
- `CREDITS.md`: third-party material used in the app and its license.
