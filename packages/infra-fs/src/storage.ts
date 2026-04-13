import type { StoragePort } from '@myczh/project-brain/core';
import {
  changeExists,
  ensureChangesDir,
  generateChangeId,
  getChangePath,
  readAllChanges,
  readChange,
  sanitizeChangeId,
  writeChange,
} from './storage/changes.js';
import { appendDecision, readDecisions } from './storage/decisions.js';
import { atomicWriteFile } from './storage/fileOps.js';
import { buildFallbackManifest, getManifestPath, manifestExists, readManifest, writeManifest } from './storage/manifest.js';
import { readMilestones, updateMilestone, upsertInferredMilestones, writeMilestones } from './storage/milestones.js';
import { readModules, upsertModules, writeModules } from './storage/modules.js';
import { readNextActions, writeNextActions } from './storage/nextActions.js';
import { appendNote, generateNoteId, readNotes } from './storage/notes.js';
import { appendProgress, readProgress } from './storage/progress.js';
import { getProjectSpecPath, readProjectSpec, writeProjectSpec } from './storage/projectSpec.js';
import { ensureBrainDir, getBrainDir, brainDirExists } from './storage/brainDir.js';
import { getRepoRootPath } from './storage/repoRoot.js';
import * as fs from 'fs';

export function createFsStorage(): StoragePort {
  return {
    ensureBrainDir,
    brainDirExists,
    getBrainDir,
    readManifest,
    writeManifest,
    buildFallbackManifest,
    manifestExists,
    getManifestPath,
    readProjectSpec,
    writeProjectSpec,
    getProjectSpecPath,
    readChange,
    writeChange,
    readAllChanges,
    changeExists,
    ensureChangesDir,
    generateChangeId,
    sanitizeChangeId,
    getChangePath,
    appendDecision,
    readDecisions,
    appendNote,
    readNotes,
    generateNoteId,
    appendProgress,
    readProgress,
    readMilestones,
    writeMilestones,
    updateMilestone,
    upsertInferredMilestones,
    readModules,
    writeModules,
    upsertModules,
    readNextActions,
    writeNextActions,
    getRepoRootPath,
    atomicWriteFile,
    fileExists(filePath: string): boolean {
      return fs.existsSync(filePath);
    },
    isFile(filePath: string): boolean {
      try {
        return fs.statSync(filePath).isFile();
      } catch {
        return false;
      }
    },
    readTextFile(filePath: string): string {
      return fs.readFileSync(filePath, 'utf-8');
    },
  };
}
