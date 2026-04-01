import {
  getManifestPath,
  manifestExists,
  readManifest,
  writeManifest,
  type Manifest,
} from '@myczh/project-brain/core-protocol/storage';

export interface ProjectInitInput {
  repo_path?: string;
  answers?: {
    project_name?: string;
    summary?: string;
    repo_type?: string;
    primary_stack?: string[];
    long_term_goal?: string;
    one_liner?: string;
    tech_stack?: string[];
    goals?: string[];
  };
}

export interface ProjectInitOutput {
  status: 'ok' | 'need_more_info' | 'already_initialized' | 'updated';
  manifest?: Manifest;
  draft_manifest?: Partial<Manifest>;
  manifest_path?: string;
  questions?: string[];
  message?: string;
}

function normalizeArray(values?: string[]): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map(v => v.trim()).filter(Boolean);
}

export async function projectInit(input: ProjectInitInput): Promise<ProjectInitOutput> {
  const cwd = input.repo_path || process.cwd();
  const hasManifest = manifestExists(cwd);
  const existingManifest = hasManifest ? readManifest(cwd) : null;

  if (hasManifest && !input.answers) {
    return {
      status: 'already_initialized',
      manifest_path: getManifestPath(cwd),
      manifest: existingManifest || undefined,
      message: 'Project already initialized. Pass answers to update the identity anchor.',
    };
  }

  const answers = input.answers || {};
  const missingFields: string[] = [];
  const primaryStack = normalizeArray(answers.primary_stack || answers.tech_stack);
  const legacyGoals = normalizeArray(answers.goals);
  const summary = (answers.summary || answers.one_liner || '').trim();
  const longTermGoal = (answers.long_term_goal || legacyGoals.join('; ')).trim();

  if (!answers.project_name?.trim()) missingFields.push('project_name');
  if (!summary) missingFields.push('summary');
  if (!answers.repo_type?.trim()) missingFields.push('repo_type');
  if (primaryStack.length === 0) missingFields.push('primary_stack (at least one item)');

  if (missingFields.length > 0) {
    return {
      status: 'need_more_info',
      draft_manifest: {
        project_name: answers.project_name?.trim(),
        summary,
        repo_type: answers.repo_type?.trim(),
        primary_stack: primaryStack,
        long_term_goal: longTermGoal || undefined,
      },
      questions: missingFields.map(field => `Please provide ${field}`),
      message: 'Collected partial identity anchor data. Manifest is not written until required fields are provided.',
    };
  }

  const now = new Date().toISOString();
  const manifest: Manifest = {
    project_name: answers.project_name?.trim() || existingManifest?.project_name || '',
    summary,
    repo_type: answers.repo_type?.trim() || existingManifest?.repo_type || 'application',
    primary_stack: primaryStack,
    long_term_goal: longTermGoal || existingManifest?.long_term_goal,
    created_at: existingManifest?.created_at || now,
    updated_at: now,
  };

  const manifestPath = writeManifest(manifest, cwd);

  return {
    status: hasManifest ? 'updated' : 'ok',
    manifest,
    manifest_path: manifestPath,
    message: hasManifest ? 'Project identity anchor updated.' : 'Project identity anchor created.',
  };
}
