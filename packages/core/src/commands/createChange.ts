import type { ChangeSpec, StoragePort } from '../ports/storage.js';

export interface CreateChangeInput {
  repo_path: string;
  change: {
    id?: string;
    title: string;
    summary: string;
    goals?: string[];
    non_goals?: string[];
    constraints?: string[];
    acceptance_criteria?: string[];
    affected_areas?: string[];
    module_ids?: string[];
    related_decision_ids?: string[];
    status?: ChangeSpec['status'];
  };
}

export interface CreateChangeOutput {
  status: 'ok';
  change: ChangeSpec;
  change_path: string;
}

function normalize(values?: string[]): string[] {
  return Array.isArray(values) ? values.map(v => v.trim()).filter(Boolean) : [];
}

export async function createChange(input: CreateChangeInput, storage: StoragePort): Promise<CreateChangeOutput> {
  const cwd = input.repo_path;
  const now = new Date().toISOString();
  const id = input.change.id?.trim() || storage.generateChangeId(input.change.title);

  if (id.length > 80) {
    throw new Error('Change ID exceeds maximum length of 80 characters');
  }

  const change: ChangeSpec = {
    id,
    title: input.change.title.trim(),
    summary: input.change.summary.trim(),
    status: input.change.status || 'proposed',
    goals: normalize(input.change.goals),
    non_goals: normalize(input.change.non_goals),
    constraints: normalize(input.change.constraints),
    acceptance_criteria: normalize(input.change.acceptance_criteria),
    affected_areas: normalize(input.change.affected_areas),
    module_ids: normalize(input.change.module_ids),
    related_decision_ids: normalize(input.change.related_decision_ids),
    created_at: now,
    updated_at: now,
  };

  storage.upsertModules(change.module_ids, cwd);
  const changePath = storage.writeChange(change, cwd);

  return {
    status: 'ok',
    change,
    change_path: changePath,
  };
}
