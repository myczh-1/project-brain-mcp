import { calculateHotPaths, parseLog } from '@myczh/project-brain/core-protocol/git';
import { readDecisions, readMilestones, readProgress, upsertInferredMilestones } from '@myczh/project-brain/core-protocol/storage';
import { inferMilestoneSignals, recommendNextActions, type ActionRecommendation } from '@myczh/project-brain/core-protocol/understanding';

export interface SuggestNextActionsInput {
  limit?: number;
  filter_by_milestone?: string;
  repo_path?: string;
  recent_commits?: number;
}

export interface SuggestNextActionsOutput {
  next_actions: ActionRecommendation['next_actions'];
  reasoning_summary: string;
}

export async function suggestNextActionsTool(input: SuggestNextActionsInput): Promise<SuggestNextActionsOutput> {
  const cwd = input.repo_path || process.cwd();
  const limit = input.limit || 5;
  const recentCommitsCount = input.recent_commits || 50;

  let milestones = readMilestones(cwd);
  const progress = readProgress(cwd);
  const decisions = readDecisions(cwd);
  const commits = parseLog(recentCommitsCount, cwd);
  const hotPaths = calculateHotPaths(commits);
  const inferredSignals = inferMilestoneSignals(commits, hotPaths);

  if (inferredSignals.length > 0) {
    milestones = upsertInferredMilestones(inferredSignals, cwd);
  }

  const recommendations = recommendNextActions(milestones, commits, hotPaths, progress, decisions);
  const filteredActions = input.filter_by_milestone
    ? recommendations.next_actions.filter(action => action.related_milestone === input.filter_by_milestone)
    : recommendations.next_actions;

  return {
    next_actions: filteredActions.slice(0, limit),
    reasoning_summary: recommendations.reasoning_summary,
  };
}
