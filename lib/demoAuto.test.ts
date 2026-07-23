import { describe, expect, it } from 'vitest';
import { createSeededRandom, pickAutoValues } from './demoAuto';

const CHIPS = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
  { label: 'C', value: 'c' },
  { label: 'D', value: 'd' },
  { label: 'E', value: 'e' },
];

describe('createSeededRandom', () => {
  it('returns the same number sequence for the same seed', () => {
    const randomA = createSeededRandom(42);
    const randomB = createSeededRandom(42);

    expect([randomA(), randomA(), randomA(), randomA()]).toEqual([randomB(), randomB(), randomB(), randomB()]);
  });

  it('returns a different number sequence for different seeds', () => {
    const randomA = createSeededRandom(42);
    const randomB = createSeededRandom(43);

    expect([randomA(), randomA(), randomA()]).not.toEqual([randomB(), randomB(), randomB()]);
  });
});

describe('pickAutoValues', () => {
  it('returns exactly one valid value for single-select questions', () => {
    const values = pickAutoValues(CHIPS, false, createSeededRandom(7));

    expect(values).toHaveLength(1);
    expect(CHIPS.some((chip) => chip.value === values[0])).toBe(true);
  });

  it('returns 1-3 unique valid values for multi-select questions', () => {
    const values = pickAutoValues(CHIPS, true, createSeededRandom(9));

    expect(values.length).toBeGreaterThanOrEqual(1);
    expect(values.length).toBeLessThanOrEqual(3);
    expect(new Set(values).size).toBe(values.length);
    expect(values.every((value) => CHIPS.some((chip) => chip.value === value))).toBe(true);
  });
});
