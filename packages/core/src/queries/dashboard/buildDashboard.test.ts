import { describe, expect, it } from 'vitest';
import type { GitPort } from '../../ports/git.js';
import type { StoragePort } from '../../ports/storage.js';
import { buildDashboardData, buildDashboardSummary } from './buildDashboard.js';

function createStorageStub(overrides: Partial<StoragePort> = {}): StoragePort {
  return {
    getRepoRootPath: () => '/repo',
    readManifest: () => null,
    buildFallbackManifest: () => ({
      project_name: 'demo',
      summary: 'demo summary',
      repo_type: 'application',
      primary_stack: [],
      created_at: '',
      updated_at: '',
    }),
    readProjectSpec: () => null,
    readProgress: () => [],
    readDecisions: () => [],
    readMilestones: () => [],
    readNotes: () => [],
    upsertInferredMilestones: () => [],
    ...overrides,
  } as unknown as StoragePort;
}

function createGitStub(overrides: Partial<GitPort> = {}): GitPort {
  return {
    parseLog: () => [],
    parseLogSinceDays: () => [],
    calculateHotPaths: () => [],
    ...overrides,
  } as unknown as GitPort;
}

describe('buildDashboardData', () => {
  it('returns an uninitialized dashboard when no manifest exists', async () => {
    const result = await buildDashboardData({ repo_path: '/repo', include_deep_analysis: false }, createStorageStub(), createGitStub());

    expect(result.meta.is_initialized).toBe(false);
    expect(result.overview.project_name).toBe('repo');
    expect(result.memory.progress_memory.empty_message).toContain('Record progress');
  });

  it('builds initialized dashboard data without deep analysis', async () => {
    const storage = createStorageStub({
      readManifest: () => ({
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
      readProgress: () => [{ id: 'p1', date: '', summary: 'Made progress', status: 'in_progress', blockers: [], related_change_id: 'c1', module_ids: [], confidence: 'mid' }],
      readDecisions: () => [{ id: 'd1', title: 'Decision', decision: 'Ship it', rationale: '', alternatives_considered: [], scope: 'project', module_ids: [], created_at: '' }],
      readMilestones: () => [{ name: 'Dashboard', status: 'completed', confidence: 'high', completion: 'high' }],
      readNotes: () => [{ id: 'n1', time: '', tags: [], note: 'Check dashboard', module_ids: [] }],
    });
    const git = createGitStub({
      parseLog: () => [{ hash: 'a1', author: 'dev', time: '2026-04-10T00:00:00.000Z', message: 'refactor dashboard', tag: 'refactor', files_changed: ['src/dashboard.ts'] }],
      calculateHotPaths: () => [{ path: 'src/dashboard.ts', change_count: 2 }],
    });

    const result = await buildDashboardData({ repo_path: '/repo', include_deep_analysis: false, recent_commits: 5 }, storage, git);

    expect(result.meta.is_initialized).toBe(true);
    expect(result.overview.project_name).toBe('ProjectBrain');
    expect(result.overview.goals).toEqual(['Stable dashboard', 'Clear progress']);
    expect(result.activity.recent_commits).toHaveLength(1);
    expect(result.memory.decision_memory.items).toHaveLength(1);
    expect(buildDashboardSummary(result)).toContain('Top next action:');
  });
});
