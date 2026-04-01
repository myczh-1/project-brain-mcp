import * as path from 'path';
import {
  getRepoRootPath,
  readDecisions,
  readManifest,
  readMilestones,
  readNotes,
  readProgress,
  readProjectSpec,
  type Decision,
  type Manifest,
  type Milestone,
  type ProgressEntry,
} from '@myczh/project-brain/core-protocol/storage';
import { brainAnalyze } from '../analysis/brainAnalyze.js';
import { projectRecentActivity } from '../analysis/recentActivity.js';
import { suggestNextActionsTool } from '../analysis/suggestNextActions.js';
import { projectContext } from '../context/getProjectContext.js';
import type { DashboardData, DashboardMemoryListSection } from './types.js';

export interface BuildDashboardInput {
  repo_path?: string;
  include_deep_analysis?: boolean;
  recent_commits?: number;
}

const MEMORY_PREVIEW_COUNT = 5;

function buildMemorySection<T>(title: string, items: T[], summary: string, emptyMessage: string): DashboardMemoryListSection<T> {
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
  const hoursSinceLastCommit = (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastCommit < 24) return 'low';
  if (hoursSinceLastCommit < 24 * 3) return 'mid';
  return 'high';
}

function summarizeNotes(count: number): string {
  return count === 0 ? 'No notes captured yet.' : `${count} note${count === 1 ? '' : 's'} captured.`;
}

function summarizeProgress(entries: ProgressEntry[]): string {
  if (entries.length === 0) return 'No explicit progress entries recorded yet.';
  const blockedCount = entries.filter(entry => entry.status === 'blocked').length;
  if (blockedCount > 0) return `${entries.length} progress updates recorded, ${blockedCount} currently blocked.`;
  return `${entries.length} progress update${entries.length === 1 ? '' : 's'} recorded.`;
}

function summarizeDecisions(count: number): string {
  return count === 0 ? 'No decisions recorded yet.' : `${count} decision${count === 1 ? '' : 's'} stored.`;
}

function summarizeMilestones(total: number, completed: number): string {
  return total === 0 ? 'No milestones inferred or recorded yet.' : `${completed}/${total} milestone${total === 1 ? '' : 's'} completed.`;
}

function toGoals(manifest: Manifest): string[] {
  return manifest.long_term_goal ? manifest.long_term_goal.split(';').map(goal => goal.trim()).filter(Boolean) : [];
}

function normalizeDecisions(decisions: Decision[]): Decision[] {
  return decisions.map(decision => ({ ...decision, rationale: decision.rationale || '' }));
}

export async function buildDashboardData(input: BuildDashboardInput): Promise<DashboardData> {
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
        current_focus: { area: 'Unknown', confidence: 'low' },
        overall_completion: null,
        confidence: 'low',
      },
      activity: {
        summary: 'Project Brain can start recording memory without `brain_init`, but the identity anchor is still empty.',
        recent_commits: [],
        hot_paths: [],
        last_active_at: null,
        staleness_risk: 'unknown',
      },
      memory: {
        long_term: { manifest: null, project_spec: null },
        progress_memory: buildMemorySection('Progress Memory', [], 'No explicit progress entries recorded yet.', 'Record progress or ingest a progress memory entry to start tracking execution.'),
        decision_memory: buildMemorySection('Decision Memory', [], 'No decisions recorded yet.', 'Ingest a decision record to start preserving rationale.'),
        milestone_memory: buildMemorySection('Milestone Memory', [], 'No milestones inferred or recorded yet.', 'Milestones appear after analysis or explicit milestone recording.'),
        note_memory: buildMemorySection('Note Memory', [], 'No notes captured yet.', 'Ingest a note record to store raw observations.'),
      },
      next_actions: [],
      meta: {
        generated_at: generatedAt,
        repo_path: repoPath,
        is_initialized: false,
        include_deep_analysis: includeDeepAnalysis,
        degradation_notice: 'This dashboard is available as structured text and can be rendered by any HTTP client or custom web UI.',
      },
    };
  }

  const projectSpec = readProjectSpec(repoPath);
  const progressEntries = readProgress(repoPath);
  const decisions = normalizeDecisions(readDecisions(repoPath));
  const milestones = readMilestones(repoPath);
  const notes = readNotes(repoPath);

  const analysis = includeDeepAnalysis ? await brainAnalyze({ repo_path: repoPath, depth: 'full', recent_commits: recentCommits }) : null;
  const context = includeDeepAnalysis ? null : await projectContext({ repo_path: repoPath });
  const recentActivity = includeDeepAnalysis ? null : await projectRecentActivity({ repo_path: repoPath, limit: Math.min(recentCommits, 10) });
  const suggestedActions = await suggestNextActionsTool({ repo_path: repoPath, limit: 5, recent_commits: recentCommits });

  const milestoneList: Milestone[] = analysis?.progress.milestones ?? milestones;
  const recentCommitsList = analysis?.recent_activity.commits ?? recentActivity?.commits ?? [];
  const hotPaths = analysis?.recent_activity.hot_paths ?? recentActivity?.hot_paths ?? [];
  const lastActiveAt = recentCommitsList[0]?.time ?? context?.code_evidence.last_commit?.time ?? null;
  const completedMilestones = milestoneList.filter(milestone => milestone.status === 'completed').length;

  return {
    overview: {
      project_name: manifest.project_name,
      summary: manifest.summary,
      goals: analysis?.goals ?? toGoals(manifest),
      current_focus: analysis?.current_focus ?? {
        area: context?.code_evidence.last_commit?.message || 'Recent code activity',
        confidence: context?.should_run_deep_analysis ? 'mid' : 'low',
      },
      overall_completion: analysis?.progress.overall_completion ?? null,
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
      long_term: { manifest, project_spec: projectSpec },
      progress_memory: buildMemorySection('Progress Memory', progressEntries, summarizeProgress(progressEntries), 'No explicit progress entries recorded yet.'),
      decision_memory: buildMemorySection('Decision Memory', decisions, summarizeDecisions(decisions.length), 'No decisions recorded yet.'),
      milestone_memory: buildMemorySection('Milestone Memory', milestoneList, summarizeMilestones(milestoneList.length, completedMilestones), 'No milestones inferred or recorded yet.'),
      note_memory: buildMemorySection('Note Memory', notes, summarizeNotes(notes.length), 'No notes captured yet.'),
    },
    next_actions: suggestedActions.next_actions,
    meta: {
      generated_at: generatedAt,
      repo_path: repoPath,
      is_initialized: true,
      include_deep_analysis: includeDeepAnalysis,
      degradation_notice: 'The dashboard response is portable across HTTP clients and custom web UI consumers.',
    },
  };
}

export function buildDashboardSummary(data: DashboardData): string {
  const progressText = data.overview.overall_completion === null ? 'Progress: unknown' : `Progress: ${data.overview.overall_completion}`;
  const goalsText = data.overview.goals.length > 0 ? `Goals: ${data.overview.goals.slice(0, 3).join('; ')}` : 'Goals: not initialized';
  const focusText = `Focus: ${data.overview.current_focus.area}`;
  const actionText = data.next_actions[0]?.title ? `Top next action: ${data.next_actions[0].title}` : 'Top next action: none suggested';
  return [`${data.overview.project_name} dashboard`, progressText, focusText, goalsText, actionText].join(' | ');
}
