import * as path from 'path';
import { getRepoRoot, isGitRepo } from '../git/gitExec.js';

export function getRepoRootPath(cwd?: string): string {
  const basePath = cwd ? path.resolve(cwd) : process.cwd();

  if (isGitRepo(basePath)) {
    return getRepoRoot(basePath);
  }

  return basePath;
}
