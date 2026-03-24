import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';

export interface ProjectSpec {
  product_goal: string;
  non_goals: string[];
  architecture_rules: string[];
  coding_rules: string[];
  agent_rules: string[];
  source: string;
  updated_at: string;
}

const PROJECT_SPEC_FILE = 'project-spec.json';

export function getProjectSpecPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), PROJECT_SPEC_FILE);
}

export function readProjectSpec(cwd?: string): ProjectSpec | null {
  const projectSpecPath = getProjectSpecPath(cwd);
  if (!fs.existsSync(projectSpecPath)) {
    return null;
  }

  const content = fs.readFileSync(projectSpecPath, 'utf-8');
  return JSON.parse(content) as ProjectSpec;
}

export function writeProjectSpec(projectSpec: ProjectSpec, cwd?: string): string {
  ensureBrainDir(cwd);
  const projectSpecPath = getProjectSpecPath(cwd);
  fs.writeFileSync(projectSpecPath, JSON.stringify(projectSpec, null, 2), 'utf-8');
  return projectSpecPath;
}
