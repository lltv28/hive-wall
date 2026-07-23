import { describe, expect, it } from 'vitest';
import { deriveDemoOutcome, BOOK_THRESHOLD } from './demoOutcome';

describe('deriveDemoOutcome', () => {
  it('routes a small, owner-independent business to buy', () => {
    const { outcome, score } = deriveDemoOutcome({
      'q-q2': 'under-100k',
      'q-q3': 'runs-fine',
      'q-q5': 'training',
    });
    expect(score).toBeLessThan(BOOK_THRESHOLD);
    expect(outcome).toBe('buy');
  });

  it('routes a large, owner-dependent business with assets to book', () => {
    const { outcome, score } = deriveDemoOutcome({
      'q-q2': '5m-plus',
      'q-q3': 'grinds-to-halt',
      'q-q5': 'training,courses,recordings',
    });
    expect(score).toBeGreaterThanOrEqual(BOOK_THRESHOLD);
    expect(outcome).toBe('book');
  });

  it('is deterministic for identical answers', () => {
    const answers = { 'q-q2': '300k-1m', 'q-q3': 'slows-down', 'q-q5': 'books,courses' };
    expect(deriveDemoOutcome(answers)).toEqual(deriveDemoOutcome(answers));
  });

  it('caps the score at 100 and never goes negative', () => {
    const max = deriveDemoOutcome({
      'q-q2': '5m-plus',
      'q-q3': 'grinds-to-halt',
      'q-q5': 'training,books,courses,coaching,recordings',
    });
    expect(max.score).toBeLessThanOrEqual(100);

    const min = deriveDemoOutcome({});
    expect(min.score).toBe(0);
    expect(min.outcome).toBe('buy');
  });

  it('caps asset contribution at three assets', () => {
    const three = deriveDemoOutcome({ 'q-q2': 'under-100k', 'q-q3': 'runs-fine', 'q-q5': 'a,b,c' });
    const five = deriveDemoOutcome({ 'q-q2': 'under-100k', 'q-q3': 'runs-fine', 'q-q5': 'a,b,c,d,e' });
    expect(three.score).toBe(five.score);
  });
});
