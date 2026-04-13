import { describe, expect, it, vi } from 'vitest';
import type { GitPort } from '../ports/git.js';
import type { StoragePort } from '../ports/storage.js';
import { createRuntime } from './index.js';
import type { RuntimeService } from './service.js';

describe('runtime', () => {
  it('routes high-level module queries through the runtime handler', async () => {
    const service = {
      initializeProject: vi.fn(),
      defineProjectSpec: vi.fn(),
      createChange: vi.fn(),
      updateChange: vi.fn(),
      logDecision: vi.fn(),
      captureNote: vi.fn(),
      recordProgress: vi.fn(),
      startWork: vi.fn(),
      checkpointWork: vi.fn(),
      ingestMemory: vi.fn(),
      finishWork: vi.fn(),
      getDashboard: vi.fn(),
      getProjectContext: vi.fn(),
      getChangeContext: vi.fn(),
      listModules: vi.fn().mockResolvedValue({ modules: [{ id: 'auth' }] }),
      getModuleContext: vi.fn(),
      getContextBudgetPlan: vi.fn(),
      getRecentActivity: vi.fn(),
      analyze: vi.fn(),
      getState: vi.fn(),
    } as unknown as RuntimeService;

    const runtime = createRuntime({} as StoragePort, {} as GitPort, '/repo', service);
    const result = await runtime.handle({ type: 'list_modules', input: { repo_path: '', limit: 5 } });

    expect(service.listModules).toHaveBeenCalledWith({ repo_path: '/repo', limit: 5 });
    expect(result).toEqual({ modules: [{ id: 'auth' }] });
  });

  it('routes finish_work as a mutating command', async () => {
    const service = {
      initializeProject: vi.fn(),
      defineProjectSpec: vi.fn(),
      createChange: vi.fn(),
      updateChange: vi.fn(),
      logDecision: vi.fn(),
      captureNote: vi.fn(),
      recordProgress: vi.fn(),
      startWork: vi.fn(),
      checkpointWork: vi.fn(),
      ingestMemory: vi.fn(),
      finishWork: vi.fn().mockResolvedValue({ status: 'ok', change_id: 'c1', final_status: 'done', reflection: { summary: 'done', confidence: 'mid', top_next_actions: [] } }),
      getDashboard: vi.fn(),
      getProjectContext: vi.fn(),
      getChangeContext: vi.fn(),
      listModules: vi.fn(),
      getModuleContext: vi.fn(),
      getContextBudgetPlan: vi.fn(),
      getRecentActivity: vi.fn(),
      analyze: vi.fn(),
      getState: vi.fn(),
    } as unknown as RuntimeService;

    const runtime = createRuntime({} as StoragePort, {} as GitPort, '/repo', service);
    const result = await runtime.handle({ type: 'finish_work', input: { repo_path: '', change_id: 'c1' } });

    expect(service.finishWork).toHaveBeenCalledWith({ repo_path: '/repo', change_id: 'c1' });
    expect(result).toMatchObject({ status: 'ok', change_id: 'c1', final_status: 'done' });
  });

  it('rejects mutating commands without repo_path when no runtime default is configured', async () => {
    const service = {
      initializeProject: vi.fn(),
      defineProjectSpec: vi.fn(),
      createChange: vi.fn(),
      updateChange: vi.fn(),
      logDecision: vi.fn(),
      captureNote: vi.fn(),
      recordProgress: vi.fn(),
      startWork: vi.fn(),
      checkpointWork: vi.fn(),
      ingestMemory: vi.fn(),
      finishWork: vi.fn(),
      getDashboard: vi.fn(),
      getProjectContext: vi.fn(),
      getChangeContext: vi.fn(),
      listModules: vi.fn(),
      getModuleContext: vi.fn(),
      getContextBudgetPlan: vi.fn(),
      getRecentActivity: vi.fn(),
      analyze: vi.fn(),
      getState: vi.fn(),
    } as unknown as RuntimeService;

    const runtime = createRuntime({} as StoragePort, {} as GitPort, undefined, service);

    await expect(runtime.handle({
      type: 'create_change',
      input: { repo_path: '', change: { title: 'demo', summary: 'demo' } },
    })).rejects.toThrow(/repo_path is required/i);
    expect(service.createChange).not.toHaveBeenCalled();
  });
});
