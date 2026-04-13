import * as fs from 'fs';
import * as path from 'path';
import type { Decision } from '@myczh/project-brain/core';
import { ensureBrainDir, getBrainDir } from './brainDir.js';
import { decisionSchema, legacyDecisionSchema, parseJsonText, parseNdjsonText } from './validation.js';

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

    const legacy = parseJsonText(
      fs.readFileSync(legacyPath, 'utf-8'),
      legacyPath,
      legacyDecisionSchema.array(),
      'legacy decisions'
    );

    const migrated: Decision[] = legacy.map((item, index) => ({
      id: `legacy-decision-${index + 1}`,
      title: item.decision.slice(0, 80),
      decision: item.decision,
      rationale: item.reason,
      alternatives_considered: [],
      scope: 'project',
      module_ids: [],
      created_at: item.date,
    }));

    // Persist migration: write ndjson, rename legacy to .bak
    ensureBrainDir(cwd);
    const ndjsonContent = migrated.map(d => JSON.stringify(d)).join('\n') + (migrated.length > 0 ? '\n' : '');
    fs.writeFileSync(decisionsPath, ndjsonContent, 'utf-8');
    fs.renameSync(legacyPath, `${legacyPath}.bak`);

    return migrated;
  }
  const content = fs.readFileSync(decisionsPath, 'utf-8');
  return parseNdjsonText(content, decisionsPath, decisionSchema, 'decision');
}

export function appendDecision(decision: Decision, cwd?: string): void {
  ensureBrainDir(cwd);
  const decisionsPath = getDecisionsPath(cwd);
  fs.appendFileSync(decisionsPath, `${JSON.stringify(decision)}\n`, 'utf-8');
}
