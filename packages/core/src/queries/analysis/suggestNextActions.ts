import type { GitPort } from '../../ports/git.js';
import type { StoragePort } from '../../ports/storage.js';
import { inferMilestoneSignals, recommendNextActions, type ActionRecommendation } from '../../understanding/index.js';
import { mergeInferredMilestones } from './inferredMilestones.js';

export interface SuggestNextActionsInput {
  limit?: number;
  filter_by_milestone?: string;
  repo_path: string;
  recent_commits?: number;
}

export interface SuggestNextActionsOutput {
  next_actions: ActionRecommendation['next_actions'];
  reasoning_summary: string;
}

export async function suggestNextActionsTool(input: SuggestNextActionsInput, storage: StoragePort, git: GitPort): Promise<SuggestNextActionsOutput> {
  const cwd = input.repo_path;
  const limit = input.limit || 5;
  const recentCommitsCount = input.recent_commits || 50;

  const persistedMilestones = storage.readMilestones(cwd);
  const progress = storage.readProgress(cwd);
  const decisions = storage.readDecisions(cwd);
  const commits = git.parseLog(recentCommitsCount, cwd);
  const hotPaths = git.calculateHotPaths(commits);
  const inferredSignals = inferMilestoneSignals(commits, hotPaths);
  const milestones = mergeInferredMilestones(persistedMilestones, inferredSignals);

  const recommendations = recommendNextActions(milestones, commits, hotPaths, progress, decisions);
  const filteredActions = input.filter_by_milestone
    ? recommendations.next_actions.filter(action => action.related_milestone === input.filter_by_milestone)
    : recommendations.next_actions;

  return {
    next_actions: filteredActions.slice(0, limit),
    reasoning_summary: recommendations.reasoning_summary,
  };
}
