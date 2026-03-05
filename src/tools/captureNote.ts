import { appendNote, generateNoteId, Note } from '../storage/notes.js';

export interface CaptureNoteInput {
  note: string;
  tags?: string[];
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
  };

  appendNote(note, cwd);

  return {
    status: 'ok',
    note_id: note.id,
  };
}
