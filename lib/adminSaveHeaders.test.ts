import { describe, expect, it } from 'vitest';
import { buildConfigSaveHeaders } from './adminSaveHeaders';

describe('buildConfigSaveHeaders', () => {
  it('always sends JSON content-type', () => {
    expect(buildConfigSaveHeaders()).toEqual({
      'Content-Type': 'application/json',
    });
  });

  it('adds the config write token header when provided', () => {
    expect(buildConfigSaveHeaders('  secret-token  ')).toEqual({
      'Content-Type': 'application/json',
      'x-config-write-token': 'secret-token',
    });
  });
});
