export {
  changeExists,
  ensureChangesDir,
  generateChangeId,
  getChangePath,
  readAllChanges,
  readChange,
  sanitizeChangeId,
  writeChange,
} from './changes.js';
export type { ChangeSpec, ChangeStatus } from './changes.js';

export { appendDecision, readDecisions } from './decisions.js';
export type { Decision } from './decisions.js';

export { atomicWriteFile } from './fileOps.js';

export { buildFallbackManifest, getManifestPath, manifestExists, readManifest, writeManifest } from './manifest.js';
export type { Manifest } from './manifest.js';

export { readMilestones, updateMilestone, upsertInferredMilestones, writeMilestones } from './milestones.js';
export type { Milestone } from './milestones.js';

export { readModules, upsertModules, writeModules } from './modules.js';
export type { ModuleRecord } from './modules.js';

export { readNextActions, writeNextActions } from './nextActions.js';
export type { NextAction } from './nextActions.js';

export { appendNote, generateNoteId, readNotes } from './notes.js';
export type { Note } from './notes.js';

export { appendProgress, readProgress } from './progress.js';
export type { ProgressEntry } from './progress.js';

export { getProjectSpecPath, readProjectSpec, writeProjectSpec } from './projectSpec.js';
export type { ProjectSpec } from './projectSpec.js';

export { ensureBrainDir, getBrainDir } from './brainDir.js';
export { getRepoRootPath } from './repoRoot.js';
