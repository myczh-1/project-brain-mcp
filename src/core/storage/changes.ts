import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';

export type ChangeStatus = 'proposed' | 'active' | 'done' | 'dropped';

export interface ChangeSpec {
  id: string;
  title: string;
  summary: string;
  status: ChangeStatus;
  goals: string[];
  non_goals: string[];
  constraints: string[];
  acceptance_criteria: string[];
  affected_areas: string[];
  related_decision_ids: string[];
  created_at: string;
  updated_at: string;
}

function getChangesDir(cwd?: string): string {
  return path.join(getBrainDir(cwd), 'changes');
}

export function ensureChangesDir(cwd?: string): string {
  ensureBrainDir(cwd);
  const dir = getChangesDir(cwd);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function sanitizeChangeId(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `change-${Date.now()}`;
}

export function generateChangeId(title: string): string {
  return `${sanitizeChangeId(title)}-${Date.now().toString(36)}`;
}

export function getChangePath(changeId: string, cwd?: string): string {
  return path.join(getChangesDir(cwd), `${sanitizeChangeId(changeId)}.json`);
}

export function changeExists(changeId: string, cwd?: string): boolean {
  return fs.existsSync(getChangePath(changeId, cwd));
}

export function readChange(changeId: string, cwd?: string): ChangeSpec | null {
  const changePath = getChangePath(changeId, cwd);
  if (!fs.existsSync(changePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(changePath, 'utf-8')) as ChangeSpec;
}

export function readAllChanges(cwd?: string): ChangeSpec[] {
  const dir = getChangesDir(cwd);
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(dir, file))
    .map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ChangeSpec)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function writeChange(change: ChangeSpec, cwd?: string): string {
  ensureChangesDir(cwd);
  const filePath = getChangePath(change.id, cwd);
  fs.writeFileSync(filePath, JSON.stringify(change, null, 2), 'utf-8');
  return filePath;
}
