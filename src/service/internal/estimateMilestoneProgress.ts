import { readMilestones } from '../../core/storage/milestones.js';
import { parseLog } from '../../core/git/parseLog.js';
import { calculateHotPaths } from '../../core/git/hotPaths.js';
import {
  estimateAllMilestones,
  estimateProgressSummary,
  progressSummaryToOverallEstimation,
  ProgressEstimation,
  ProgressSummary,
} from '../../core/understanding/estimateProgress.js';
import { inferMilestoneSignals } from '../../core/understanding/inferFocus.js';
import { upsertInferredMilestones } from '../../core/storage/milestones.js';

export interface EstimateMilestoneProgressInput {
  milestone_name?: string;  // Optional: estimate specific milestone
  repo_path?: string;
  recent_commits?: number;  // Number of commits to analyze (default: 50)
}

export interface EstimateMilestoneProgressOutput {
  estimations: ProgressEstimation[];
  summary: ProgressSummary;
}

export async function estimateMilestoneProgressTool(
  input: EstimateMilestoneProgressInput
): Promise<EstimateMilestoneProgressOutput> {
  const cwd = input.repo_path || process.cwd();
  const recentCommitsCount = input.recent_commits || 50;

  // Load data
  const commits = parseLog(recentCommitsCount, cwd);
  const hotPaths = calculateHotPaths(commits, cwd);
  const inferredSignals = inferMilestoneSignals(commits, hotPaths);

  let milestones = readMilestones(cwd);
  if (inferredSignals.length > 0) {
    milestones = upsertInferredMilestones(inferredSignals, cwd);
  }

  const allMilestoneEstimations = milestones.length > 0
    ? estimateAllMilestones(milestones, commits, hotPaths)
    : [];
  const summary = estimateProgressSummary(milestones, allMilestoneEstimations, commits, hotPaths);
  const overall = progressSummaryToOverallEstimation(summary);

  let estimations: ProgressEstimation[] = [];
  if (input.milestone_name) {
    const selected = allMilestoneEstimations.filter(m => m.milestone_name === input.milestone_name);
    if (selected.length === 0) {
      throw new Error(`Milestone not found: ${input.milestone_name}`);
    }
    estimations = selected;
  } else if (allMilestoneEstimations.length > 0) {
    estimations = [overall, ...allMilestoneEstimations];
  } else {
    estimations = [overall];
  }

  return {
    estimations,
    summary,
  };
}
