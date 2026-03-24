import { readMilestones, upsertInferredMilestones } from '../../core/storage/milestones.js';
import { readProgress } from '../../core/storage/progress.js';
import { readDecisions } from '../../core/storage/decisions.js';
import { parseLog } from '../../core/git/parseLog.js';
import { calculateHotPaths } from '../../core/git/hotPaths.js';
import { recommendNextActions, ActionRecommendation } from '../../core/understanding/recommendActions.js';
import { estimateAllMilestones } from '../../core/understanding/estimateProgress.js';
import { inferMilestoneSignals } from '../../core/understanding/inferFocus.js';

export interface SuggestNextActionsInput {
  limit?: number;                    // Number of actions to return (default: 5)
  filter_by_milestone?: string;      // Optional: filter by milestone name
  repo_path?: string;
  recent_commits?: number;           // Number of commits to analyze (default: 50)
}

export interface SuggestNextActionsOutput {
  next_actions: ActionRecommendation['next_actions'];
  reasoning_summary: string;
}

export async function suggestNextActionsTool(
  input: SuggestNextActionsInput
): Promise<SuggestNextActionsOutput> {
  const cwd = input.repo_path || process.cwd();
  const limit = input.limit || 5;
  const recentCommitsCount = input.recent_commits || 50;

  // Load data
  let milestones = readMilestones(cwd);
  const progress = readProgress(cwd);
  const decisions = readDecisions(cwd);
  const commits = parseLog(recentCommitsCount, cwd);
  const hotPaths = calculateHotPaths(commits, cwd);
  const inferredSignals = inferMilestoneSignals(commits, hotPaths);

  if (inferredSignals.length > 0) {
    milestones = upsertInferredMilestones(inferredSignals, cwd);
  }

  // Estimate milestone progress for better recommendations
  const milestoneProgress = milestones.length > 0 
    ? estimateAllMilestones(milestones, commits, hotPaths)
    : undefined;

  // Generate recommendations
  const recommendations = recommendNextActions(
    milestones,
    commits,
    hotPaths,
    progress,
    decisions,
    milestoneProgress
  );

  // Filter by milestone if specified
  let filteredActions = recommendations.next_actions;
  if (input.filter_by_milestone) {
    filteredActions = filteredActions.filter(
      action => action.related_milestone === input.filter_by_milestone
    );
  }

  // Apply limit
  const limitedActions = filteredActions.slice(0, limit);

  return {
    next_actions: limitedActions,
    reasoning_summary: recommendations.reasoning_summary
  };
}
