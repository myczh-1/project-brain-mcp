import type { StoragePort, ChangeSpec, Decision, Manifest, Milestone, ModuleRecord, Note, ProgressEntry, ProjectSpec } from '../ports/storage.js';
import {
  projectCaptureNote,
  checkpointWork,
  createChange,
  defineProjectSpec,
  ingestMemory,
  projectInit,
  logDecision,
  recordProgress,
  startWork,
  updateChange,
  type CaptureNoteInput,
  type CaptureNoteOutput,
  type CheckpointWorkInput,
  type CheckpointWorkOutput,
  type CreateChangeInput,
  type CreateChangeOutput,
  type DefineProjectSpecInput,
  type DefineProjectSpecOutput,
  type IngestMemoryInput,
  type IngestMemoryOutput,
  type LogDecisionInput,
  type LogDecisionOutput,
  type ProjectInitInput,
  type ProjectInitOutput,
  type RecordProgressInput,
  type RecordProgressOutput,
  type StartWorkInput,
  type StartWorkOutput,
  type UpdateChangeInput,
  type UpdateChangeOutput,
} from '../commands/index.js';

export interface RuntimeStateSnapshot {
  manifest: Manifest | null;
  project_spec: ProjectSpec | null;
  changes: ChangeSpec[];
  modules: ModuleRecord[];
  decisions: Decision[];
  notes: Note[];
  progress: ProgressEntry[];
  milestones: Milestone[];
}

export interface RuntimeService {
  initializeProject(input: ProjectInitInput): Promise<ProjectInitOutput>;
  defineProjectSpec(input: DefineProjectSpecInput): Promise<DefineProjectSpecOutput>;
  createChange(input: CreateChangeInput): Promise<CreateChangeOutput>;
  updateChange(input: UpdateChangeInput): Promise<UpdateChangeOutput>;
  logDecision(input: LogDecisionInput): Promise<LogDecisionOutput>;
  captureNote(input: CaptureNoteInput): Promise<CaptureNoteOutput>;
  recordProgress(input: RecordProgressInput): Promise<RecordProgressOutput>;
  startWork(input: StartWorkInput): Promise<StartWorkOutput>;
  checkpointWork(input: CheckpointWorkInput): Promise<CheckpointWorkOutput>;
  ingestMemory(input: IngestMemoryInput): Promise<IngestMemoryOutput>;
  getManifest(repoPath?: string): Manifest | null;
  getProjectSpec(repoPath?: string): ProjectSpec | null;
  getChange(changeId: string, repoPath?: string): ChangeSpec | null;
  listChanges(repoPath?: string): ChangeSpec[];
  listDecisions(repoPath?: string): Decision[];
  listNotes(repoPath?: string): Note[];
  listProgress(repoPath?: string): ProgressEntry[];
  listMilestones(repoPath?: string): Milestone[];
  getState(repoPath?: string): RuntimeStateSnapshot;
}

export function createRuntimeService(storage: StoragePort): RuntimeService {
  return {
    initializeProject: (input) => projectInit(input, storage),
    defineProjectSpec: (input) => defineProjectSpec(input, storage),
    createChange: (input) => createChange(input, storage),
    updateChange: (input) => updateChange(input, storage),
    logDecision: (input) => logDecision(input, storage),
    captureNote: (input) => projectCaptureNote(input, storage),
    recordProgress: (input) => recordProgress(input, storage),
    startWork: (input) => startWork(input, storage),
    checkpointWork: (input) => checkpointWork(input, storage),
    ingestMemory: (input) => ingestMemory(input, storage),
    getManifest: (repoPath) => storage.readManifest(repoPath),
    getProjectSpec: (repoPath) => storage.readProjectSpec(repoPath),
    getChange: (changeId, repoPath) => storage.readChange(changeId, repoPath),
    listChanges: (repoPath) => storage.readAllChanges(repoPath),
    listDecisions: (repoPath) => storage.readDecisions(repoPath),
    listNotes: (repoPath) => storage.readNotes(repoPath),
    listProgress: (repoPath) => storage.readProgress(repoPath),
    listMilestones: (repoPath) => storage.readMilestones(repoPath),
    getState(repoPath) {
      return {
        manifest: storage.readManifest(repoPath),
        project_spec: storage.readProjectSpec(repoPath),
        changes: storage.readAllChanges(repoPath),
        modules: storage.readModules(repoPath),
        decisions: storage.readDecisions(repoPath),
        notes: storage.readNotes(repoPath),
        progress: storage.readProgress(repoPath),
        milestones: storage.readMilestones(repoPath),
      };
    },
  };
}
