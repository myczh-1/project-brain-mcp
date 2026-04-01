import { readProjectSpec, writeProjectSpec, type ProjectSpec } from '@myczh/project-brain/core-protocol/storage';

export interface DefineProjectSpecInput {
  repo_path?: string;
  spec: {
    product_goal: string;
    non_goals?: string[];
    architecture_rules?: string[];
    coding_rules?: string[];
    agent_rules?: string[];
    source?: string;
  };
}

export interface DefineProjectSpecOutput {
  status: 'ok';
  project_spec: ProjectSpec;
  project_spec_path: string;
}

function normalize(values?: string[]): string[] {
  return Array.isArray(values) ? values.map(v => v.trim()).filter(Boolean) : [];
}

export async function defineProjectSpec(input: DefineProjectSpecInput): Promise<DefineProjectSpecOutput> {
  const cwd = input.repo_path || process.cwd();
  const existing = readProjectSpec(cwd);
  const now = new Date().toISOString();

  const projectSpec: ProjectSpec = {
    product_goal: input.spec.product_goal.trim(),
    non_goals: normalize(input.spec.non_goals),
    architecture_rules: normalize(input.spec.architecture_rules),
    coding_rules: normalize(input.spec.coding_rules),
    agent_rules: normalize(input.spec.agent_rules),
    source: input.spec.source?.trim() || existing?.source || 'user_defined',
    updated_at: now,
  };

  const projectSpecPath = writeProjectSpec(projectSpec, cwd);

  return {
    status: 'ok',
    project_spec: projectSpec,
    project_spec_path: projectSpecPath,
  };
}
