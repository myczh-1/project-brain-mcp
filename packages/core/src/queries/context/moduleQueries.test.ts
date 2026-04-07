import { describe, expect, it } from 'vitest';
import { listModules } from './listModules.js';
import { moduleContext } from './getModuleContext.js';
import type { GitPort } from '../../ports/git.js';
import type { StoragePort } from '../../ports/storage.js';

function createStorageStub(): StoragePort {
  return {
    ensureBrainDir: () => '',
    brainDirExists: () => true,
    getBrainDir: () => '',
    readManifest: () => null,
    writeManifest: () => '',
    buildFallbackManifest: () => ({ project_name: 'demo', summary: '', repo_type: 'application', primary_stack: [], created_at: '', updated_at: '' }),
    manifestExists: () => true,
    getManifestPath: () => '',
    readProjectSpec: () => null,
    writeProjectSpec: () => '',
    getProjectSpecPath: () => '',
    readChange: () => null,
    writeChange: () => '',
    readAllChanges: () => [{
      id: 'c1',
      title: 'Fix auth bypass',
      summary: 'Tighten env-based auth checks',
      status: 'active',
      goals: [],
      non_goals: [],
      constraints: [],
      acceptance_criteria: [],
      affected_areas: ['auth'],
      module_ids: ['auth'],
      related_decision_ids: [],
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-01T00:00:00.000Z',
    }],
    changeExists: () => false,
    ensureChangesDir: () => '',
    generateChangeId: () => '',
    sanitizeChangeId: () => '',
    getChangePath: () => '',
    appendDecision: () => {},
    readDecisions: () => [{
      id: 'd1',
      title: 'Auth boundary',
      decision: 'Keep proxy auth checks',
      rationale: 'Needed for environment parity',
      alternatives_considered: [],
      scope: 'module',
      module_ids: ['auth'],
      created_at: '2026-04-01T00:00:00.000Z',
    }],
    appendNote: () => {},
    readNotes: () => [{
      id: 'n1',
      time: '2026-04-01T00:00:00.000Z',
      tags: ['unknown'],
      note: 'Auth bug only appears behind proxy',
      module_ids: ['auth'],
    }],
    generateNoteId: () => '',
    appendProgress: () => {},
    readProgress: () => [{
      id: 'p1',
      date: '2026-04-01T00:00:00.000Z',
      summary: 'Investigated auth path',
      module_ids: ['auth'],
      confidence: 'mid',
    }],
    readMilestones: () => [],
    writeMilestones: () => {},
    updateMilestone: () => {},
    upsertInferredMilestones: () => [],
    readNextActions: () => [],
    writeNextActions: () => {},
    readModules: () => [{
      id: 'auth',
      name: 'auth',
      summary: 'Authentication and authorization flow',
      aliases: ['login'],
      key_paths: ['src/auth'],
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-01T00:00:00.000Z',
      last_used_at: '2026-04-02T00:00:00.000Z',
    }],
    writeModules: () => {},
    upsertModules: () => [],
    getRepoRootPath: () => '',
    atomicWriteFile: () => {},
    fileExists: () => false,
    isFile: () => false,
    readTextFile: () => '',
  };
}

function createGitStub(): GitPort {
  return {
    isGitRepo: () => true,
    getRepoRoot: () => '',
    gitExec: () => '',
    parseLog: () => [{
      hash: 'a1',
      author: 'dev',
      time: '2026-04-01T00:00:00.000Z',
      message: 'fix auth bug',
      tag: 'fix',
      files: ['src/auth/check.ts'],
    }],
    parseLogSinceDays: () => [],
    calculateHotPaths: () => [{ path: 'src/auth', change_count: 3 }],
  };
}

describe('module queries', () => {
  it('lists modules with aggregated counts', async () => {
    const result = await listModules({ repo_path: '.' }, createStorageStub());
    expect(result.modules[0]).toMatchObject({
      id: 'auth',
      related_changes: 1,
      decision_count: 1,
      note_count: 1,
      progress_count: 1,
    });
  });

  it('returns detailed context for a module', async () => {
    const result = await moduleContext({ repo_path: '.', module_id: 'auth' }, createStorageStub(), createGitStub());
    expect(result.module.id).toBe('auth');
    expect(result.related_changes).toHaveLength(1);
    expect(result.code_evidence.hot_paths[0]?.path).toBe('src/auth');
  });
});
