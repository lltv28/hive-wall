import { execFile } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { promisify } from 'node:util';

const run = promisify(execFile);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.LATTICE_URL ?? 'http://localhost:3010/lattice';
const OUT = 'C:/tmp/lattice';

// Times chosen to land inside each phase of the first cycle:
// wide 0–8s, drill 8–26s, pullback 26–28.5s, second drill 28.5–46.5s.
const SHOTS = [
  { name: 'wide', ms: 5_000 },
  { name: 'drill-1', ms: 14_000 },
  { name: 'pullback', ms: 27_000 },
  { name: 'drill-2', ms: 36_000 },
];

mkdirSync(OUT, { recursive: true });

for (const shot of SHOTS) {
  await run(CHROME, [
    '--headless=new',
    '--window-size=1600,900',
    `--virtual-time-budget=${shot.ms}`,
    `--screenshot=${OUT}/${shot.name}.png`,
    URL,
  ]);
  console.log(`shot ${shot.name}`);
}
