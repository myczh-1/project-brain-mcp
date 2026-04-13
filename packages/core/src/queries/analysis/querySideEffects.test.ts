import { describe, expect, it, vi } from 'vitest';
import type { GitPort } from '../../ports/git.js';
import type { StoragePort } from '../../ports/storage.js';
import { brainAnalyze } from './brainAnalyze.js';
import { suggestNextActionsTool } from './suggestNextActions.js';
import { buildDashboardData } from '../dashboard/buildDashboard.js';

function createStorageStub(overrides: Partial<StoragePort> = {}): StoragePort {
  return {
    getRepoRootPath: () => '/repo',
    readManifest: () => ({
      project_name: 'ProjectBrain',
      summary: 'Memory engine',
      repo_type: 'application',
      primary_stack: ['ts'],
      long_term_goal: 'Stable dashboard; Clear progress',
      created_at: '',
      updated_at: '',
    }),
    buildFallbackManifest: () => ({
      project_name: 'ProjectBrain',
      summary: 'Memory engine',
      repo_type: 'application',
      primary_stack: ['ts'],
      long_term_goal: 'Stable dashboard; Clear progress',
      created_at: '',
      updated_at: '',
    }),
    readProjectSpec: () => ({
      product_goal: 'Keep context durable',
      non_goals: [],
      architecture_rules: [],
      coding_rules: [],
      agent_rules: [],
      source: 'test',
      updated_at: '',
    }),
    readProgress: () => [],
    readDecisions: () => [],
    readMilestones: () => [],
    readNotes: () => [],
    upsertInferredMilestones: vi.fn(() => {
      throw new Error('query path must not persist inferred milestones');
    }),
    ...overrides,
  } as unknown as StoragePort;
}

function createGitStub(overrides: Partial<GitPort> = {}): GitPort {
  return {
    parseLog: () => [
      {
        hash: 'a1',
        author: 'dev',
        time: '2026-04-10T00:00:00.000Z',
        message: 'refactor cleanup for dashboard',
        tag: 'refactor',
        files_changed: ['src/dashboard.ts'],
      },
      {
        hash: 'a2',
        author: 'dev',
        time: '2026-04-09T12:00:00.000Z',
        message: 'refactor restructure runtime flow',
        tag: 'refactor',
        files_changed: ['src/runtime.ts'],
      },
      {
        hash: 'a3',
        author: 'dev',
        time: '2026-04-09T00:00:00.000Z',
        message: 'docs update for guide',
        tag: 'docs',
        files_changed: ['README.md'],
      },
      {
        hash: 'a4',
        author: 'dev',
        time: '2026-04-08T00:00:00.000Z',
        message: 'refactor cleanup follow-up',
        tag: 'refactor',
        files_changed: ['src/other.ts'],
      },
      {
        hash: 'a5',
        author: 'dev',
        time: '2026-04-07T00:00:00.000Z',
        message: 'documentation refresh for onboarding docs',
        tag: 'docs',
        files_changed: ['docs/guide.md'],
      },
    ],
    parseLogSinceDays: () => [],
    calculateHotPaths: () => [{ path: 'src/dashboard.ts', change_count: 3 }],
    ...overrides,
  } as unknown as GitPort;
}

describe('query paths stay side-effect free', () => {
  it('brainAnalyze infers milestones without persisting them', async () => {
    const storage = createStorageStub();

    const result = await brainAnalyze({ repo_path: '/repo', depth: 'full', recent_commits: 10 }, storage, createGitStub());

    expect(result.progress.milestones).toEqual([
      expect.objectContaining({ name: 'Code Refactoring', status: 'not_started' }),
      expect.objectContaining({ name: 'Documentation', status: 'not_started' }),
    ]);
    expect(storage.upsertInferredMilestones).not.toHaveBeenCalled();
  });

  it('suggestNextActions infers milestones without persisting them', async () => {
    const storage = createStorageStub();

    await suggestNextActionsTool({ repo_path: '/repo', recent_commits: 10 }, storage, createGitStub());

    expect(storage.upsertInferredMilestones).not.toHaveBeenCalled();
  });

  it('buildDashboard shallow reads do not persist inferred milestones', async () => {
    const storage = createStorageStub();

    const result = await buildDashboardData(
      { repo_path: '/repo', include_deep_analysis: false, recent_commits: 10 },
      storage,
      createGitStub()
    );

    expect(result.meta.is_initialized).toBe(true);
    expect(storage.upsertInferredMilestones).not.toHaveBeenCalled();
  });
});
