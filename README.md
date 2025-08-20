# Grindstone Calculator (SvelteKit + Tailwind)

A SvelteKit web app to model Grindstone boards and compute a "best move" chain with scoring.
Includes Jerks/Super enemies with configurable hit ranges and an enemy-avoidance option.

## Features

- **Interactive Board Editor**: Click to place colored tiles, grindstones, enemies, and objectives
- **Path Finding Algorithm**: Advanced DFS algorithm to find the optimal move chain
- **Enemy System**: Place Jerks and Super enemies with configurable Chebyshev hit ranges
- **Scoring System**: Configurable weights for chain length, grindstone thresholds, risk, and objectives
- **Import/Export**: Save and load board configurations as JSON
- **Responsive Design**: Modern UI built with Tailwind CSS

## Game Rules Modeled

- 8-direction movement
- Chain same color tiles
- Grindstone switches (also allowed through colorless grindstone)
- No revisits
- Landing risk penalized by adjacent Angry tiles
- Objectives (chests/keys) give bonuses
- Enemy avoidance with configurable hit ranges

## Dev

```bash
npm install
npm run dev -- --open
```

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

- **Frontend**: SvelteKit 5
- **Styling**: Tailwind CSS
- **Icons**: Lucide Svelte
- **Language**: TypeScript
- **Build Tool**: Vite

## Notes

- Uses minimal, local UI components to avoid heavy dependencies
- Tailwind is preconfigured with forms and typography plugins
- If you want to deploy on GitHub Pages, set `"base": "/<repo>/"` in `vite.config.ts`
