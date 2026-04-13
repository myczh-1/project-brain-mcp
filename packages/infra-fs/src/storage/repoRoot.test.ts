import { execFileSync } from 'child_process';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupTempRepoRoot, createNestedDir, createTempDir, createTempRepoRoot } from '../test/testRepo.js';
import { clearRepoRootCache, getRepoRootPath } from './repoRoot.js';

const roots: string[] = [];

afterEach(() => {
  clearRepoRootCache();
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

  it('re-checks paths that were non-git previously instead of caching the fallback forever', () => {
    const root = createTempDir('project-brain-nongit-later-repo-');
    roots.push(root);
    const nestedDir = createNestedDir(root, 'scratch', 'notes');

    expect(getRepoRootPath(nestedDir)).toBe(path.resolve(nestedDir));

    execFileSync('git', ['init', '-q'], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });

    expect(getRepoRootPath(nestedDir)).toBe(root);
  });
});
