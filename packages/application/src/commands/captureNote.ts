import { appendNote, generateNoteId, type Note } from '@myczh/project-brain/core-protocol/storage';

export interface CaptureNoteInput {
  note: string;
  tags?: string[];
  related_change_id?: string;
  repo_path?: string;
}

export interface CaptureNoteOutput {
  status: 'ok';
  note_id: string;
}

export async function projectCaptureNote(input: CaptureNoteInput): Promise<CaptureNoteOutput> {
  const cwd = input.repo_path || process.cwd();

  const note: Note = {
    id: generateNoteId(),
    time: new Date().toISOString(),
    tags: input.tags || [],
    note: input.note,
    related_change_id: input.related_change_id,
  };

  appendNote(note, cwd);

  return {
    status: 'ok',
    note_id: note.id,
  };
}
