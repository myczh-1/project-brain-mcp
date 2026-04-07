import { describe, expect, it, vi } from 'vitest';
import { handleStdioLine } from './stdio.js';

describe('stdio', () => {
  it('routes a JSON request and returns a success envelope', async () => {
    const handle = vi.fn().mockResolvedValue({ modules: [{ id: 'auth' }] });
    const response = await handleStdioLine(
      JSON.stringify({
        id: 'req-1',
        message: { type: 'list_modules', input: { repo_path: '/repo', limit: 3 } },
      }),
      handle
    );

    expect(handle).toHaveBeenCalledWith({
      type: 'list_modules',
      input: { repo_path: '/repo', limit: 3 },
    });
    expect(response).toEqual({
      id: 'req-1',
      ok: true,
      result: { modules: [{ id: 'auth' }] },
    });
  });

  it('returns a structured error for invalid JSON', async () => {
    const response = await handleStdioLine('{oops', vi.fn());
    expect(response).toMatchObject({
      id: null,
      ok: false,
    });
  });

  it('returns a structured error when the runtime throws', async () => {
    const response = await handleStdioLine(
      JSON.stringify({
        id: 2,
        message: { type: 'analyze', input: { repo_path: '/repo' } },
      }),
      vi.fn().mockRejectedValue(new Error('boom'))
    );

    expect(response).toEqual({
      id: 2,
      ok: false,
      error: { message: 'boom' },
    });
  });
});
