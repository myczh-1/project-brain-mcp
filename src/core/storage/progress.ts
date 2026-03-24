import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';

export interface ProgressEntry {
  id: string;
  date: string;
  summary: string;
  status?: 'planned' | 'in_progress' | 'blocked' | 'done';
  blockers?: string[];
  related_change_id?: string;
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
    const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf-8')) as Array<{
      date: string;
      summary: string;
      confidence: 'low' | 'mid' | 'high';
    }>;
    return legacy.map((entry, index) => ({
      id: `legacy-progress-${index + 1}`,
      date: entry.date,
      summary: entry.summary,
      confidence: entry.confidence,
    }));
  }
  const content = fs.readFileSync(progressPath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());
  return lines.map(line => JSON.parse(line) as ProgressEntry);
}

export function appendProgress(entry: ProgressEntry, cwd?: string): void {
  ensureBrainDir(cwd);
  const progressPath = getProgressPath(cwd);
  fs.appendFileSync(progressPath, `${JSON.stringify(entry)}\n`, 'utf-8');
}
