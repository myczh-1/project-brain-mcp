import { readAllChanges } from '@myczh/project-brain/core-protocol/storage';
import { createChange, type CreateChangeInput } from './createChange.js';
import { recordProgress, type RecordProgressInput } from './recordProgress.js';
import { updateChange } from './updateChange.js';

export interface StartWorkInput {
  repo_path?: string;
  change_id?: string;
  create_change?: CreateChangeInput['change'];
  initial_progress?: RecordProgressInput['progress'];
}

export interface StartWorkOutput {
  status: 'ok';
  action: 'reused_change' | 'created_change' | 'adopted_recent_change';
  change: Awaited<ReturnType<typeof createChange>>['change'];
  change_path: string;
  progress_id?: string;
}

type ResolvedChange = {
  action: StartWorkOutput['action'];
  change: StartWorkOutput['change'];
  change_path: string;
};

function findReusableChange(repoPath?: string) {
  const changes = readAllChanges(repoPath);
  return changes.find(change => change.status === 'active') || changes.find(change => change.status === 'proposed');
}

async function resolveChange(cwd: string, input: StartWorkInput): Promise<ResolvedChange> {
  if (!input.change_id && !input.create_change) {
    const reusable = findReusableChange(cwd);
    if (!reusable) {
      throw new Error(
        'brain_start_work requires change_id or create_change when no active/proposed change exists.'
      );
    }

    const updated = await updateChange({
      repo_path: cwd,
      change_id: reusable.id,
      patch: { status: 'active' },
    });

    return { action: 'adopted_recent_change', change: updated.change, change_path: updated.change_path };
  }

  if (input.change_id) {
    const updated = await updateChange({
      repo_path: cwd,
      change_id: input.change_id,
      patch: { status: 'active' },
    });

    return { action: 'reused_change', change: updated.change, change_path: updated.change_path };
  }

  const created = await createChange({
    repo_path: cwd,
    change: {
      ...input.create_change!,
      status: input.create_change?.status || 'active',
    },
  });

  return { action: 'created_change', change: created.change, change_path: created.change_path };
}

export async function startWork(input: StartWorkInput): Promise<StartWorkOutput> {
  const cwd = input.repo_path || process.cwd();
  const resolved = await resolveChange(cwd, input);

  const progressResult = input.initial_progress
    ? await recordProgress({
        repo_path: cwd,
        type: 'progress',
        progress: {
          ...input.initial_progress,
          related_change_id: input.initial_progress.related_change_id || resolved.change.id,
        },
      })
    : undefined;

  return {
    status: 'ok',
    action: resolved.action,
    change: resolved.change,
    change_path: resolved.change_path,
    progress_id: progressResult?.progress_id,
  };
}
