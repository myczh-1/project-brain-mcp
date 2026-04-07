import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';
import { noteSchema, parseNdjsonText } from './validation.js';

export interface Note {
  id: string;
  time: string;
  tags: string[];
  note: string;
  related_change_id?: string;
  module_ids: string[];
}

const NOTES_FILE = 'notes.ndjson';

export function getNotesPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), NOTES_FILE);
}

export function readNotes(cwd?: string): Note[] {
  const notesPath = getNotesPath(cwd);
  if (!fs.existsSync(notesPath)) {
    return [];
  }

  const content = fs.readFileSync(notesPath, 'utf-8');
  return parseNdjsonText(content, notesPath, noteSchema, 'note');
}

export function appendNote(note: Note, cwd?: string): void {
  ensureBrainDir(cwd);
  const notesPath = getNotesPath(cwd);
  const line = JSON.stringify(note) + '\n';
  fs.appendFileSync(notesPath, line, 'utf-8');
}

export function generateNoteId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
