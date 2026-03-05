import { gitExec } from './gitExec.js';
import { Commit } from './parseLog.js';

export interface HotPath {
  path: string;
  change_count: number;
}

function normalizePath(filePath: string): string {
  const parts = filePath.split('/');
  if (parts.length <= 2) return filePath;
  return parts.slice(0, 2).join('/');
}

export function calculateHotPaths(commits: Commit[], cwd?: string): HotPath[] {
  const pathCounts = new Map<string, number>();

  for (const commit of commits) {
    try {
      const filesOutput = gitExec(['show', '--name-only', '--pretty=format:', commit.hash], cwd);
      const files = filesOutput.split('\n').filter(f => f.trim());

      for (const file of files) {
        const normalized = normalizePath(file);
        pathCounts.set(normalized, (pathCounts.get(normalized) || 0) + 1);
      }
    } catch {
      continue;
    }
  }

  const hotPaths: HotPath[] = Array.from(pathCounts.entries())
    .map(([path, change_count]) => ({ path, change_count }))
    .sort((a, b) => b.change_count - a.change_count);

  return hotPaths;
}
