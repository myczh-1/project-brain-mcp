import * as path from 'path';
import { brainAnalyze } from '../internal/brainAnalyze.js';
import { projectContext } from '../context/getProjectContext.js';
import { projectRecentActivity } from '../internal/recentActivity.js';
import { suggestNextActionsTool } from '../internal/suggestNextActions.js';
import { getRepoRootPath } from '../../core/storage/repoRoot.js';
import { Manifest, readManifest } from '../../core/storage/manifest.js';
import { readProjectSpec } from '../../core/storage/projectSpec.js';
import { readNotes } from '../../core/storage/notes.js';
import { Decision, readDecisions } from '../../core/storage/decisions.js';
import { ProgressEntry, readProgress } from '../../core/storage/progress.js';
import { Milestone, readMilestones } from '../../core/storage/milestones.js';
import { DashboardData, DashboardMemoryListSection } from './types.js';

export interface BuildDashboardInput {
  repo_path?: string;
  include_deep_analysis?: boolean;
  recent_commits?: number;
}

const MEMORY_PREVIEW_COUNT = 5;

function buildMemorySection<T>(
  title: string,
  items: T[],
  summary: string,
  emptyMessage: string
): DashboardMemoryListSection<T> {
  const visible = items.slice(-MEMORY_PREVIEW_COUNT).reverse();

  return {
    title,
    summary,
    total_count: items.length,
    visible_count: visible.length,
    items: visible,
    empty_message: items.length === 0 ? emptyMessage : undefined,
  };
}

function computeStalenessRisk(lastActiveAt: string | null): string {
  if (!lastActiveAt) return 'unknown';

  const hoursSinceLastCommit =
    (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastCommit < 24) return 'low';
  if (hoursSinceLastCommit < 24 * 3) return 'mid';
  return 'high';
}

function summarizeNotes(count: number): string {
  if (count === 0) return 'No notes captured yet.';
  return `${count} note${count === 1 ? '' : 's'} captured.`;
}

function summarizeProgress(entries: ProgressEntry[]): string {
  if (entries.length === 0) return 'No explicit progress entries recorded yet.';

  const blockedCount = entries.filter((entry) => entry.status === 'blocked').length;
  if (blockedCount > 0) {
    return `${entries.length} progress updates recorded, ${blockedCount} currently blocked.`;
  }

  return `${entries.length} progress update${entries.length === 1 ? '' : 's'} recorded.`;
}

function summarizeDecisions(count: number): string {
  if (count === 0) return 'No decisions recorded yet.';
  return `${count} decision${count === 1 ? '' : 's'} stored.`;
}

function summarizeMilestones(total: number, completed: number): string {
  if (total === 0) return 'No milestones inferred or recorded yet.';
  return `${completed}/${total} milestone${total === 1 ? '' : 's'} completed.`;
}

function toGoals(manifest: Manifest): string[] {
  if (!manifest.long_term_goal) return [];

  return manifest.long_term_goal
    .split(';')
    .map((goal) => goal.trim())
    .filter(Boolean);
}

function normalizeDecisions(decisions: Decision[]): Decision[] {
  return decisions.map((decision) => ({
    ...decision,
    rationale: decision.rationale || '',
  }));
}

export async function buildDashboardData(
  input: BuildDashboardInput
): Promise<DashboardData> {
  const cwd = input.repo_path || process.cwd();
  const repoRoot = getRepoRootPath(cwd);
  const repoPath = path.resolve(repoRoot);
  const includeDeepAnalysis = input.include_deep_analysis !== false;
  const recentCommits = input.recent_commits || 50;
  const generatedAt = new Date().toISOString();

  const manifest = readManifest(repoPath);

  if (!manifest) {
    return {
      overview: {
        project_name: path.basename(repoPath),
        summary: 'Project Brain has not been initialized for this repository yet.',
        goals: [],
        current_focus: {
          area: 'Unknown',
          confidence: 'low',
        },
        overall_progress: null,
        confidence: 'low',
      },
      activity: {
        summary: 'Project Brain needs `brain_init` before it can build a full dashboard.',
        recent_commits: [],
        hot_paths: [],
        last_active_at: null,
        staleness_risk: 'unknown',
      },
      memory: {
        long_term: {
          manifest: null,
          project_spec: null,
        },
        progress_memory: buildMemorySection(
          'Progress Memory',
          [],
          'No explicit progress entries recorded yet.',
          'Run `brain_record_progress` to start tracking progress.'
        ),
        decision_memory: buildMemorySection(
          'Decision Memory',
          [],
          'No decisions recorded yet.',
          'Run `brain_log_decision` or `brain_ingest_memory` to store decisions.'
        ),
        milestone_memory: buildMemorySection(
          'Milestone Memory',
          [],
          'No milestones inferred or recorded yet.',
          'Milestones appear after analysis or explicit milestone recording.'
        ),
        note_memory: buildMemorySection(
          'Note Memory',
          [],
          'No notes captured yet.',
          'Run `brain_capture_note` to store project notes.'
        ),
      },
      next_actions: [],
      meta: {
        generated_at: generatedAt,
        repo_path: repoPath,
        is_initialized: false,
        include_deep_analysis: includeDeepAnalysis,
        degradation_notice:
          'This dashboard is available as structured text everywhere and renders as an app UI only in hosts that support MCP Apps.',
      },
    };
  }

  const projectSpec = readProjectSpec(repoPath);
  const progressEntries = readProgress(repoPath);
  const decisions = normalizeDecisions(readDecisions(repoPath));
  const milestones = readMilestones(repoPath);
  const notes = readNotes(repoPath);

  const analysis = includeDeepAnalysis
    ? await brainAnalyze({
        repo_path: repoPath,
        depth: 'full',
        recent_commits: recentCommits,
      })
    : null;

  const context = includeDeepAnalysis
    ? null
    : await projectContext({
        repo_path: repoPath,
      });

  const recentActivity = includeDeepAnalysis
    ? null
    : await projectRecentActivity({
        repo_path: repoPath,
        limit: Math.min(recentCommits, 10),
      });

  const suggestedActions = await suggestNextActionsTool({
    repo_path: repoPath,
    limit: 5,
    recent_commits: recentCommits,
  });

  const milestoneList: Milestone[] = analysis?.progress.milestones
    ? milestones.map((milestone) => {
        const estimation = analysis.progress.milestones?.find(
          (entry) => entry.milestone_name === milestone.name
        );

        if (!estimation) {
          return milestone;
        }

        return {
          ...milestone,
          progress_percentage: estimation.percentage,
          progress_explanation: estimation.explanation,
        };
      })
    : milestones;

  const recentCommitsList =
    analysis?.recent_activity.commits ?? recentActivity?.commits ?? [];
  const hotPaths = analysis?.recent_activity.hot_paths ?? recentActivity?.hot_paths ?? [];
  const lastActiveAt = recentCommitsList[0]?.time ?? context?.code_evidence.last_commit?.time ?? null;
  const completedMilestones = milestoneList.filter(
    (milestone) => milestone.status === 'completed'
  ).length;

  return {
    overview: {
      project_name: manifest.project_name,
      summary: manifest.summary,
      goals: analysis?.goals ?? toGoals(manifest),
      current_focus: analysis?.current_focus ?? {
        area: context?.code_evidence.last_commit?.message || 'Recent code activity',
        confidence: context?.should_run_deep_analysis ? 'mid' : 'low',
      },
      overall_progress: analysis?.progress.overall_percentage ?? null,
      confidence: analysis?.confidence ?? 'mid',
    },
    activity: {
      summary: analysis?.recent_activity.activity_summary ?? recentActivity?.summary ?? 'No recent activity available.',
      recent_commits: recentCommitsList,
      hot_paths: hotPaths,
      last_active_at: lastActiveAt,
      staleness_risk: analysis?.progress.staleness_risk ?? computeStalenessRisk(lastActiveAt),
    },
    memory: {
      long_term: {
        manifest,
        project_spec: projectSpec,
      },
      progress_memory: buildMemorySection(
        'Progress Memory',
        progressEntries,
        summarizeProgress(progressEntries),
        'No explicit progress entries recorded yet.'
      ),
      decision_memory: buildMemorySection(
        'Decision Memory',
        decisions,
        summarizeDecisions(decisions.length),
        'No decisions recorded yet.'
      ),
      milestone_memory: buildMemorySection(
        'Milestone Memory',
        milestoneList,
        summarizeMilestones(milestoneList.length, completedMilestones),
        'No milestones inferred or recorded yet.'
      ),
      note_memory: buildMemorySection(
        'Note Memory',
        notes,
        summarizeNotes(notes.length),
        'No notes captured yet.'
      ),
    },
    next_actions: suggestedActions.next_actions,
    meta: {
      generated_at: generatedAt,
      repo_path: repoPath,
      is_initialized: true,
      include_deep_analysis: includeDeepAnalysis,
      degradation_notice:
        'The dashboard renders inline only in hosts that support MCP Apps. Other hosts still receive the same structured data and text summary.',
    },
  };
}

export function buildDashboardSummary(data: DashboardData): string {
  const progressText =
    data.overview.overall_progress === null
      ? 'Progress: unknown'
      : `Progress: ${data.overview.overall_progress}%`;

  const goalsText =
    data.overview.goals.length > 0
      ? `Goals: ${data.overview.goals.slice(0, 3).join('; ')}`
      : 'Goals: not initialized';

  const focusText = `Focus: ${data.overview.current_focus.area}`;
  const actionText =
    data.next_actions[0]?.title
      ? `Top next action: ${data.next_actions[0].title}`
      : 'Top next action: none suggested';

  return [
    `${data.overview.project_name} dashboard`,
    progressText,
    focusText,
    goalsText,
    actionText,
  ].join(' | ');
}

