import {
  checkpointWork,
  createChange,
  defineProjectSpec,
  ingestMemory,
  logDecision,
  projectCaptureNote,
  projectInit,
  recordProgress,
  startWork,
  updateChange,
  type CaptureNoteInput,
  type CaptureNoteOutput,
  type ChangeSpec,
  type CheckpointWorkInput,
  type CheckpointWorkOutput,
  type CreateChangeInput,
  type CreateChangeOutput,
  type Decision,
  type DefineProjectSpecInput,
  type DefineProjectSpecOutput,
  type IngestMemoryInput,
  type IngestMemoryOutput,
  type LogDecisionInput,
  type LogDecisionOutput,
  type Manifest,
  type Milestone,
  type Note,
  type ProgressEntry,
  type ProjectInitInput,
  type ProjectInitOutput,
  type ProjectSpec,
  type RecordProgressInput,
  type RecordProgressOutput,
  type StartWorkInput,
  type StartWorkOutput,
  type StoragePort,
  type UpdateChangeInput,
  type UpdateChangeOutput,
} from '@myczh/project-brain/core';
import { createFsStorage } from '@myczh/project-brain/infra-fs';

export interface RuntimeStateSnapshot {
  manifest: Manifest | null;
  project_spec: ProjectSpec | null;
  changes: ChangeSpec[];
  decisions: Decision[];
  notes: Note[];
  progress: ProgressEntry[];
  milestones: Milestone[];
}

export type RuntimeCommand =
  | { type: 'initialize_project'; input: ProjectInitInput }
  | { type: 'define_project_spec'; input: DefineProjectSpecInput }
  | { type: 'create_change'; input: CreateChangeInput }
  | { type: 'update_change'; input: UpdateChangeInput }
  | { type: 'log_decision'; input: LogDecisionInput }
  | { type: 'capture_note'; input: CaptureNoteInput }
  | { type: 'record_progress'; input: RecordProgressInput }
  | { type: 'start_work'; input: StartWorkInput }
  | { type: 'checkpoint_work'; input: CheckpointWorkInput }
  | { type: 'ingest_memory'; input: IngestMemoryInput };

export type RuntimeQuery =
  | { type: 'get_manifest'; repo_path: string }
  | { type: 'get_project_spec'; repo_path: string }
  | { type: 'get_change'; change_id: string; repo_path: string }
  | { type: 'list_changes'; repo_path: string }
  | { type: 'list_decisions'; repo_path: string }
  | { type: 'list_notes'; repo_path: string }
  | { type: 'list_progress'; repo_path: string }
  | { type: 'list_milestones'; repo_path: string }
  | { type: 'get_state'; repo_path: string };

export type RuntimeMessage = RuntimeCommand | RuntimeQuery;

export type RuntimeCommandResult =
  | ProjectInitOutput
  | DefineProjectSpecOutput
  | CreateChangeOutput
  | UpdateChangeOutput
  | LogDecisionOutput
  | CaptureNoteOutput
  | RecordProgressOutput
  | StartWorkOutput
  | CheckpointWorkOutput
  | IngestMemoryOutput;

export type RuntimeQueryResult =
  | Manifest
  | ProjectSpec
  | ChangeSpec
  | Decision[]
  | Note[]
  | ProgressEntry[]
  | Milestone[]
  | ChangeSpec[]
  | RuntimeStateSnapshot
  | null;

export type RuntimeMessageResult = RuntimeCommandResult | RuntimeQueryResult;

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

export interface EmbeddedMode {
  handle(message: RuntimeMessage): Promise<RuntimeMessageResult>;
  write(message: RuntimeCommand): Promise<RuntimeCommandResult>;
  read(message: RuntimeQuery): Promise<RuntimeQueryResult>;
  service: RuntimeService;
}

export function createEmbeddedMode(defaultRepoPath?: string, storage: StoragePort = createFsStorage()): EmbeddedMode {
  const service = createEmbeddedService(storage);

  return {
    handle: (message) => handleMessage(message, service, defaultRepoPath),
    async write(message) {
      return handleMessage(message, service, defaultRepoPath) as Promise<RuntimeCommandResult>;
    },
    async read(message) {
      return handleMessage(message, service, defaultRepoPath) as Promise<RuntimeQueryResult>;
    },
    service,
  };
}

function createEmbeddedService(storage: StoragePort): RuntimeService {
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
        decisions: storage.readDecisions(repoPath),
        notes: storage.readNotes(repoPath),
        progress: storage.readProgress(repoPath),
        milestones: storage.readMilestones(repoPath),
      };
    },
  };
}

async function handleMessage(
  message: RuntimeMessage,
  service: RuntimeService,
  defaultRepoPath?: string
): Promise<RuntimeMessageResult> {
  switch (message.type) {
    case 'initialize_project':
      return service.initializeProject(withDefaultRepoPath(message.input, defaultRepoPath));
    case 'define_project_spec':
      return service.defineProjectSpec(withDefaultRepoPath(message.input, defaultRepoPath));
    case 'create_change':
      return service.createChange(withDefaultRepoPath(message.input, defaultRepoPath));
    case 'update_change':
      return service.updateChange(withDefaultRepoPath(message.input, defaultRepoPath));
    case 'log_decision':
      return service.logDecision(withDefaultRepoPath(message.input, defaultRepoPath));
    case 'capture_note':
      return service.captureNote(withDefaultRepoPath(message.input, defaultRepoPath));
    case 'record_progress':
      return service.recordProgress(withDefaultRepoPath(message.input, defaultRepoPath));
    case 'start_work':
      return service.startWork(withDefaultRepoPath(message.input, defaultRepoPath));
    case 'checkpoint_work':
      return service.checkpointWork(withDefaultRepoPath(message.input, defaultRepoPath));
    case 'ingest_memory':
      return service.ingestMemory(withDefaultRepoPath(message.input, defaultRepoPath));
    case 'get_manifest':
      return service.getManifest(message.repo_path);
    case 'get_project_spec':
      return service.getProjectSpec(message.repo_path);
    case 'get_change':
      return service.getChange(message.change_id, message.repo_path);
    case 'list_changes':
      return service.listChanges(message.repo_path);
    case 'list_decisions':
      return service.listDecisions(message.repo_path);
    case 'list_notes':
      return service.listNotes(message.repo_path);
    case 'list_progress':
      return service.listProgress(message.repo_path);
    case 'list_milestones':
      return service.listMilestones(message.repo_path);
    case 'get_state':
      return service.getState(message.repo_path);
    default:
      return assertNever(message);
  }
}

function withDefaultRepoPath<T extends { repo_path: string }>(input: T, defaultRepoPath?: string): T {
  return input.repo_path ? input : { ...input, repo_path: defaultRepoPath || process.cwd() };
}

function assertNever(value: never): never {
  throw new Error(`Unsupported runtime message: ${JSON.stringify(value)}`);
}
