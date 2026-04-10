import { describe, expect, it } from 'vitest';
import type { GitPort } from '../../ports/git.js';
import type { StoragePort } from '../../ports/storage.js';
import { changeContext } from './getChangeContext.js';

function createBaseStorageStub(): StoragePort {
  return {
    getRepoRootPath: () => '/repo',
    readManifest: () => ({
      project_name: 'demo',
      summary: 'demo',
      repo_type: 'application',
      primary_stack: [],
      created_at: '',
      updated_at: '',
    }),
    buildFallbackManifest: () => ({
      project_name: 'demo',
      summary: 'demo',
      repo_type: 'application',
      primary_stack: [],
      created_at: '',
      updated_at: '',
    }),
    readProjectSpec: () => null,
    readChange: () => null,
    fileExists: () => false,
    isFile: () => false,
    readTextFile: () => '',
    readDecisions: () => [],
    readProgress: () => [],
    readNotes: () => [],
    readMilestones: () => [],
  } as unknown as StoragePort;
}

function createBaseGitStub(): GitPort {
  return {
    parseLog: () => [],
    calculateHotPaths: () => [],
  } as unknown as GitPort;
}

describe('changeContext', () => {
  it('does not fabricate timestamps for OpenSpec-backed changes', async () => {
    const storage = {
      ...createBaseStorageStub(),
      fileExists: (filePath: string) =>
        filePath === '/repo/openspec/changes/demo-change'
        || filePath === '/repo/openspec/changes/demo-change/proposal.md',
      isFile: () => false,
      readTextFile: () => '# Demo Change\n\nSimple summary\n\n## Goals\n- goal one\n',
    } as unknown as StoragePort;
    const git = createBaseGitStub();

    const result = await changeContext({ repo_path: '/repo', change_id: 'demo-change' }, storage, git);

    expect(result.change_contract.created_at).toBe('');
    expect(result.change_contract.updated_at).toBe('');
  });

  it('uses expanded evidence matching in investigation mode', async () => {
    const storage = {
      ...createBaseStorageStub(),
      readChange: () => ({
        id: 'change-1',
        title: 'Fix auth flow',
        summary: 'Investigate auth refresh path',
        status: 'active',
        goals: [],
        non_goals: [],
        constraints: [],
        acceptance_criteria: ['find issue'],
        affected_areas: ['auth'],
        module_ids: [],
        related_decision_ids: [],
        created_at: '',
        updated_at: '',
      }),
      readDecisions: () => [{
        id: 'decision-1',
        title: 'Legacy auth path',
        decision: 'Keep auth shim for compatibility',
        rationale: 'The auth bug still appears in refresh flow',
        alternatives_considered: [],
        scope: 'change',
        related_change_id: undefined,
        module_ids: [],
        created_at: '',
      }],
      readProgress: () => [{
        id: 'progress-1',
        date: '',
        summary: 'Investigated auth refresh flow',
        related_change_id: undefined,
        module_ids: [],
        confidence: 'mid',
      }],
      readNotes: () => [{
        id: 'note-1',
        time: '',
        tags: [],
        note: 'Auth issue reproduces during refresh flow',
        related_change_id: undefined,
        module_ids: [],
      }],
    } as unknown as StoragePort;
    const git = {
      ...createBaseGitStub(),
      parseLog: () => [{ hash: 'abc', author: 'dev', time: '', message: 'fix auth', tag: 'fix', files: ['src/auth.ts'] }],
      calculateHotPaths: () => [{ path: 'src/auth.ts', change_count: 1 }],
    } as unknown as GitPort;

    const result = await changeContext({
      repo_path: '/repo',
      change_id: 'change-1',
      retrieval_entrypoint: 'investigation',
      task: 'debug auth refresh flow',
    }, storage, git);

    expect(result.relevant_decisions).toHaveLength(1);
    expect(result.execution_state.progress).toHaveLength(1);
    expect(result.execution_state.notes).toHaveLength(1);
    expect(result.retrieval_meta.investigation_term_hints).toContain('auth');
  });
});
