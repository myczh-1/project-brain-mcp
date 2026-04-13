import { describe, expect, it } from 'vitest';
import { parseRuntimeMessage } from './protocol.js';

describe('parseRuntimeMessage', () => {
  it('accepts known runtime messages with object input', () => {
    expect(parseRuntimeMessage({ type: 'list_modules', input: { repo_path: '/repo', limit: 5 } })).toEqual({
      type: 'list_modules',
      input: { repo_path: '/repo', limit: 5 },
    });
  });

  it('normalizes get_state when repo_path is omitted', () => {
    expect(parseRuntimeMessage({ type: 'get_state' })).toEqual({
      type: 'get_state',
      repo_path: '',
    });
  });

  it('rejects unknown runtime message types', () => {
    expect(() => parseRuntimeMessage({ type: 'unknown_message', input: {} })).toThrow(/Invalid input/);
  });

  it('rejects create_change messages that omit required change fields', () => {
    expect(() => parseRuntimeMessage({
      type: 'create_change',
      input: { repo_path: '/repo', change: { summary: 'missing title' } },
    })).toThrow(/title/i);
  });

  it('rejects extra fields on runtime inputs instead of treating them as valid', () => {
    expect(() => parseRuntimeMessage({
      type: 'list_modules',
      input: { repo_path: '/repo', limit: 5, unexpected: true },
    })).toThrow(/unrecognized key/i);
  });
});
