import { manifestExists, readManifest, writeManifest, getManifestPath, Manifest } from '../storage/manifest.js';

export interface ProjectInitInput {
  repo_path?: string;
  force_goal_update?: boolean;
  update_reason?: string;
  confirmed_by_user?: boolean;
  goal_confirmation_source?: string;
  goal_confirmation?: {
    confirmed_by_user?: boolean;
    goal_horizon?: 'final';
    source?: string;
  };
  answers?: {
    project_name?: string;
    one_liner?: string;
    goals?: string[];
    constraints?: string[];
    tech_stack?: string[];
    locale?: string;
  };
}

export interface ProjectInitOutput {
  status: 'ok' | 'need_more_info' | 'awaiting_confirmation' | 'already_initialized' | 'goal_updated';
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

  if (hasManifest && !input.force_goal_update) {
    return {
      status: 'already_initialized',
      manifest_path: getManifestPath(cwd),
      manifest: existingManifest || undefined,
      message:
        'Project already initialized. To change final goals, call brain_init with force_goal_update=true and update_reason.',
    };
  }

  const answers = input.answers || {};
  const missingFields: string[] = [];
  const goals = normalizeArray(answers.goals);
  const constraints = normalizeArray(answers.constraints);
  const techStack = normalizeArray(answers.tech_stack);
  const confirmationSource = (input.goal_confirmation_source || input.goal_confirmation?.source || '').trim();
  const confirmedByUser = input.confirmed_by_user === true || input.goal_confirmation?.confirmed_by_user === true;
  const goalHorizon = input.goal_confirmation?.goal_horizon || 'final';

  if (!answers.project_name?.trim()) missingFields.push('project_name');
  if (!answers.one_liner?.trim()) missingFields.push('one_liner');
  if (goals.length === 0) missingFields.push('goals (at least one goal)');
  if (input.force_goal_update && !input.update_reason?.trim()) {
    missingFields.push('update_reason (required when force_goal_update=true)');
  }

  if (missingFields.length > 0) {
    return {
      status: 'need_more_info',
      draft_manifest: {
        project_name: answers.project_name?.trim(),
        one_liner: answers.one_liner?.trim(),
        goals,
        constraints,
        tech_stack: techStack,
        locale: answers.locale,
      },
      questions: missingFields.map(field => `Please provide ${field}`),
      message: 'Collected partial init data. Manifest is not written until required fields are provided and explicitly confirmed by the user.',
    };
  }

  const projectName = answers.project_name?.trim() || '';
  const oneLiner = answers.one_liner?.trim() || '';

  if (!confirmedByUser) {
    return {
      status: 'awaiting_confirmation',
      draft_manifest: {
        project_name: projectName,
        one_liner: oneLiner,
        goals,
        constraints,
        tech_stack: techStack,
        locale: answers.locale,
      },
      questions: [
        'Please explicitly confirm these are the user-provided final goals by setting confirmed_by_user=true.',
        'Please provide goal_confirmation_source describing where that explicit user confirmation came from.',
      ],
      message: 'Confirmation required. Manifest is not written before explicit user confirmation.',
    };
  }

  if (goalHorizon !== 'final') {
    return {
      status: 'need_more_info',
      draft_manifest: {
        project_name: projectName,
        one_liner: oneLiner,
        goals,
        constraints,
        tech_stack: techStack,
        locale: answers.locale,
      },
      questions: ['Please provide goal_confirmation.goal_horizon="final" (must store final goals, not current implementation goals).'],
      message: 'Manifest was not written because goal horizon is not final.',
    };
  }

  if (!confirmationSource) {
    return {
      status: 'need_more_info',
      draft_manifest: {
        project_name: projectName,
        one_liner: oneLiner,
        goals,
        constraints,
        tech_stack: techStack,
        locale: answers.locale,
      },
      questions: ['Please provide goal_confirmation_source (where explicit user confirmation came from).'],
      message: 'Manifest was not written because confirmation source is missing.',
    };
  }

  const manifest: Manifest = {
    project_name: projectName,
    one_liner: oneLiner,
    goals,
    goal_confirmation: {
      confirmed_by_user: true,
      goal_horizon: 'final',
      source: confirmationSource,
    },
    constraints: constraints.length > 0 ? constraints : existingManifest?.constraints || [],
    tech_stack: techStack.length > 0 ? techStack : existingManifest?.tech_stack || [],
    created_at: existingManifest?.created_at || new Date().toISOString(),
    locale: answers.locale || existingManifest?.locale,
  };

  const manifestPath = writeManifest(manifest, cwd);

  return {
    status: hasManifest ? 'goal_updated' : 'ok',
    manifest,
    manifest_path: manifestPath,
    message: hasManifest
      ? `Goals updated by explicit request: ${input.update_reason?.trim()}`
      : 'Project initialized with explicit user-confirmed final goals. These goals are now the default long-term direction.',
  };
}
