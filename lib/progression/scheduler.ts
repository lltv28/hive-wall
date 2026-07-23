export type PaceConfig = {
  min: number;
  max: number;
  charsPerSecond: number;
  settleMs: number;
};

const DEFAULT_PACE: PaceConfig = {
  min: 700,
  max: 1100,
  charsPerSecond: 60,
  settleMs: 400,
};

export function computeTypingDelayMs(text: string, pace: PaceConfig = DEFAULT_PACE): number {
  const normalizedCharsPerSecond = pace.charsPerSecond > 0 ? pace.charsPerSecond : DEFAULT_PACE.charsPerSecond;
  const computed = Math.round((text.length / normalizedCharsPerSecond) * 1000);

  return Math.max(pace.min, Math.min(pace.max, computed));
}

export function createTransitionScheduler(clearTimer: (id: ReturnType<typeof setTimeout>) => void) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    schedule(key: string, fn: () => void, delay: number) {
      const existing = timers.get(key);
      if (existing) {
        clearTimer(existing);
      }

      const id = setTimeout(() => {
        timers.delete(key);
        fn();
      }, delay);

      timers.set(key, id);
    },

    cancelAll() {
      timers.forEach((id) => clearTimer(id));
      timers.clear();
    },
  };
}
