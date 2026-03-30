import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';
import { atomicWriteFile } from './fileOps.js';

export interface NextAction {
  id: string;
  title: string;
  description: string;
  priority_score: number;
  reasoning: string;
  impact: number;
  effort: number;
  confidence: 'low' | 'mid' | 'high';
  related_milestone?: string;
  blocking_issues?: string[];
  suggested_by: string;
  created_at: string;
}

const NEXT_ACTIONS_FILE = 'next_actions.ndjson';
const LEGACY_NEXT_ACTIONS_FILE = 'next_actions.json';

export function getNextActionsPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), NEXT_ACTIONS_FILE);
}

export function readNextActions(cwd?: string): NextAction[] {
  const ndjsonPath = getNextActionsPath(cwd);

  if (fs.existsSync(ndjsonPath)) {
    const content = fs.readFileSync(ndjsonPath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    return lines.map(line => JSON.parse(line) as NextAction);
  }

  const legacyPath = path.join(getBrainDir(cwd), LEGACY_NEXT_ACTIONS_FILE);
  if (fs.existsSync(legacyPath)) {
    const content = fs.readFileSync(legacyPath, 'utf-8');
    return JSON.parse(content) as NextAction[];
  }

  return [];
}

export function appendNextAction(action: NextAction, cwd?: string): void {
  ensureBrainDir(cwd);
  const actionsPath = getNextActionsPath(cwd);
  fs.appendFileSync(actionsPath, JSON.stringify(action) + '\n', 'utf-8');
}

export function writeNextActions(actions: NextAction[], cwd?: string): void {
  ensureBrainDir(cwd);
  const actionsPath = getNextActionsPath(cwd);
  const content = actions.map(a => JSON.stringify(a)).join('\n') + (actions.length > 0 ? '\n' : '');
  atomicWriteFile(actionsPath, content);
}

export function clearNextActions(cwd?: string): void {
  writeNextActions([], cwd);
}
