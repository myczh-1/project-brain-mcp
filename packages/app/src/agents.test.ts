import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { cleanupTempRepoRoot, createTempRepoRoot } from '../../infra-fs/src/test/testRepo.js';
import { ensureRepoAgentsFile, renderAgentsContent } from './agents.js';

describe('agents', () => {
  it('renders a fresh AGENTS.md when none exists', () => {
    const content = renderAgentsContent();

    expect(content).toContain('# AGENTS');
    expect(content).toContain('## Project Brain');
    expect(content).toContain('`project-brain stdio`');
    expect(content).toContain('instead of editing `.project-brain/` files directly');
  });

  it('appends a managed block without overwriting user content', () => {
    const content = renderAgentsContent('# AGENTS\n\n## Local Rules\n\nKeep tests fast.\n');

    expect(content).toContain('## Local Rules');
    expect(content).toContain('Keep tests fast.');
    expect(content).toContain('## Project Brain');
  });

  it('replaces only the managed block when updating an existing AGENTS.md', () => {
    const existing = [
      '# AGENTS',
      '',
      '## Local Rules',
      '',
      'Keep tests fast.',
      '',
      '<!-- project-brain:managed:start -->',
      'Old instructions',
      '<!-- project-brain:managed:end -->',
      '',
    ].join('\n');

    const content = renderAgentsContent(existing);

    expect(content).toContain('## Local Rules');
    expect(content).not.toContain('Old instructions');
    expect(content.match(/project-brain:managed:start/g)).toHaveLength(1);
  });

  it('writes AGENTS.md into the repository root', () => {
    const repoRoot = createTempRepoRoot('project-brain-agents-');

    try {
      const agentsPath = ensureRepoAgentsFile(repoRoot);

      expect(agentsPath).toBe(path.join(repoRoot, 'AGENTS.md'));
      expect(fs.readFileSync(agentsPath, 'utf8')).toContain('## Project Brain');
    } finally {
      cleanupTempRepoRoot(repoRoot);
    }
  });
});
