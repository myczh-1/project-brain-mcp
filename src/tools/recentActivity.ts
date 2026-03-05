import { parseLog, parseLogSinceDays, Commit } from '../git/parseLog.js';
import { calculateHotPaths, HotPath } from '../git/hotPaths.js';

export interface RecentActivityInput {
  limit?: number;
  since_days?: number;
  repo_path?: string;
}

export interface RecentActivityOutput {
  commits: Commit[];
  hot_paths: HotPath[];
  summary: string;
}

export async function projectRecentActivity(input: RecentActivityInput): Promise<RecentActivityOutput> {
  const cwd = input.repo_path || process.cwd();
  
  let commits: Commit[];
  
  if (input.since_days) {
    commits = parseLogSinceDays(input.since_days, cwd);
  } else {
    const limit = input.limit || 50;
    commits = parseLog(limit, cwd);
  }

  const hotPaths = calculateHotPaths(commits, cwd);

  const tagCounts = new Map<string, number>();
  for (const commit of commits) {
    tagCounts.set(commit.tag, (tagCounts.get(commit.tag) || 0) + 1);
  }

  const tagSummary = Array.from(tagCounts.entries())
    .map(([tag, count]) => `${count} ${tag}`)
    .join(', ');

  const summary = `${commits.length} commits: ${tagSummary}`;

  return {
    commits,
    hot_paths: hotPaths,
    summary,
  };
}
