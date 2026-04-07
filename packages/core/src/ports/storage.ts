export type ChangeStatus = 'proposed' | 'active' | 'done' | 'dropped';

export interface Manifest {
  project_name: string;
  summary: string;
  repo_type: string;
  primary_stack: string[];
  long_term_goal?: string;
  locale?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSpec {
  product_goal: string;
  non_goals: string[];
  architecture_rules: string[];
  coding_rules: string[];
  agent_rules: string[];
  source: string;
  updated_at: string;
}

export interface ChangeSpec {
  id: string;
  title: string;
  summary: string;
  status: ChangeStatus;
  goals: string[];
  non_goals: string[];
  constraints: string[];
  acceptance_criteria: string[];
  affected_areas: string[];
  module_ids: string[];
  related_decision_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ModuleRecord {
  id: string;
  name: string;
  summary: string;
  aliases: string[];
  key_paths: string[];
  created_at: string;
  updated_at: string;
  last_used_at: string;
}

export interface Decision {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  alternatives_considered: string[];
  scope: 'project' | 'change' | 'module';
  related_change_id?: string;
  module_ids: string[];
  supersedes?: string;
  created_at: string;
}

export interface Note {
  id: string;
  time: string;
  tags: string[];
  note: string;
  related_change_id?: string;
  module_ids: string[];
}

export interface ProgressEntry {
  id: string;
  date: string;
  summary: string;
  status?: 'planned' | 'in_progress' | 'blocked' | 'done';
  blockers?: string[];
  related_change_id?: string;
  module_ids: string[];
  confidence: 'low' | 'mid' | 'high';
}

export interface Milestone {
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  confidence?: 'low' | 'mid' | 'high';
  completion?: 'low' | 'mid' | 'high';
  detected_at?: string;
  last_updated?: string;
}

export interface NextAction {
  id: string;
  title: string;
  description: string;
  priority_score: number;
  reasoning: string;
  impact: number;
  effort: number;
  confidence: 'low' | 'mid' | 'high';
  related_milestone?: string;
  blocking_issues?: string[];
  suggested_by: string;
  created_at: string;
}

export interface StoragePort {
  ensureBrainDir(cwd?: string): string;
  brainDirExists(cwd?: string): boolean;
  getBrainDir(cwd?: string): string;

  readManifest(cwd?: string): Manifest | null;
  writeManifest(manifest: Manifest, cwd?: string): string;
  buildFallbackManifest(cwd?: string): Manifest;
  manifestExists(cwd?: string): boolean;
  getManifestPath(cwd?: string): string;

  readProjectSpec(cwd?: string): ProjectSpec | null;
  writeProjectSpec(projectSpec: ProjectSpec, cwd?: string): string;
  getProjectSpecPath(cwd?: string): string;

  readChange(changeId: string, cwd?: string): ChangeSpec | null;
  writeChange(change: ChangeSpec, cwd?: string): string;
  readAllChanges(cwd?: string): ChangeSpec[];
  changeExists(changeId: string, cwd?: string): boolean;
  ensureChangesDir(cwd?: string): string;
  generateChangeId(title: string): string;
  sanitizeChangeId(value: string): string;
  getChangePath(changeId: string, cwd?: string): string;

  appendDecision(decision: Decision, cwd?: string): void;
  readDecisions(cwd?: string): Decision[];

  appendNote(note: Note, cwd?: string): void;
  readNotes(cwd?: string): Note[];
  generateNoteId(): string;

  appendProgress(entry: ProgressEntry, cwd?: string): void;
  readProgress(cwd?: string): ProgressEntry[];

  readMilestones(cwd?: string): Milestone[];
  writeMilestones(milestones: Milestone[], cwd?: string): void;
  updateMilestone(milestone: Milestone, cwd?: string): void;
  upsertInferredMilestones(
    signals: Array<{ name: string; confidence: 'low' | 'mid' | 'high' }>,
    cwd?: string,
  ): Milestone[];

  readNextActions(cwd?: string): NextAction[];
  writeNextActions(actions: NextAction[], cwd?: string): void;

  readModules(cwd?: string): ModuleRecord[];
  writeModules(modules: ModuleRecord[], cwd?: string): void;
  upsertModules(moduleIds: string[], cwd?: string): ModuleRecord[];

  getRepoRootPath(cwd?: string): string;

  atomicWriteFile(filePath: string, content: string): void;

  /** Check if a file or directory exists at the given absolute path. */
  fileExists(filePath: string): boolean;
  /** Check if the given absolute path is a regular file (not a directory). */
  isFile(filePath: string): boolean;
  /** Read a text file at the given absolute path. Returns the file contents as a UTF-8 string. */
  readTextFile(filePath: string): string;
}
