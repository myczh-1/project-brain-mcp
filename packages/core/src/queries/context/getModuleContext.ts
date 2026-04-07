import type { GitPort } from '../../ports/git.js';
import type { StoragePort } from '../../ports/storage.js';

export interface ModuleContextInput {
  repo_path: string;
  module_id: string;
  recent_commits?: number;
}

export interface ModuleContextOutput {
  module: ReturnType<StoragePort['readModules']>[number];
  related_changes: ReturnType<StoragePort['readAllChanges']>;
  related_decisions: ReturnType<StoragePort['readDecisions']>;
  related_notes: ReturnType<StoragePort['readNotes']>;
  related_progress: ReturnType<StoragePort['readProgress']>;
  code_evidence: {
    commits: ReturnType<GitPort['parseLog']>;
    hot_paths: ReturnType<GitPort['calculateHotPaths']>;
  };
}

export async function moduleContext(
  input: ModuleContextInput,
  storage: StoragePort,
  git: GitPort
): Promise<ModuleContextOutput> {
  const cwd = input.repo_path;
  const moduleId = input.module_id.trim().toLowerCase();
  const module = storage.readModules(cwd).find(entry => entry.id === moduleId);
  if (!module) {
    throw new Error(`Module not found: ${input.module_id}`);
  }

  const relatedChanges = storage.readAllChanges(cwd).filter(change => change.module_ids.includes(module.id));
  const relatedDecisions = storage.readDecisions(cwd).filter(decision => decision.module_ids.includes(module.id));
  const relatedNotes = storage.readNotes(cwd).filter(note => note.module_ids.includes(module.id));
  const relatedProgress = storage.readProgress(cwd).filter(entry => entry.module_ids.includes(module.id));
  const commits = git.parseLog(input.recent_commits || 50, cwd);
  const hotPaths = git.calculateHotPaths(commits);
  const relevantHotPaths =
    module.key_paths.length === 0
      ? hotPaths.slice(0, 10)
      : hotPaths.filter(pathEntry => module.key_paths.some(prefix => pathEntry.path.startsWith(prefix))).slice(0, 10);

  return {
    module,
    related_changes: relatedChanges,
    related_decisions: relatedDecisions,
    related_notes: relatedNotes,
    related_progress: relatedProgress,
    code_evidence: {
      commits: commits.slice(0, 10),
      hot_paths: relevantHotPaths,
    },
  };
}
