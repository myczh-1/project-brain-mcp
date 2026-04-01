import { afterEach, describe, expect, it } from 'vitest';
import { readChange } from '@myczh/project-brain/core-protocol/storage';
import { cleanupTempRepoRoot, createTempRepoRoot } from '../../../core-protocol/src/test/testRepo.js';
import { createChange } from './createChange.js';

const repoRoots: string[] = [];

afterEach(() => {
  for (const repoRoot of repoRoots.splice(0)) {
    cleanupTempRepoRoot(repoRoot);
  }
});

describe('createChange', () => {
  it('normalizes string arrays and persists the change', async () => {
    const repoRoot = createTempRepoRoot('project-brain-change-');
    repoRoots.push(repoRoot);

    const result = await createChange({
      repo_path: repoRoot,
      change: {
        title: '  Add tests  ',
        summary: '  Cover critical storage behavior  ',
        goals: [' add tests ', ''],
        non_goals: ['  broad refactor  ', '   '],
        constraints: [' keep build stable '],
        acceptance_criteria: [' tests pass ', ''],
        affected_areas: [' package.json ', ' packages/application '],
        related_decision_ids: [' decision-1 ', ''],
        status: 'active',
      },
    });

    expect(result.status).toBe('ok');
    expect(result.change.title).toBe('Add tests');
    expect(result.change.summary).toBe('Cover critical storage behavior');
    expect(result.change.goals).toEqual(['add tests']);
    expect(result.change.non_goals).toEqual(['broad refactor']);
    expect(result.change.constraints).toEqual(['keep build stable']);
    expect(result.change.acceptance_criteria).toEqual(['tests pass']);
    expect(result.change.affected_areas).toEqual(['package.json', 'packages/application']);
    expect(result.change.related_decision_ids).toEqual(['decision-1']);
    expect(result.change.status).toBe('active');
    expect(result.change.id).toMatch(/^add-tests-/);
    expect(readChange(result.change.id, repoRoot)).toEqual(result.change);
  });
});
