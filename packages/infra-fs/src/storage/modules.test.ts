import { afterEach, describe, expect, it } from 'vitest';
import { cleanupTempRepoRoot, createTempRepoRoot } from '../test/testRepo.js';
import { readModules, upsertModules } from './modules.js';

const repoRoots: string[] = [];

afterEach(() => {
  for (const repoRoot of repoRoots.splice(0)) {
    cleanupTempRepoRoot(repoRoot);
  }
});

describe('module storage', () => {
  it('creates and reuses module records through upsert', () => {
    const repoRoot = createTempRepoRoot('project-brain-modules-');
    repoRoots.push(repoRoot);

    upsertModules(['Auth', 'gateway'], repoRoot);
    upsertModules(['auth'], repoRoot);

    const modules = readModules(repoRoot);
    expect(modules.map(module => module.id)).toEqual(['auth', 'gateway']);
    expect(modules[0]?.name).toBe('auth');
  });
});
