import type { GitPort } from '../../ports/git.js';
import type { Manifest, StoragePort } from '../../ports/storage.js';
import { brainAnalyze } from '../analysis/brainAnalyze.js';
import { projectRecentActivity } from '../analysis/recentActivity.js';
import { suggestNextActionsTool } from '../analysis/suggestNextActions.js';
import { projectContext } from '../context/getProjectContext.js';
import type { DashboardData, DashboardMemoryListSection } from './types.js';
import type { Milestone, ProgressEntry, Decision } from '../../ports/storage.js';

export interface BuildDashboardInput {
  repo_path: string;
  include_deep_analysis?: boolean;
  recent_commits?: number;
}

interface DashboardMemorySources {
  projectSpec: ReturnType<StoragePort['readProjectSpec']>;
  progressEntries: ReturnType<StoragePort['readProgress']>;
  decisions: Decision[];
  milestones: ReturnType<StoragePort['readMilestones']>;
  notes: ReturnType<StoragePort['readNotes']>;
}

interface DashboardSignals {
  analysis: Awaited<ReturnType<typeof brainAnalyze>> | null;
  context: Awaited<ReturnType<typeof projectContext>> | null;
  recentActivity: Awaited<ReturnType<typeof projectRecentActivity>> | null;
  suggestedActions: Awaited<ReturnType<typeof suggestNextActionsTool>>;
}

interface NormalizedDashboardActivity {
  milestoneList: Milestone[];
  recentCommitsList: ReturnType<GitPort['parseLog']>;
  hotPaths: ReturnType<GitPort['calculateHotPaths']>;
  lastActiveAt: string | null;
  completedMilestones: number;
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

function buildUninitializedDashboard(repoPath: string, includeDeepAnalysis: boolean, generatedAt: string): DashboardData {
  return {
    overview: {
      project_name: repoPath.split('/').pop() || repoPath,
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

function readDashboardMemorySources(repoPath: string, storage: StoragePort): DashboardMemorySources {
  return {
    projectSpec: storage.readProjectSpec(repoPath),
    progressEntries: storage.readProgress(repoPath),
    decisions: normalizeDecisions(storage.readDecisions(repoPath)),
    milestones: storage.readMilestones(repoPath),
    notes: storage.readNotes(repoPath),
  };
}

async function readDashboardSignals(
  repoPath: string,
  includeDeepAnalysis: boolean,
  recentCommits: number,
  storage: StoragePort,
  git: GitPort
): Promise<DashboardSignals> {
  const analysis = includeDeepAnalysis
    ? await brainAnalyze({ repo_path: repoPath, depth: 'full', recent_commits: recentCommits }, storage, git)
    : null;
  const context = includeDeepAnalysis
    ? null
    : await projectContext({ repo_path: repoPath }, storage, git);
  const recentActivity = includeDeepAnalysis
    ? null
    : await projectRecentActivity({ repo_path: repoPath, limit: Math.min(recentCommits, 10) }, git);
  const suggestedActions = await suggestNextActionsTool({ repo_path: repoPath, limit: 5, recent_commits: recentCommits }, storage, git);

  return {
    analysis,
    context,
    recentActivity,
    suggestedActions,
  };
}

function normalizeDashboardActivity(
  memory: DashboardMemorySources,
  signals: DashboardSignals
): NormalizedDashboardActivity {
  const milestoneList = signals.analysis?.progress.milestones ?? memory.milestones;
  const recentCommitsList = signals.analysis?.recent_activity.commits ?? signals.recentActivity?.commits ?? [];
  const hotPaths = signals.analysis?.recent_activity.hot_paths ?? signals.recentActivity?.hot_paths ?? [];
  const lastActiveAt = recentCommitsList[0]?.time ?? signals.context?.code_evidence.last_commit?.time ?? null;
  const completedMilestones = milestoneList.filter(milestone => milestone.status === 'completed').length;

  return {
    milestoneList,
    recentCommitsList,
    hotPaths,
    lastActiveAt,
    completedMilestones,
  };
}

function buildDashboardOverview(
  manifest: Manifest,
  signals: DashboardSignals
): DashboardData['overview'] {
  return {
    project_name: manifest.project_name,
    summary: manifest.summary,
    goals: signals.analysis?.goals ?? toGoals(manifest),
    current_focus: signals.analysis?.current_focus ?? {
      area: signals.context?.code_evidence.last_commit?.message || 'Recent code activity',
      confidence: signals.context?.should_run_deep_analysis ? 'mid' : 'low',
    },
    overall_completion: signals.analysis?.progress.overall_completion ?? null,
    confidence: signals.analysis?.confidence ?? 'mid',
  };
}

function buildDashboardActivitySection(
  signals: DashboardSignals,
  normalizedActivity: NormalizedDashboardActivity
): DashboardData['activity'] {
  return {
    summary: signals.analysis?.recent_activity.activity_summary ?? signals.recentActivity?.summary ?? 'No recent activity available.',
    recent_commits: normalizedActivity.recentCommitsList,
    hot_paths: normalizedActivity.hotPaths,
    last_active_at: normalizedActivity.lastActiveAt,
    staleness_risk: signals.analysis?.progress.staleness_risk ?? computeStalenessRisk(normalizedActivity.lastActiveAt),
  };
}

function buildDashboardMemory(
  manifest: Manifest,
  memory: DashboardMemorySources,
  normalizedActivity: NormalizedDashboardActivity
): DashboardData['memory'] {
  return {
    long_term: { manifest, project_spec: memory.projectSpec },
    progress_memory: buildMemorySection('Progress Memory', memory.progressEntries, summarizeProgress(memory.progressEntries), 'No explicit progress entries recorded yet.'),
    decision_memory: buildMemorySection('Decision Memory', memory.decisions, summarizeDecisions(memory.decisions.length), 'No decisions recorded yet.'),
    milestone_memory: buildMemorySection('Milestone Memory', normalizedActivity.milestoneList, summarizeMilestones(normalizedActivity.milestoneList.length, normalizedActivity.completedMilestones), 'No milestones inferred or recorded yet.'),
    note_memory: buildMemorySection('Note Memory', memory.notes, summarizeNotes(memory.notes.length), 'No notes captured yet.'),
  };
}

async function buildFullDashboard(manifest: Manifest, repoPath: string, includeDeepAnalysis: boolean, recentCommits: number, generatedAt: string, storage: StoragePort, git: GitPort): Promise<DashboardData> {
  const memory = readDashboardMemorySources(repoPath, storage);
  const signals = await readDashboardSignals(repoPath, includeDeepAnalysis, recentCommits, storage, git);
  const normalizedActivity = normalizeDashboardActivity(memory, signals);

  return {
    overview: buildDashboardOverview(manifest, signals),
    activity: buildDashboardActivitySection(signals, normalizedActivity),
    memory: buildDashboardMemory(manifest, memory, normalizedActivity),
    next_actions: signals.suggestedActions.next_actions,
    meta: {
      generated_at: generatedAt,
      repo_path: repoPath,
      is_initialized: true,
      include_deep_analysis: includeDeepAnalysis,
      degradation_notice: 'The dashboard response is portable across HTTP clients and custom web UI consumers.',
    },
  };
}

export async function buildDashboardData(input: BuildDashboardInput, storage: StoragePort, git: GitPort): Promise<DashboardData> {
  const cwd = input.repo_path;
  const repoRoot = storage.getRepoRootPath(cwd);
  const repoPath = repoRoot;
  const includeDeepAnalysis = input.include_deep_analysis !== false;
  const recentCommits = input.recent_commits || 50;
  const generatedAt = new Date().toISOString();
  const manifest = storage.readManifest(repoPath);

  if (!manifest) {
    return buildUninitializedDashboard(repoPath, includeDeepAnalysis, generatedAt);
  }

  return buildFullDashboard(manifest, repoPath, includeDeepAnalysis, recentCommits, generatedAt, storage, git);
}

export function buildDashboardSummary(data: DashboardData): string {
  const progressText = data.overview.overall_completion === null ? 'Progress: unknown' : `Progress: ${data.overview.overall_completion}`;
  const goalsText = data.overview.goals.length > 0 ? `Goals: ${data.overview.goals.slice(0, 3).join('; ')}` : 'Goals: not initialized';
  const focusText = `Focus: ${data.overview.current_focus.area}`;
  const actionText = data.next_actions[0]?.title ? `Top next action: ${data.next_actions[0].title}` : 'Top next action: none suggested';
  return [`${data.overview.project_name} dashboard`, progressText, focusText, goalsText, actionText].join(' | ');
}
