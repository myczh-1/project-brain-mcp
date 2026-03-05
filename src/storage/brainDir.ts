import * as fs from 'fs';
import * as path from 'path';
import { getRepoRootPath } from './repoRoot.js';

const BRAIN_DIR = '.project-brain';

export function getBrainDir(cwd?: string): string {
  const repoRoot = getRepoRootPath(cwd);
  return path.join(repoRoot, BRAIN_DIR);
}

export function ensureBrainDir(cwd?: string): string {
  const brainDir = getBrainDir(cwd);
  if (!fs.existsSync(brainDir)) {
    fs.mkdirSync(brainDir, { recursive: true });
  }
  return brainDir;
}

export function brainDirExists(cwd?: string): boolean {
  const brainDir = getBrainDir(cwd);
  return fs.existsSync(brainDir);
}
