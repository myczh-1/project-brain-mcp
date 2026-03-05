import { manifestExists, writeManifest, getManifestPath, Manifest } from '../storage/manifest.js';

export interface ProjectInitInput {
  repo_path?: string;
  answers: {
    project_name: string;
    one_liner: string;
    goals: string[];
    constraints: string[];
    tech_stack: string[];
  };
}

export interface ProjectInitOutput {
  status: 'ok' | 'need_more_info';
  manifest?: Manifest;
  manifest_path?: string;
  questions?: string[];
}

export async function projectInit(input: ProjectInitInput): Promise<ProjectInitOutput> {
  const cwd = input.repo_path || process.cwd();

  if (manifestExists(cwd)) {
    return {
      status: 'ok',
      manifest_path: getManifestPath(cwd),
    };
  }

  const { answers } = input;
  const missingFields: string[] = [];

  if (!answers.project_name) missingFields.push('project_name');
  if (!answers.one_liner) missingFields.push('one_liner');

  if (missingFields.length > 0) {
    return {
      status: 'need_more_info',
      questions: missingFields.map(field => `Please provide ${field}`),
    };
  }

  const manifest: Manifest = {
    project_name: answers.project_name,
    one_liner: answers.one_liner,
    goals: answers.goals || [],
    constraints: answers.constraints || [],
    tech_stack: answers.tech_stack || [],
    created_at: new Date().toISOString(),
  };

  const manifestPath = writeManifest(manifest, cwd);

  return {
    status: 'ok',
    manifest,
    manifest_path: manifestPath,
  };
}
