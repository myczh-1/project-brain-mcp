import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';
import { legacyProgressEntrySchema, parseJsonText, parseNdjsonText, progressEntrySchema } from './validation.js';

export interface ProgressEntry {
  id: string;
  date: string;
  summary: string;
  status?: 'planned' | 'in_progress' | 'blocked' | 'done';
  blockers?: string[];
  related_change_id?: string;
  module_ids: string[];
  confidence: 'low' | 'mid' | 'high';
}

const PROGRESS_FILE = 'progress.ndjson';

export function getProgressPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), PROGRESS_FILE);
}

export function readProgress(cwd?: string): ProgressEntry[] {
  const progressPath = getProgressPath(cwd);
  if (!fs.existsSync(progressPath)) {
    const legacyPath = path.join(getBrainDir(cwd), 'progress.json');
    if (!fs.existsSync(legacyPath)) {
      return [];
    }
    const legacy = parseJsonText(
      fs.readFileSync(legacyPath, 'utf-8'),
      legacyPath,
      legacyProgressEntrySchema.array(),
      'legacy progress'
    );
    const migrated = legacy.map((entry, index) => ({
      id: `legacy-progress-${index + 1}`,
      date: entry.date,
      summary: entry.summary,
      module_ids: [],
      confidence: entry.confidence,
    }));

    ensureBrainDir(cwd);
    const ndjsonContent = migrated.map(entry => JSON.stringify(entry)).join('\n') + (migrated.length > 0 ? '\n' : '');
    fs.writeFileSync(progressPath, ndjsonContent, 'utf-8');
    fs.renameSync(legacyPath, `${legacyPath}.bak`);

    return migrated;
  }
  const content = fs.readFileSync(progressPath, 'utf-8');
  return parseNdjsonText(content, progressPath, progressEntrySchema, 'progress entry');
}

export function appendProgress(entry: ProgressEntry, cwd?: string): void {
  ensureBrainDir(cwd);
  const progressPath = getProgressPath(cwd);
  fs.appendFileSync(progressPath, `${JSON.stringify(entry)}\n`, 'utf-8');
}
