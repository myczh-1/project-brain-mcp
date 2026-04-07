import { describe, expect, it } from 'vitest';
import { contextBudgetPlan } from './getContextBudgetPlan.js';
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
    readAllChanges: () => [],
    changeExists: () => false,
    ensureChangesDir: () => '',
    generateChangeId: () => '',
    sanitizeChangeId: () => '',
    getChangePath: () => '',
    appendDecision: () => {},
    readDecisions: () => [],
    appendNote: () => {},
    readNotes: () => [],
    generateNoteId: () => '',
    appendProgress: () => {},
    readProgress: () => [],
    readMilestones: () => [],
    writeMilestones: () => {},
    updateMilestone: () => {},
    upsertInferredMilestones: () => [],
    readNextActions: () => [],
    writeNextActions: () => {},
    readModules: () => [],
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
    parseLog: () => [],
    parseLogSinceDays: () => [],
    calculateHotPaths: () => [],
  };
}

describe('contextBudgetPlan', () => {
  it('chooses investigation entrypoint for historical tasks', async () => {
    const result = await contextBudgetPlan(
      { repo_path: '.', task: '追查古早兼容回归问题' },
      createStorageStub(),
      createGitStub()
    );
    expect(result.entrypoint).toBe('investigation');
    expect(result.lightweight_workflow[1]?.action).toContain('cold memory');
  });

  it('keeps standard entrypoint for normal delivery tasks', async () => {
    const result = await contextBudgetPlan(
      { repo_path: '.', task: 'implement new feature endpoint' },
      createStorageStub(),
      createGitStub()
    );
    expect(result.entrypoint).toBe('standard');
    expect(result.lightweight_workflow[0]?.action).toContain('project overview');
  });
});
