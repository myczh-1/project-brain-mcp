import * as fs from 'fs';
import * as path from 'path';
import type { Manifest } from '@myczh/project-brain/core';
import { ensureBrainDir, getBrainDir } from './brainDir.js';
import { atomicWriteFile } from './fileOps.js';
import { getRepoRootPath } from './repoRoot.js';
import { manifestFileSchema, parseJsonText } from './validation.js';

export function buildFallbackManifest(cwd?: string): Manifest {
  const repoRoot = getRepoRootPath(cwd);
  const now = new Date().toISOString();

  return {
    project_name: path.basename(repoRoot),
    summary: 'Project identity has not been explicitly initialized yet.',
    repo_type: 'application',
    primary_stack: [],
    long_term_goal: undefined,
    created_at: now,
    updated_at: now,
  };
}

const MANIFEST_FILE = 'manifest.json';

export function getManifestPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), MANIFEST_FILE);
}

export function manifestExists(cwd?: string): boolean {
  return fs.existsSync(getManifestPath(cwd));
}

export function readManifest(cwd?: string): Manifest | null {
  const manifestPath = getManifestPath(cwd);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  const content = fs.readFileSync(manifestPath, 'utf-8');
  const parsed = parseJsonText(content, manifestPath, manifestFileSchema, 'manifest');

  return {
    project_name: parsed.project_name || 'Unknown Project',
    summary: parsed.summary || parsed.one_liner || '',
    repo_type: parsed.repo_type || 'application',
    primary_stack: Array.isArray(parsed.primary_stack)
      ? parsed.primary_stack
      : Array.isArray(parsed.tech_stack)
      ? parsed.tech_stack
      : [],
    long_term_goal:
      parsed.long_term_goal ||
      (Array.isArray(parsed.goals) && parsed.goals.length > 0 ? parsed.goals.join('; ') : undefined),
    locale: parsed.locale,
    created_at: parsed.created_at || new Date().toISOString(),
    updated_at: parsed.updated_at || parsed.created_at || new Date().toISOString(),
  };
}

export function writeManifest(manifest: Manifest, cwd?: string): string {
  ensureBrainDir(cwd);
  const manifestPath = getManifestPath(cwd);
  atomicWriteFile(manifestPath, JSON.stringify(manifest, null, 2));
  return manifestPath;
}
