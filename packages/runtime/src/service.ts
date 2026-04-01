import {
  readAllChanges,
  readChange,
  readDecisions,
  readManifest,
  readMilestones,
  readNotes,
  readProgress,
  readProjectSpec,
  type ChangeSpec,
  type Decision,
  type Manifest,
  type Milestone,
  type Note,
  type ProgressEntry,
  type ProjectSpec,
} from '@myczh/project-brain/core-protocol/storage';
import {
  captureNote as projectCaptureNote,
  checkpointWork,
  createChange,
  defineProjectSpec,
  ingestMemory,
  initializeProject as projectInit,
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
} from '@myczh/project-brain/application/commands';

export interface RuntimeStateSnapshot {
  manifest: Manifest | null;
  project_spec: ProjectSpec | null;
  changes: ChangeSpec[];
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

export function createRuntimeService(): RuntimeService {
  return {
    initializeProject: projectInit,
    defineProjectSpec,
    createChange,
    updateChange,
    logDecision,
    captureNote: projectCaptureNote,
    recordProgress,
    startWork,
    checkpointWork,
    ingestMemory,
    getManifest: readManifest,
    getProjectSpec: readProjectSpec,
    getChange: readChange,
    listChanges: readAllChanges,
    listDecisions: readDecisions,
    listNotes: readNotes,
    listProgress: readProgress,
    listMilestones: readMilestones,
    getState(repoPath) {
      return {
        manifest: readManifest(repoPath),
        project_spec: readProjectSpec(repoPath),
        changes: readAllChanges(repoPath),
        decisions: readDecisions(repoPath),
        notes: readNotes(repoPath),
        progress: readProgress(repoPath),
        milestones: readMilestones(repoPath),
      };
    },
  };
}
