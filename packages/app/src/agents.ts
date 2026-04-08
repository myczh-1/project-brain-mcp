import * as fs from 'fs';
import * as path from 'path';

const MANAGED_START = '<!-- project-brain:managed:start -->';
const MANAGED_END = '<!-- project-brain:managed:end -->';

function buildManagedBlock(): string {
  return [
    MANAGED_START,
    '## Project Brain',
    '',
    '- Use Project Brain through `project-brain stdio` whenever you need durable project memory or task context in this repository.',
    '- Read and update Project Brain through its stdio tools instead of editing `.project-brain/` files directly.',
    '- Refresh Project Brain state before making durable updates if your view may be stale.',
    '- Treat `.project-brain/` as repository-root state even when working from a nested package or subdirectory.',
    MANAGED_END,
  ].join('\n');
}

export function renderAgentsContent(existingContent?: string): string {
  const managedBlock = buildManagedBlock();

  if (!existingContent || existingContent.trim().length === 0) {
    return ['# AGENTS', '', managedBlock, ''].join('\n');
  }

  const existing = existingContent.replace(/\s+$/, '');
  const managedPattern = new RegExp(`${MANAGED_START}[\\s\\S]*?${MANAGED_END}`, 'm');

  if (managedPattern.test(existing)) {
    return `${existing.replace(managedPattern, managedBlock)}\n`;
  }

  return `${existing}\n\n${managedBlock}\n`;
}

export function ensureRepoAgentsFile(repoRoot: string): string {
  const agentsPath = path.join(repoRoot, 'AGENTS.md');
  const existingContent = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, 'utf8') : undefined;
  const nextContent = renderAgentsContent(existingContent);
  fs.writeFileSync(agentsPath, nextContent, 'utf8');
  return agentsPath;
}
