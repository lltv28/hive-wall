type DemoChip = {
  value: string;
};

export function createSeededRandom(seed: number): () => number {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(maxExclusive: number, random: () => number): number {
  if (maxExclusive <= 0) return 0;
  return Math.floor(random() * maxExclusive);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, random);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function pickAutoValues(chips: DemoChip[], multiSelect: boolean, random: () => number): string[] {
  if (chips.length === 0) return [];
  if (!multiSelect) {
    return [chips[randomInt(chips.length, random)].value];
  }

  const maxCount = Math.min(3, chips.length);
  const count = randomInt(maxCount, random) + 1;
  return shuffle(chips, random)
    .slice(0, count)
    .map((chip) => chip.value);
}

// ── URL-param + timing helpers shared by the auto-playing demo surfaces ──────
// (OnboardingChat — the quiz — and PlanFlow — the member dashboard.)

export function queryFlag(params: URLSearchParams, key: string): boolean {
  const value = params.get(key);
  return value === '1' || value === 'true';
}

export function queryNumber(
  params: URLSearchParams,
  key: string,
  fallback: number,
  opts: { min?: number; max?: number } = {},
): number {
  const raw = Number(params.get(key));
  if (!Number.isFinite(raw)) return fallback;
  const withMin = opts.min !== undefined ? Math.max(opts.min, raw) : raw;
  return opts.max !== undefined ? Math.min(opts.max, withMin) : withMin;
}

export function computeDemoDelay(
  baseMs: number,
  speed: number,
  random: () => number,
  opts: { minMs: number; minJitter?: number; maxJitter?: number },
): number {
  const minJitter = opts.minJitter ?? 0.95;
  const maxJitter = opts.maxJitter ?? 1.2;
  const safeSpeed = Math.max(0.1, speed);
  const jitter = minJitter + random() * (maxJitter - minJitter);
  const computed = Math.round((baseMs * jitter) / safeSpeed);
  const floor = Math.round(opts.minMs / safeSpeed);
  return Math.max(floor, computed);
}
