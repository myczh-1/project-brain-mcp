import * as path from 'path';
import { getRepoRoot, isGitRepo } from '../git/gitExec.js';

const repoRootCache = new Map<string, string>();

export function clearRepoRootCache(): void {
  repoRootCache.clear();
}

export function getRepoRootPath(cwd?: string): string {
  const basePath = cwd ? path.resolve(cwd) : process.cwd();

  const cachedRepoRoot = repoRootCache.get(basePath);
  if (cachedRepoRoot) {
    return cachedRepoRoot;
  }

  if (isGitRepo(basePath)) {
    const repoRoot = getRepoRoot(basePath);
    repoRootCache.set(basePath, repoRoot);
    return repoRoot;
  }

  return basePath;
}
