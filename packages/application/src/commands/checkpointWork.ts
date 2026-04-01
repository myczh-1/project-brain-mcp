import { projectCaptureNote, type CaptureNoteInput } from './captureNote.js';
import { recordProgress, type RecordProgressInput } from './recordProgress.js';
import { updateChange, type UpdateChangeInput } from './updateChange.js';

export interface CheckpointWorkInput {
  repo_path?: string;
  change_id: string;
  change_patch?: UpdateChangeInput['patch'];
  progress?: RecordProgressInput['progress'];
  note?: {
    note: string;
    tags?: CaptureNoteInput['tags'];
  };
}

export interface CheckpointWorkOutput {
  status: 'ok';
  change_id: string;
  updated_change?: Awaited<ReturnType<typeof updateChange>>['change'];
  change_path?: string;
  progress_id?: string;
  note_id?: string;
}

export async function checkpointWork(input: CheckpointWorkInput): Promise<CheckpointWorkOutput> {
  const cwd = input.repo_path || process.cwd();

  if (!input.change_patch && !input.progress && !input.note) {
    throw new Error('brain_checkpoint requires at least one of change_patch, progress, or note.');
  }

  const updatedChange = input.change_patch
    ? await updateChange({
        repo_path: cwd,
        change_id: input.change_id,
        patch: input.change_patch,
      })
    : undefined;

  const progressResult = input.progress
    ? await recordProgress({
        repo_path: cwd,
        type: 'progress',
        progress: {
          ...input.progress,
          related_change_id: input.progress.related_change_id || input.change_id,
        },
      })
    : undefined;

  const noteResult = input.note
    ? await projectCaptureNote({
        repo_path: cwd,
        note: input.note.note,
        tags: input.note.tags,
        related_change_id: input.change_id,
      })
    : undefined;

  return {
    status: 'ok',
    change_id: input.change_id,
    updated_change: updatedChange?.change,
    change_path: updatedChange?.change_path,
    progress_id: progressResult?.progress_id,
    note_id: noteResult?.note_id,
  };
}
