import type {
  CaptureNoteInput,
  CaptureNoteOutput,
  ChangeSpec,
  CheckpointWorkInput,
  CheckpointWorkOutput,
  CreateChangeInput,
  CreateChangeOutput,
  Decision,
  DefineProjectSpecInput,
  DefineProjectSpecOutput,
  IngestMemoryInput,
  IngestMemoryOutput,
  LogDecisionInput,
  LogDecisionOutput,
  Manifest,
  Milestone,
  Note,
  ProgressEntry,
  ProjectInitInput,
  ProjectInitOutput,
  ProjectSpec,
  RecordProgressInput,
  RecordProgressOutput,
  StartWorkInput,
  StartWorkOutput,
  UpdateChangeInput,
  UpdateChangeOutput,
} from '@myczh/project-brain/protocol/runtime';
import type { RuntimeStateSnapshot } from './service.js';

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
  | { type: 'get_manifest'; repo_path?: string }
  | { type: 'get_project_spec'; repo_path?: string }
  | { type: 'get_change'; change_id: string; repo_path?: string }
  | { type: 'list_changes'; repo_path?: string }
  | { type: 'list_decisions'; repo_path?: string }
  | { type: 'list_notes'; repo_path?: string }
  | { type: 'list_progress'; repo_path?: string }
  | { type: 'list_milestones'; repo_path?: string }
  | { type: 'get_state'; repo_path?: string };

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
