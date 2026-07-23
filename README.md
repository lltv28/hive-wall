# lattice-wall

A hands-free recording demo at **`/lattice`**, built at a fixed **1920×1080**. It renders a canvas wheel of 96 lead nodes fanning out from 6 sales-rep hubs, with a live scoreboard rail down the left side. An auto-tour loops on its own: WIDE on the whole wheel, then three DRILLs into individual leads (each showing that lead's real quiz funnel in a floating card beside its node), with a brief pullback between drills. No mouse or keyboard input is required — point a screen recorder at the page and let it run.

## Running it

```bash
npm run dev -- -p 3010
```

Open `http://localhost:3010/lattice`. The tour starts automatically and loops; one full cycle is roughly 70 seconds (wide 0–8s, drill 8–26s, pullback 26–28.5s, drill 28.5–46.5s, pullback, drill 49–67s, pullback, repeat).

Tour timing constants (`WIDE_MS`, `DRILL_MS`, `PULLBACK_MS`, `DRILLS_PER_CYCLE`) and the deterministic per-cycle lead selection live in `lib/lattice/tour.ts`.

## Screenshot sweep

`scripts/shoot-lattice.mjs` drives headless Chrome against a running dev server and drops one PNG per tour phase into `C:/tmp/lattice/`:

```bash
node scripts/shoot-lattice.mjs
```

It expects Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe` and the dev server at `http://localhost:3010/lattice` (override with the `LATTICE_URL` env var). The four shots (`wide`, `drill-1`, `pullback`, `drill-2`) are timed to land inside their respective phases of the first cycle.

## Recording notes

- **Record from a real, focused browser window**, not headless Chrome and not a background tab. The quiz card's progress badge (`components/OnboardingProgress.tsx`) and its auto-scroll (`lib/useChatFlow.ts`) are driven by `requestAnimationFrame`, which browsers throttle or stop firing in headless mode and in backgrounded tabs. In those conditions the card visibly freezes on its intro screen with a 0% badge even though the underlying quiz is advancing normally — screenshot sweeps taken with the script above will show this. A real, focused window does not have this problem.
- Funnel playback speed is `FUNNEL_OPTS.speed` in `components/lattice/QuizCard.tsx`, currently `3`. That value is also the ceiling: `demoSpeed` is clamped to a max of `3` in `components/OnboardingChat.tsx`. It has not been tuned against a real visible browser — watch a drill in a focused window before a recording session and adjust if the funnel is racing ahead of or lagging behind the drill window.
- The tour is deterministic per cycle seed, so a recording is reproducible: the same seed always drills the same three leads in the same order.
