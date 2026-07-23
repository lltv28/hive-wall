import { describe, expect, it } from 'vitest';
import { createUniqueChipValue } from './chipOptions';

describe('createUniqueChipValue', () => {
  it('slugifies labels and ensures uniqueness', () => {
    const existing = ['option', 'option-2', 'other'];

    expect(createUniqueChipValue('Option', existing)).toBe('option-3');
    expect(createUniqueChipValue('New Label', existing)).toBe('new-label');
  });

  it('falls back to default base when label has no alphanumerics', () => {
    expect(createUniqueChipValue('***', [])).toBe('option');
  });
});
