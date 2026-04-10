import * as path from 'path';
import { getRepoRoot, isGitRepo } from '../git/gitExec.js';

const repoRootCache = new Map<string, string>();
const nonGitPathCache = new Set<string>();

export function getRepoRootPath(cwd?: string): string {
  const basePath = cwd ? path.resolve(cwd) : process.cwd();

  const cachedRepoRoot = repoRootCache.get(basePath);
  if (cachedRepoRoot) {
    return cachedRepoRoot;
  }

  if (nonGitPathCache.has(basePath)) {
    return basePath;
  }

  if (isGitRepo(basePath)) {
    const repoRoot = getRepoRoot(basePath);
    repoRootCache.set(basePath, repoRoot);
    return repoRoot;
  }

  nonGitPathCache.add(basePath);

  return basePath;
}
