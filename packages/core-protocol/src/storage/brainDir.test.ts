import * as fs from 'fs';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupTempRepoRoot, createNestedDir, createTempDir, createTempRepoRoot } from '../test/testRepo.js';
import { brainDirExists, ensureBrainDir, getBrainDir } from './brainDir.js';

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    cleanupTempRepoRoot(root);
  }
});

describe('brainDir', () => {
  it('resolves the same .project-brain path from nested directories inside a git repo', () => {
    const repoRoot = createTempRepoRoot('project-brain-braindir-');
    roots.push(repoRoot);
    const nestedDir = createNestedDir(repoRoot, 'packages', 'context');

    expect(getBrainDir(repoRoot)).toBe(path.join(repoRoot, '.project-brain'));
    expect(getBrainDir(nestedDir)).toBe(path.join(repoRoot, '.project-brain'));
  });

  it('creates the .project-brain directory at the repo root', () => {
    const repoRoot = createTempRepoRoot('project-brain-braindir-');
    roots.push(repoRoot);
    const nestedDir = createNestedDir(repoRoot, 'packages', 'runtime');

    const brainDir = ensureBrainDir(nestedDir);

    expect(brainDir).toBe(path.join(repoRoot, '.project-brain'));
    expect(brainDirExists(repoRoot)).toBe(true);
    expect(fs.statSync(brainDir).isDirectory()).toBe(true);
  });

  it('uses the provided directory as the base path outside git repositories', () => {
    const root = createTempDir('project-brain-braindir-');
    roots.push(root);
    const nestedDir = createNestedDir(root, 'tmp', 'workspace');

    const brainDir = ensureBrainDir(nestedDir);

    expect(brainDir).toBe(path.join(nestedDir, '.project-brain'));
    expect(brainDirExists(nestedDir)).toBe(true);
  });
});
