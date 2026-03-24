import { Commit } from '../../core/git/parseLog.js';
import { HotPath } from '../../core/git/hotPaths.js';
import { Manifest } from '../../core/storage/manifest.js';
import { ProjectSpec } from '../../core/storage/projectSpec.js';
import { Milestone } from '../../core/storage/milestones.js';
import { Note } from '../../core/storage/notes.js';
import { Decision } from '../../core/storage/decisions.js';
import { ProgressEntry } from '../../core/storage/progress.js';
import { NextAction } from '../../core/storage/nextActions.js';

export interface DashboardOverview {
  project_name: string;
  summary: string;
  goals: string[];
  current_focus: {
    area: string;
    confidence: string;
  };
  overall_progress: number | null;
  confidence: string;
}

export interface DashboardActivity {
  summary: string;
  recent_commits: Commit[];
  hot_paths: HotPath[];
  last_active_at: string | null;
  staleness_risk: string;
}

export interface DashboardMemoryListSection<T> {
  title: string;
  summary: string;
  total_count: number;
  visible_count: number;
  items: T[];
  empty_message?: string;
}

export interface DashboardMemory {
  long_term: {
    manifest: Manifest | null;
    project_spec: ProjectSpec | null;
  };
  progress_memory: DashboardMemoryListSection<ProgressEntry>;
  decision_memory: DashboardMemoryListSection<Decision>;
  milestone_memory: DashboardMemoryListSection<Milestone>;
  note_memory: DashboardMemoryListSection<Note>;
}

export interface DashboardMeta {
  generated_at: string;
  repo_path: string;
  is_initialized: boolean;
  include_deep_analysis: boolean;
  degradation_notice: string;
}

export interface DashboardData {
  overview: DashboardOverview;
  activity: DashboardActivity;
  memory: DashboardMemory;
  next_actions: NextAction[];
  meta: DashboardMeta;
}

