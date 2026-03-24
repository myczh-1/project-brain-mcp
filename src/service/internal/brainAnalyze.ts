import { readManifest } from '../../core/storage/manifest.js';
import { parseLog, Commit } from '../../core/git/parseLog.js';
import { calculateHotPaths, HotPath } from '../../core/git/hotPaths.js';
import { inferFocus, inferMilestoneSignals } from '../../core/understanding/inferFocus.js';
import { readProgress } from '../../core/storage/progress.js';
import { readDecisions } from '../../core/storage/decisions.js';
import { readMilestones, upsertInferredMilestones } from '../../core/storage/milestones.js';
import {
  estimateAllMilestones,
  estimateProgressSummary,
  progressSummaryToOverallEstimation,
  ProgressEstimation,
} from '../../core/understanding/estimateProgress.js';
import { NextAction } from '../../core/storage/nextActions.js';
import { recommendNextActions } from '../../core/understanding/recommendActions.js';

export interface BrainAnalyzeInput {
  repo_path?: string;
  depth?: 'quick' | 'full';  // quick: summary only, full: detailed analysis with reasoning
  recent_commits?: number;    // Number of commits to analyze (default: 50)
}

export interface BrainAnalyzeOutput {
  summary: string;
  project_name: string;
  goals: string[];
  current_focus: {
    area: string;
    confidence: string;
  };
  progress: {
    overall_percentage: number;
    overall_confidence: string;
    completion_range: string;
    momentum_score: number;
    staleness_risk: string;
    milestones?: ProgressEstimation[];
  };
  recent_activity: {
    commits: Commit[];
    hot_paths: HotPath[];
    activity_summary: string;
  };
  suggested_actions: NextAction[];
  confidence: string;
}

export async function brainAnalyze(input: BrainAnalyzeInput): Promise<BrainAnalyzeOutput> {
  const cwd = input.repo_path || process.cwd();
  const depth = input.depth || 'full';
  const recentCommitsCount = input.recent_commits || 50;

  // Load manifest
  const manifest = readManifest(cwd);
  if (!manifest) {
    throw new Error('Project not initialized. Please run brain_init first.');
  }

  // Load git activity
  const commits = parseLog(recentCommitsCount, cwd);
  const hotPaths = calculateHotPaths(commits, cwd);
  
  // Infer current focus
  const focus = inferFocus(commits, hotPaths);
  
  // Infer and update milestones
  const milestoneSignals = inferMilestoneSignals(commits, hotPaths);
  let milestones = readMilestones(cwd);
  if (milestoneSignals.length > 0) {
    milestones = upsertInferredMilestones(milestoneSignals, cwd);
  }

  // Estimate progress
  const milestoneEstimations = milestones.length > 0
    ? estimateAllMilestones(milestones, commits, hotPaths)
    : [];
  const progressSummary = estimateProgressSummary(milestones, milestoneEstimations, commits, hotPaths);
  const overall = progressSummaryToOverallEstimation(progressSummary);

  // Generate next action recommendations
  const progress = readProgress(cwd);
  const decisions = readDecisions(cwd);
  const recommendations = recommendNextActions(
    milestones,
    commits,
    hotPaths,
    progress,
    decisions,
    milestoneEstimations.length > 0 ? [overall, ...milestoneEstimations] : [overall]
  );

  // Build activity summary
  const tagCounts = new Map<string, number>();
  for (const commit of commits) {
    tagCounts.set(commit.tag, (tagCounts.get(commit.tag) || 0) + 1);
  }
  const tagSummary = Array.from(tagCounts.entries())
    .map(([tag, count]) => `${count} ${tag}`)
    .join(', ');
  const activitySummary = `${commits.length} commits: ${tagSummary}`;

  // Build summary text
  const summaryParts = [
    `Project: ${manifest.project_name}`,
    `Progress: ${overall.percentage}% (${overall.confidence} confidence)`,
    `Focus: ${focus?.focus || 'Unknown'}`,
    `Momentum: ${progressSummary.momentum_score}`,
    `Top priority: ${recommendations.next_actions[0]?.title || 'No actions suggested'}`,
  ];

  return {
    summary: summaryParts.join(' | '),
    project_name: manifest.project_name,
    goals: manifest.long_term_goal ? [manifest.long_term_goal] : [],
    current_focus: {
      area: focus?.focus || 'Unknown',
      confidence: focus?.confidence || 'low',
    },
    progress: {
      overall_percentage: overall.percentage,
      overall_confidence: overall.confidence,
      completion_range: progressSummary.completion_estimate.range,
      momentum_score: progressSummary.momentum_score,
      staleness_risk: progressSummary.staleness_risk,
      milestones: depth === 'full' ? milestoneEstimations : undefined,
    },
    recent_activity: {
      commits: depth === 'quick' ? commits.slice(0, 5) : commits.slice(0, 10),
      hot_paths: hotPaths.slice(0, 5),
      activity_summary: activitySummary,
    },
    suggested_actions: recommendations.next_actions.slice(0, 5),
    confidence: overall.confidence,
  };
}
