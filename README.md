# Luminous

A calm, guided wellness app — mood check-ins, an AI-grounded Alexander Technique / body-awareness guide, ambient sound, and a Pomodoro-style focus timer. Built with [Next.js](https://nextjs.org) and deployed as a static site to GitHub Pages.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000/luminous-app](http://localhost:3000/luminous-app) (the app is configured with a `/luminous-app` base path to match its GitHub Pages URL).

## Build

```bash
npm run build
```

Produces a static export in `out/`.

## Deployment

Pushing to `main` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the static export and publishes it to GitHub Pages.

## Notes

- Reflections, study logs, and exercise counts persist to the browser's `localStorage`, scoped to each device.
- The Luminous Guide's free-text replies call the Anthropic API directly from the browser with no API key configured (there's no backend in this static deployment to hold one safely), so those calls fail gracefully and fall back to a static message. Wire up a real backend if you want live AI replies.
