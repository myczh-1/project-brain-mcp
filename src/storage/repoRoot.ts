import { getRepoRoot } from '../git/gitExec.js';

export function getRepoRootPath(cwd?: string): string {
  return getRepoRoot(cwd);
}
