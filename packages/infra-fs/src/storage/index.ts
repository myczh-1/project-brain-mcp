export type {
  ChangeSpec,
  ChangeStatus,
  Decision,
  Manifest,
  Milestone,
  ModuleRecord,
  NextAction,
  Note,
  ProgressEntry,
  ProjectSpec,
} from '@myczh/project-brain/core';

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

export { appendDecision, readDecisions } from './decisions.js';

export { atomicWriteFile } from './fileOps.js';

export { buildFallbackManifest, getManifestPath, manifestExists, readManifest, writeManifest } from './manifest.js';

export { readMilestones, updateMilestone, upsertInferredMilestones, writeMilestones } from './milestones.js';

export { readModules, upsertModules, writeModules } from './modules.js';

export { readNextActions, writeNextActions } from './nextActions.js';

export { appendNote, generateNoteId, readNotes } from './notes.js';

export { appendProgress, readProgress } from './progress.js';

export { getProjectSpecPath, readProjectSpec, writeProjectSpec } from './projectSpec.js';

export { ensureBrainDir, getBrainDir } from './brainDir.js';
export { getRepoRootPath } from './repoRoot.js';
