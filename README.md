# Leonardo Raffaello Maximilian Gasparro's portfolio

A Vite site with separate Mathematics and Software Development pages, shared light/dark themes, and an optional Three.js globe on the software page.

Pages are available at `/`, `/mathematics/`, and `/software/`. Each route uses a directory index so URLs work directly on GitHub Pages without routing rules.

## Local development

```bash
npm install
npm run dev
```

Vite prints the local URL (normally http://localhost:5173). Edit files under `src/`; static assets live in `static/`. Local edits do not require a production build.

## Production

```bash
npm run build
```

The build includes all three pages and writes the published site to `docs/`. If GitHub Pages serves that directory, rebuild it before publishing source changes. Do not edit generated files directly.
