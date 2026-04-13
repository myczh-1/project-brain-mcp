import { z } from 'zod';
import type {
  CaptureNoteInput,
  CaptureNoteOutput,
  CheckpointWorkInput,
  CheckpointWorkOutput,
  CreateChangeInput,
  CreateChangeOutput,
  DefineProjectSpecInput,
  DefineProjectSpecOutput,
  IngestMemoryInput,
  IngestMemoryOutput,
  LogDecisionInput,
  LogDecisionOutput,
  ProjectInitInput,
  ProjectInitOutput,
  RecordProgressInput,
  RecordProgressOutput,
  StartWorkInput,
  StartWorkOutput,
  UpdateChangeInput,
  UpdateChangeOutput,
} from '../commands/index.js';
import type {
  DashboardToolInput as QueryDashboardToolInput,
  DashboardToolOutput as QueryDashboardToolOutput,
  ProjectContextInput as QueryProjectContextInput,
  ProjectContextOutput as QueryProjectContextOutput,
  ChangeContextInput as QueryChangeContextInput,
  ChangeContextOutput as QueryChangeContextOutput,
  ListModulesInput as QueryListModulesInput,
  ListModulesOutput as QueryListModulesOutput,
  ModuleContextInput as QueryModuleContextInput,
  ModuleContextOutput as QueryModuleContextOutput,
  ContextBudgetPlanInput as QueryContextBudgetPlanInput,
  ContextBudgetPlanOutput as QueryContextBudgetPlanOutput,
  RecentActivityInput as QueryRecentActivityInput,
  RecentActivityOutput as QueryRecentActivityOutput,
  BrainAnalyzeInput as QueryBrainAnalyzeInput,
  BrainAnalyzeOutput as QueryBrainAnalyzeOutput,
  FinishWorkInput as QueryFinishWorkInput,
  FinishWorkOutput as QueryFinishWorkOutput,
} from '../queries/index.js';
import type { RuntimeStateSnapshot } from './service.js';
import { getStateSchema, runtimeInputSchemas } from './inputSchemas.js';

const runtimeInputMessageSchemas = [
  z.object({ type: z.literal('initialize_project'), input: runtimeInputSchemas.initialize_project }).strict(),
  z.object({ type: z.literal('define_project_spec'), input: runtimeInputSchemas.define_project_spec }).strict(),
  z.object({ type: z.literal('create_change'), input: runtimeInputSchemas.create_change }).strict(),
  z.object({ type: z.literal('update_change'), input: runtimeInputSchemas.update_change }).strict(),
  z.object({ type: z.literal('log_decision'), input: runtimeInputSchemas.log_decision }).strict(),
  z.object({ type: z.literal('capture_note'), input: runtimeInputSchemas.capture_note }).strict(),
  z.object({ type: z.literal('record_progress'), input: runtimeInputSchemas.record_progress }).strict(),
  z.object({ type: z.literal('start_work'), input: runtimeInputSchemas.start_work }).strict(),
  z.object({ type: z.literal('checkpoint_work'), input: runtimeInputSchemas.checkpoint_work }).strict(),
  z.object({ type: z.literal('ingest_memory'), input: runtimeInputSchemas.ingest_memory }).strict(),
  z.object({ type: z.literal('finish_work'), input: runtimeInputSchemas.finish_work }).strict(),
  z.object({ type: z.literal('get_dashboard'), input: runtimeInputSchemas.get_dashboard }).strict(),
  z.object({ type: z.literal('get_project_context'), input: runtimeInputSchemas.get_project_context }).strict(),
  z.object({ type: z.literal('get_change_context'), input: runtimeInputSchemas.get_change_context }).strict(),
  z.object({ type: z.literal('list_modules'), input: runtimeInputSchemas.list_modules }).strict(),
  z.object({ type: z.literal('get_module_context'), input: runtimeInputSchemas.get_module_context }).strict(),
  z.object({ type: z.literal('get_context_budget_plan'), input: runtimeInputSchemas.get_context_budget_plan }).strict(),
  z.object({ type: z.literal('get_recent_activity'), input: runtimeInputSchemas.get_recent_activity }).strict(),
  z.object({ type: z.literal('analyze'), input: runtimeInputSchemas.analyze }).strict(),
] as const;

const runtimeInputMessageSchema = z.union(runtimeInputMessageSchemas);

export const runtimeMessageSchema = z.union([runtimeInputMessageSchema, getStateSchema]);

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
  | { type: 'ingest_memory'; input: IngestMemoryInput }
  | { type: 'finish_work'; input: QueryFinishWorkInput };

export type RuntimeQuery =
  | { type: 'get_dashboard'; input: QueryDashboardToolInput }
  | { type: 'get_project_context'; input: QueryProjectContextInput }
  | { type: 'get_change_context'; input: QueryChangeContextInput }
  | { type: 'list_modules'; input: QueryListModulesInput }
  | { type: 'get_module_context'; input: QueryModuleContextInput }
  | { type: 'get_context_budget_plan'; input: QueryContextBudgetPlanInput }
  | { type: 'get_recent_activity'; input: QueryRecentActivityInput }
  | { type: 'analyze'; input: QueryBrainAnalyzeInput }
  | { type: 'get_state'; repo_path: string };

export type RuntimeMessage = RuntimeCommand | RuntimeQuery;
export type RuntimeResultFor<T extends RuntimeMessage> = T extends RuntimeCommand
  ? RuntimeCommandResult
  : T extends RuntimeQuery
  ? RuntimeQueryResult
  : never;

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
  | IngestMemoryOutput
  | QueryFinishWorkOutput;

export type RuntimeQueryResult =
  | QueryDashboardToolOutput
  | QueryProjectContextOutput
  | QueryChangeContextOutput
  | QueryListModulesOutput
  | QueryModuleContextOutput
  | QueryContextBudgetPlanOutput
  | QueryRecentActivityOutput
  | QueryBrainAnalyzeOutput
  | RuntimeStateSnapshot
  ;

export type RuntimeMessageResult = RuntimeCommandResult | RuntimeQueryResult;

export function parseRuntimeMessage(value: unknown): RuntimeMessage {
  return runtimeMessageSchema.parse(value);
}
