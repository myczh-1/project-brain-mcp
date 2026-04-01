import { calculateHotPaths, parseLog, type Commit, type HotPath } from '@myczh/project-brain/core-protocol/git';
import {
  buildFallbackManifest,
  readDecisions,
  readManifest,
  readMilestones,
  readProgress,
  upsertInferredMilestones,
  type Milestone,
  type NextAction,
} from '@myczh/project-brain/core-protocol/storage';
import {
  estimateProgressOverview,
  inferFocus,
  inferMilestoneSignals,
  recommendNextActions,
  type Completion,
  type Momentum,
  type StalenessRisk,
} from '@myczh/project-brain/core-protocol/understanding';

export interface BrainAnalyzeInput {
  repo_path?: string;
  depth?: 'quick' | 'full';
  recent_commits?: number;
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
    overall_completion: Completion;
    momentum: Momentum;
    staleness_risk: StalenessRisk;
    milestones?: Milestone[];
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

  const manifest = readManifest(cwd) || buildFallbackManifest(cwd);
  const commits = parseLog(recentCommitsCount, cwd);
  const hotPaths = calculateHotPaths(commits);
  const focus = inferFocus(commits, hotPaths);
  const milestoneSignals = inferMilestoneSignals(commits, hotPaths);

  let milestones = readMilestones(cwd);
  if (milestoneSignals.length > 0) {
    milestones = upsertInferredMilestones(milestoneSignals, cwd);
  }

  const progressOverview = estimateProgressOverview(milestones, commits);
  const progress = readProgress(cwd);
  const decisions = readDecisions(cwd);
  const recommendations = recommendNextActions(milestones, commits, hotPaths, progress, decisions);

  const tagCounts = new Map<string, number>();
  for (const commit of commits) {
    tagCounts.set(commit.tag, (tagCounts.get(commit.tag) || 0) + 1);
  }
  const tagSummary = Array.from(tagCounts.entries())
    .map(([tag, count]) => `${count} ${tag}`)
    .join(', ');

  return {
    summary: [
      `Project: ${manifest.project_name}`,
      `Progress: ${progressOverview.overall_completion} (${progressOverview.momentum})`,
      `Focus: ${focus?.focus || 'Unknown'}`,
      `Momentum: ${progressOverview.momentum}`,
      `Top priority: ${recommendations.next_actions[0]?.title || 'No actions suggested'}`,
    ].join(' | '),
    project_name: manifest.project_name,
    goals: manifest.long_term_goal ? [manifest.long_term_goal] : [],
    current_focus: {
      area: focus?.focus || 'Unknown',
      confidence: focus?.confidence || 'low',
    },
    progress: {
      overall_completion: progressOverview.overall_completion,
      momentum: progressOverview.momentum,
      staleness_risk: progressOverview.staleness_risk,
      milestones: depth === 'full' ? milestones : undefined,
    },
    recent_activity: {
      commits: depth === 'quick' ? commits.slice(0, 5) : commits.slice(0, 10),
      hot_paths: hotPaths.slice(0, 5),
      activity_summary: `${commits.length} commits: ${tagSummary}`,
    },
    suggested_actions: recommendations.next_actions.slice(0, 5),
    confidence: progressOverview.overall_completion,
  };
}
