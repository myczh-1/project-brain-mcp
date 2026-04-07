import type { StoragePort } from '../../ports/storage.js';

export interface ListModulesInput {
  repo_path: string;
  limit?: number;
}

export interface ListModulesOutput {
  modules: Array<{
    id: string;
    name: string;
    summary: string;
    aliases: string[];
    key_paths: string[];
    related_changes: number;
    decision_count: number;
    note_count: number;
    progress_count: number;
    last_used_at: string;
  }>;
}

export async function listModules(input: ListModulesInput, storage: StoragePort): Promise<ListModulesOutput> {
  const cwd = input.repo_path;
  const limit = input.limit || 20;
  const modules = storage.readModules(cwd);
  const changes = storage.readAllChanges(cwd);
  const decisions = storage.readDecisions(cwd);
  const notes = storage.readNotes(cwd);
  const progress = storage.readProgress(cwd);

  return {
    modules: modules
      .map(module => ({
        id: module.id,
        name: module.name,
        summary: module.summary,
        aliases: module.aliases,
        key_paths: module.key_paths,
        related_changes: changes.filter(change => change.module_ids.includes(module.id)).length,
        decision_count: decisions.filter(decision => decision.module_ids.includes(module.id)).length,
        note_count: notes.filter(note => note.module_ids.includes(module.id)).length,
        progress_count: progress.filter(entry => entry.module_ids.includes(module.id)).length,
        last_used_at: module.last_used_at,
      }))
      .sort((a, b) => b.last_used_at.localeCompare(a.last_used_at))
      .slice(0, limit),
  };
}
