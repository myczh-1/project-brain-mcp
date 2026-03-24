import { ChangeSpec, readChange, writeChange } from '../../core/storage/changes.js';

export interface UpdateChangeInput {
  repo_path?: string;
  change_id: string;
  patch: {
    title?: string;
    summary?: string;
    status?: ChangeSpec['status'];
    goals?: string[];
    non_goals?: string[];
    constraints?: string[];
    acceptance_criteria?: string[];
    affected_areas?: string[];
    related_decision_ids?: string[];
  };
}

export interface UpdateChangeOutput {
  status: 'ok';
  change: ChangeSpec;
  change_path: string;
}

function normalize(values?: string[]): string[] | undefined {
  return Array.isArray(values) ? values.map(v => v.trim()).filter(Boolean) : undefined;
}

export async function updateChange(input: UpdateChangeInput): Promise<UpdateChangeOutput> {
  const cwd = input.repo_path || process.cwd();
  const existing = readChange(input.change_id, cwd);
  if (!existing) {
    throw new Error(`Change not found: ${input.change_id}`);
  }

  const next: ChangeSpec = {
    ...existing,
    title: input.patch.title?.trim() || existing.title,
    summary: input.patch.summary?.trim() || existing.summary,
    status: input.patch.status || existing.status,
    goals: normalize(input.patch.goals) || existing.goals,
    non_goals: normalize(input.patch.non_goals) || existing.non_goals,
    constraints: normalize(input.patch.constraints) || existing.constraints,
    acceptance_criteria: normalize(input.patch.acceptance_criteria) || existing.acceptance_criteria,
    affected_areas: normalize(input.patch.affected_areas) || existing.affected_areas,
    related_decision_ids: normalize(input.patch.related_decision_ids) || existing.related_decision_ids,
    updated_at: new Date().toISOString(),
  };

  const changePath = writeChange(next, cwd);

  return {
    status: 'ok',
    change: next,
    change_path: changePath,
  };
}
