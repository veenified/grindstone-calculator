# Grindstone Calculator (React + Vite + Tailwind)

A small web app to model Grindstone boards and compute a “best move” chain with scoring.
Includes Jerks/Super enemies with configurable hit ranges and an enemy-avoidance option.

## Dev
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Notes
- Uses minimal, local UI components under `src/components/ui/` to avoid heavy deps.
- Tailwind is preconfigured.
- If you want to deploy on GitHub Pages, set `"base": "/<repo>/"` in `vite.config.ts`.
