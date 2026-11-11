# Swole

A free, offline gym log that runs as an installable web app. Tap the muscles you want to train on a body map, log your sets, and let the app tell you which muscles are ready to train today.

No account, no ads, no analytics. All data stays on your device.

**Live app:** https://eduard44.github.io/Swole/ (updates on every push to `main`)

## Status

Step 1 of 8 is done: project setup, theme tokens, light and dark themes, and automatic deploy. See [ROADMAP.md](ROADMAP.md) for what comes next.

## Run it on a computer

You need [Node.js](https://nodejs.org) 22 or newer.

```
npm install
npm run dev      # start the app locally
npm test         # run the tests
npm run build    # build the version that gets deployed
```

## Where things are

- `src/styles/tokens.css`: every color, spacing, radius, shadow and animation speed. Change the look here.
- `src/theme/`: the light / dark / system switch.
- `src/App.tsx`: the current screen (a placeholder that shows the theme).
- `.github/workflows/deploy.yml`: builds and publishes the app to GitHub Pages.
