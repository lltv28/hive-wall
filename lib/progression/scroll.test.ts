import { describe, expect, it } from 'vitest';
import { clamp, computeTopScrollTop } from './scroll';

describe('clamp', () => {
  it('keeps a value within the provided bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
  });
});

describe('computeTopScrollTop', () => {
  it('aligns the active element to the top of the container with margin', () => {
    expect(
      computeTopScrollTop({
        containerTop: 100,
        containerScrollTop: 200,
        containerHeight: 800,
        containerScrollHeight: 3000,
        elementTop: 500,
        elementHeight: 200,
        margin: 16,
      }),
    ).toBe(584);
  });

  it('clamps to the top of the container', () => {
    expect(
      computeTopScrollTop({
        containerTop: 100,
        containerScrollTop: 0,
        containerHeight: 800,
        containerScrollHeight: 3000,
        elementTop: -100,
        elementHeight: 50,
        margin: 16,
      }),
    ).toBe(0);
  });

  it('clamps to the bottom of the container', () => {
    expect(
      computeTopScrollTop({
        containerTop: 100,
        containerScrollTop: 2000,
        containerHeight: 800,
        containerScrollHeight: 3000,
        elementTop: 2900,
        elementHeight: 200,
        margin: 16,
      }),
    ).toBe(2200);
  });
});
