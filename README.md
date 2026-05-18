# Sarvam Platform — frontend assignment

React + TypeScript + Vite app implementing the Sarvam AI frontend-intern brief:

- **Inference Playground** (`/inference`) — streaming responses with multi-modal (text / voice) input, live token + tokens-per-second metrics, and graceful mid-stream error handling.
- **Model Output Diff** (`/diff`) — side-by-side and unified comparison of two model outputs with a hand-rolled, token-level LCS diff.
- **Home** (`/`) — landing page surfacing both routes.

The deployment also serves three Sarvam-dashboard clone pages (`/playground`, `/translate`, `/vision`) used as visual reference for the design system; they are not part of the assignment work.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (Vite picks the next free port if 5173 is busy).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b` type-check + production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over all `.ts` / `.tsx` files |

## Project layout

```
src/
├── App.tsx, main.tsx       # router + entry
├── index.css                # global resets + slider styling (no design tokens)
├── constants/               # design tokens — colors, fonts, spacing, sizes
├── components/
│   ├── layout/              # Layout, Sidebar, PageHeader
│   └── ui/                  # Button, Card, ListItem, Chip, Slider, etc.
├── features/
│   ├── home/                # HomePage
│   ├── inference/           # Part A — playground page, hooks, mock stream
│   │   ├── hooks/           # useStream, useStreamMetrics, useAudioRecording, useMicLevels
│   │   ├── lib/mockStream.ts
│   │   └── components/
│   ├── diff/                # Part B — diff page, LCS implementation
│   │   ├── lib/             # tokenize, lcs, parallelStream
│   │   └── components/
│   └── NotFoundPage.tsx     # /* catch-all
├── clones/                  # visual references to dashboard.sarvam.ai
└── fonts/sarvam.css         # self-hosted Matter + Season Mix declarations
```

## Design system

All tokens live in [`src/constants/`](src/constants/) and are imported by every component. **Never hardcode a hex or font stack** — import from `COLORS`, `FONTS`, `FONT_SIZE`, `FONT_WEIGHT`, `SPACE`, `RADIUS`, `ICON`, `SIZE`.

Fonts (Matter + Season Mix) are self-hosted under [`public/fonts/`](public/fonts/) and registered in [`src/fonts/sarvam.css`](src/fonts/sarvam.css). The two regular-weight files are preloaded from `index.html`.

## Streaming

The inference playground writes the Fetch + `ReadableStream` loop by hand — no streaming SDK. The mock backend lives in [`features/inference/lib/mockStream.ts`](src/features/inference/lib/mockStream.ts) and emits SSE-style frames with a deliberate failure mode that the **Error demo** toggle in the header triggers, so the partial-output + retry behavior can be exercised live.

## Diff algorithm

The diff is computed by an LCS dynamic-programming table with backtracking, in [`features/diff/lib/lcs.ts`](src/features/diff/lib/lcs.ts). Shared prefix and suffix are trimmed first so the DP only runs on the changed middle. Time and space complexity are O(n·m); for the chat-style outputs this assignment targets (a few hundred tokens) it finishes in well under a millisecond. No third-party diff library is used.

## Deployment

- SPA rewrite + long-lived caching for fonts/assets is configured in [`vercel.json`](vercel.json).
- The production bundle is ~345 KB JS / 17 KB CSS (gzip ~101 KB / 4 KB) plus four self-hosted woff2 fonts.
