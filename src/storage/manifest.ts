import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';

export interface Manifest {
  project_name: string;
  one_liner: string;
  goals: string[];
  constraints: string[];
  tech_stack: string[];
  created_at: string;
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
  return JSON.parse(content);
}

export function writeManifest(manifest: Manifest, cwd?: string): string {
  ensureBrainDir(cwd);
  const manifestPath = getManifestPath(cwd);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  return manifestPath;
}
