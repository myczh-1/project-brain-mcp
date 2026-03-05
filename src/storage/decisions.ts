import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';

export interface Decision {
  decision: string;
  reason: string;
  date: string;
}

const DECISIONS_FILE = 'decisions.json';

export function getDecisionsPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), DECISIONS_FILE);
}

export function readDecisions(cwd?: string): Decision[] {
  const decisionsPath = getDecisionsPath(cwd);
  if (!fs.existsSync(decisionsPath)) {
    return [];
  }
  const content = fs.readFileSync(decisionsPath, 'utf-8');
  return JSON.parse(content);
}

export function writeDecisions(decisions: Decision[], cwd?: string): void {
  ensureBrainDir(cwd);
  const decisionsPath = getDecisionsPath(cwd);
  fs.writeFileSync(decisionsPath, JSON.stringify(decisions, null, 2), 'utf-8');
}

export function appendDecision(decision: Decision, cwd?: string): void {
  const decisions = readDecisions(cwd);
  decisions.push(decision);
  writeDecisions(decisions, cwd);
}
