import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';

export interface Decision {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  alternatives_considered: string[];
  scope: 'project' | 'change' | 'module';
  related_change_id?: string;
  supersedes?: string;
  created_at: string;
}

const DECISIONS_FILE = 'decisions.ndjson';

export function getDecisionsPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), DECISIONS_FILE);
}

export function readDecisions(cwd?: string): Decision[] {
  const decisionsPath = getDecisionsPath(cwd);
  if (!fs.existsSync(decisionsPath)) {
    const legacyPath = path.join(getBrainDir(cwd), 'decisions.json');
    if (!fs.existsSync(legacyPath)) {
      return [];
    }

    const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf-8')) as Array<{
      decision: string;
      reason: string;
      date: string;
    }>;

    return legacy.map((item, index) => ({
      id: `legacy-decision-${index + 1}`,
      title: item.decision.slice(0, 80),
      decision: item.decision,
      rationale: item.reason,
      alternatives_considered: [],
      scope: 'project',
      created_at: item.date,
    }));
  }
  const content = fs.readFileSync(decisionsPath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());
  return lines.map(line => JSON.parse(line) as Decision);
}

export function appendDecision(decision: Decision, cwd?: string): void {
  ensureBrainDir(cwd);
  const decisionsPath = getDecisionsPath(cwd);
  fs.appendFileSync(decisionsPath, `${JSON.stringify(decision)}\n`, 'utf-8');
}
