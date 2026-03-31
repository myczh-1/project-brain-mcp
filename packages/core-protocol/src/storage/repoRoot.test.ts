import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupTempRepoRoot, createNestedDir, createTempDir, createTempRepoRoot } from '../test/testRepo.js';
import { getRepoRootPath } from './repoRoot.js';

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    cleanupTempRepoRoot(root);
  }
});

describe('getRepoRootPath', () => {
  it('returns the git root when called from a nested directory', () => {
    const repoRoot = createTempRepoRoot('project-brain-reporoot-');
    roots.push(repoRoot);
    const nestedDir = createNestedDir(repoRoot, 'packages', 'core-protocol', 'src');

    expect(getRepoRootPath(nestedDir)).toBe(repoRoot);
  });

  it('falls back to the provided directory when it is not a git repo', () => {
    const root = createTempDir('project-brain-nongit-');
    roots.push(root);
    const nestedDir = createNestedDir(root, 'scratch', 'notes');

    expect(getRepoRootPath(nestedDir)).toBe(path.resolve(nestedDir));
  });
});
