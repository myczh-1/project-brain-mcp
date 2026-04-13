import * as fs from 'fs';
import * as path from 'path';
import type { ModuleRecord } from '@myczh/project-brain/core';
import { ensureBrainDir, getBrainDir } from './brainDir.js';
import { atomicWriteFile } from './fileOps.js';
import { parseJsonText, moduleSchema } from './validation.js';

const MODULES_FILE = 'modules.json';

function readModulesFromPath(modulesPath: string): ModuleRecord[] {
  if (!fs.existsSync(modulesPath)) {
    return [];
  }

  return parseJsonText(
    fs.readFileSync(modulesPath, 'utf-8'),
    modulesPath,
    moduleSchema.array(),
    'modules'
  );
}

function writeModulesToPath(modulesPath: string, modules: ModuleRecord[]): void {
  atomicWriteFile(modulesPath, JSON.stringify(modules, null, 2));
}

export function getModulesPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), MODULES_FILE);
}

export function readModules(cwd?: string): ModuleRecord[] {
  return readModulesFromPath(getModulesPath(cwd));
}

export function writeModules(modules: ModuleRecord[], cwd?: string): void {
  ensureBrainDir(cwd);
  writeModulesToPath(getModulesPath(cwd), modules);
}

function sanitizeModuleId(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function upsertModules(moduleIds: string[], cwd?: string): ModuleRecord[] {
  const brainDir = ensureBrainDir(cwd);
  const modulesPath = path.join(brainDir, MODULES_FILE);
  const requested = Array.from(new Set(moduleIds.map(sanitizeModuleId).filter(Boolean)));
  if (requested.length === 0) {
    return readModulesFromPath(modulesPath);
  }

  const modules = readModulesFromPath(modulesPath);
  const now = new Date().toISOString();
  const byId = new Map(modules.map(module => [module.id, module]));

  for (const moduleId of requested) {
    const existing = byId.get(moduleId);
    if (existing) {
      existing.last_used_at = now;
      existing.updated_at = now;
      continue;
    }

    const created: ModuleRecord = {
      id: moduleId,
      name: moduleId,
      summary: '',
      aliases: [],
      key_paths: [],
      created_at: now,
      updated_at: now,
      last_used_at: now,
    };
    modules.push(created);
    byId.set(moduleId, created);
  }

  modules.sort((a, b) => b.last_used_at.localeCompare(a.last_used_at));
  writeModulesToPath(modulesPath, modules);
  return modules;
}
