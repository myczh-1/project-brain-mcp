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

  it('rejects malformed runtime messages before dispatch', async () => {
    const handle = vi.fn();
    const response = await handleStdioLine(
      JSON.stringify({
        id: 'req-bad',
        message: { type: 'list_modules', input: 'not-an-object' },
      }),
      handle
    );

    expect(handle).not.toHaveBeenCalled();
    expect(response).toMatchObject({
      id: null,
      ok: false,
      error: {
        message: expect.stringContaining('Invalid input'),
      },
    });
  });

  it('rejects create_change requests that pass schema shape but miss required nested fields', async () => {
    const handle = vi.fn();
    const response = await handleStdioLine(
      JSON.stringify({
        id: 'req-bad-change',
        message: { type: 'create_change', input: { repo_path: '/repo', change: { summary: 'missing title' } } },
      }),
      handle
    );

    expect(handle).not.toHaveBeenCalled();
    expect(response).toMatchObject({
      id: null,
      ok: false,
      error: {
        message: expect.stringContaining('title'),
      },
    });
  });

  it('rejects unsupported runtime message types before dispatch', async () => {
    const handle = vi.fn();
    const response = await handleStdioLine(
      JSON.stringify({
        id: 'req-unknown',
        message: { type: 'totally_unknown', input: {} },
      }),
      handle
    );

    expect(handle).not.toHaveBeenCalled();
    expect(response).toMatchObject({
      id: null,
      ok: false,
      error: {
        message: expect.stringContaining('Invalid input'),
      },
    });
  });

  it('accepts get_state without repo_path and normalizes it through the schema', async () => {
    const handle = vi.fn().mockResolvedValue({ state: 'ok' });
    const response = await handleStdioLine(
      JSON.stringify({
        id: 'req-state',
        message: { type: 'get_state' },
      }),
      handle
    );

    expect(handle).toHaveBeenCalledWith({ type: 'get_state', repo_path: '' });
    expect(response).toEqual({
      id: 'req-state',
      ok: true,
      result: { state: 'ok' },
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
