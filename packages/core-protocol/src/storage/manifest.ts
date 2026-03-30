import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';
import { atomicWriteFile } from './fileOps.js';

export interface Manifest {
  project_name: string;
  summary: string;
  repo_type: string;
  primary_stack: string[];
  long_term_goal?: string;
  locale?: string;
  created_at: string;
  updated_at: string;
}

export function buildFallbackManifest(cwd?: string): Manifest {
  const repoRoot = cwd ? path.resolve(cwd) : process.cwd();
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
  const parsed = JSON.parse(content) as Partial<Manifest> & {
    one_liner?: string;
    goals?: string[];
    tech_stack?: string[];
  };

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
