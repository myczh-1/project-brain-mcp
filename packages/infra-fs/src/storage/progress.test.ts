import * as fs from 'fs';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupTempRepoRoot, createTempRepoRoot } from '../test/testRepo.js';
import { getProgressPath, readProgress } from './progress.js';

const repoRoots: string[] = [];

afterEach(() => {
  for (const repoRoot of repoRoots.splice(0)) {
    cleanupTempRepoRoot(repoRoot);
  }
});

describe('progress storage', () => {
  it('migrates legacy progress.json into ndjson and backs up the source file', () => {
    const repoRoot = createTempRepoRoot('project-brain-progress-');
    repoRoots.push(repoRoot);

    const brainDir = path.join(repoRoot, '.project-brain');
    fs.mkdirSync(brainDir, { recursive: true });
    const legacyPath = path.join(brainDir, 'progress.json');
    fs.writeFileSync(
      legacyPath,
      JSON.stringify([
        {
          date: '2026-03-01T00:00:00.000Z',
          summary: 'Imported from legacy format',
          confidence: 'mid',
        },
      ]),
      'utf-8'
    );

    expect(readProgress(repoRoot)).toEqual([
      {
        id: 'legacy-progress-1',
        date: '2026-03-01T00:00:00.000Z',
        summary: 'Imported from legacy format',
        module_ids: [],
        confidence: 'mid',
      },
    ]);

    expect(fs.existsSync(getProgressPath(repoRoot))).toBe(true);
    expect(fs.existsSync(`${legacyPath}.bak`)).toBe(true);
    expect(fs.existsSync(legacyPath)).toBe(false);
  });
});
