import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';

export interface ProgressEntry {
  date: string;
  summary: string;
  confidence: 'low' | 'mid' | 'high';
}

const PROGRESS_FILE = 'progress.json';

export function getProgressPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), PROGRESS_FILE);
}

export function readProgress(cwd?: string): ProgressEntry[] {
  const progressPath = getProgressPath(cwd);
  if (!fs.existsSync(progressPath)) {
    return [];
  }
  const content = fs.readFileSync(progressPath, 'utf-8');
  return JSON.parse(content);
}

export function writeProgress(entries: ProgressEntry[], cwd?: string): void {
  ensureBrainDir(cwd);
  const progressPath = getProgressPath(cwd);
  fs.writeFileSync(progressPath, JSON.stringify(entries, null, 2), 'utf-8');
}

export function appendProgress(entry: ProgressEntry, cwd?: string): void {
  const entries = readProgress(cwd);
  entries.push(entry);
  writeProgress(entries, cwd);
}
