import * as fs from 'fs';
import * as path from 'path';
import type { ProjectSpec } from '@myczh/project-brain/core';
import { ensureBrainDir, getBrainDir } from './brainDir.js';
import { atomicWriteFile } from './fileOps.js';
import { parseJsonText, projectSpecSchema } from './validation.js';

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
  return parseJsonText(content, projectSpecPath, projectSpecSchema, 'project spec');
}

export function writeProjectSpec(projectSpec: ProjectSpec, cwd?: string): string {
  ensureBrainDir(cwd);
  const projectSpecPath = getProjectSpecPath(cwd);
  atomicWriteFile(projectSpecPath, JSON.stringify(projectSpec, null, 2));
  return projectSpecPath;
}
