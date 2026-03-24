import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';

export interface NextAction {
  id: string;
  title: string;
  description: string;
  priority_score: number;
  reasoning: string;
  
  // RICE scoring components
  impact: number;                // 1-3 (low, medium, high)
  effort: number;                // 1-5 (very low to very high)
  confidence: 'low' | 'mid' | 'high';
  
  // Related information
  related_milestone?: string;
  blocking_issues?: string[];
  suggested_by: string;          // Signal type that generated this
  
  created_at: string;
}

const NEXT_ACTIONS_FILE = 'next_actions.json';

export function getNextActionsPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), NEXT_ACTIONS_FILE);
}

export function readNextActions(cwd?: string): NextAction[] {
  const actionsPath = getNextActionsPath(cwd);
  if (!fs.existsSync(actionsPath)) {
    return [];
  }
  const content = fs.readFileSync(actionsPath, 'utf-8');
  return JSON.parse(content);
}

export function writeNextActions(actions: NextAction[], cwd?: string): void {
  ensureBrainDir(cwd);
  const actionsPath = getNextActionsPath(cwd);
  fs.writeFileSync(actionsPath, JSON.stringify(actions, null, 2), 'utf-8');
}

export function appendNextAction(action: NextAction, cwd?: string): void {
  const actions = readNextActions(cwd);
  actions.push(action);
  writeNextActions(actions, cwd);
}

export function clearNextActions(cwd?: string): void {
  writeNextActions([], cwd);
}
