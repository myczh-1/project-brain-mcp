import { z } from 'zod';
import {
  stringArraySchema,
  defineProjectSpecPayloadSchema,
  projectSpecMemoryPayloadSchema,
  createChangePayloadSchema,
  updateChangePatchSchema,
  decisionPayloadSchema,
  decisionMemoryPayloadSchema,
  progressPayloadSchema,
  milestonePayloadSchema,
  notePayloadSchema,
} from '@myczh/project-brain/protocol';

const retrievalEntrypointSchema = z.enum(['standard', 'investigation']);
const budgetModeSchema = z.enum(['tiny', 'normal', 'deep', 'investigation']);
const runtimeRepoPathSchema = z.object({
  repo_path: z.string(),
});

const projectAnswersSchema = z.object({
  project_name: z.string().optional(),
  summary: z.string().optional(),
  repo_type: z.string().optional(),
  primary_stack: stringArraySchema.optional(),
  long_term_goal: z.string().optional(),
  one_liner: z.string().optional(),
  tech_stack: stringArraySchema.optional(),
  goals: stringArraySchema.optional(),
}).strict();

const projectSpecInputSchema = defineProjectSpecPayloadSchema;
const changeSpecMemoryPayloadSchema = createChangePayloadSchema;
const progressMemoryPayloadSchema = progressPayloadSchema;

const ingestMemorySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('project_spec'),
    payload: projectSpecMemoryPayloadSchema,
    source: z.string().optional(),
    confirmed_by_user: z.boolean().optional(),
  }).strict(),
  z.object({
    type: z.literal('change_spec'),
    payload: changeSpecMemoryPayloadSchema,
    source: z.string().optional(),
    confirmed_by_user: z.boolean().optional(),
  }).strict(),
  z.object({
    type: z.literal('decision'),
    payload: decisionMemoryPayloadSchema,
    source: z.string().optional(),
    confirmed_by_user: z.boolean().optional(),
  }).strict(),
  z.object({
    type: z.literal('note'),
    payload: notePayloadSchema,
    source: z.string().optional(),
    confirmed_by_user: z.boolean().optional(),
  }).strict(),
  z.object({
    type: z.literal('progress'),
    payload: progressMemoryPayloadSchema,
    source: z.string().optional(),
    confirmed_by_user: z.boolean().optional(),
  }).strict(),
]);

const recordProgressInputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('progress'),
    repo_path: z.string(),
    progress: progressPayloadSchema,
  }).strict(),
  z.object({
    type: z.literal('milestone'),
    repo_path: z.string(),
    milestone: milestonePayloadSchema,
  }).strict(),
]);

export const runtimeInputSchemas = {
  initialize_project: runtimeRepoPathSchema.extend({ answers: projectAnswersSchema.optional() }).strict(),
  define_project_spec: runtimeRepoPathSchema.extend({ spec: projectSpecInputSchema }).strict(),
  create_change: runtimeRepoPathSchema.extend({ change: createChangePayloadSchema }).strict(),
  update_change: runtimeRepoPathSchema.extend({ change_id: z.string(), patch: updateChangePatchSchema }).strict(),
  log_decision: runtimeRepoPathSchema.extend({ decision: decisionPayloadSchema }).strict(),
  capture_note: runtimeRepoPathSchema.extend({
    note: z.string(),
    tags: stringArraySchema.optional(),
    related_change_id: z.string().optional(),
    module_ids: stringArraySchema.optional(),
  }).strict(),
  record_progress: recordProgressInputSchema,
  start_work: runtimeRepoPathSchema.extend({
    change_id: z.string().optional(),
    create_change: createChangePayloadSchema.optional(),
    initial_progress: progressPayloadSchema.optional(),
  }).strict(),
  checkpoint_work: runtimeRepoPathSchema.extend({
    change_id: z.string(),
    change_patch: updateChangePatchSchema.optional(),
    progress: progressPayloadSchema.optional(),
    note: z.object({ note: z.string(), tags: stringArraySchema.optional() }).strict().optional(),
  }).strict(),
  ingest_memory: runtimeRepoPathSchema.extend({
    memory: ingestMemorySchema,
  }).strict(),
  finish_work: runtimeRepoPathSchema.extend({
    change_id: z.string(),
    final_status: z.enum(['done', 'dropped']).optional(),
    summary_patch: updateChangePatchSchema.optional(),
    final_progress: progressPayloadSchema.optional(),
    note: z.object({ note: z.string(), tags: stringArraySchema.optional() }).strict().optional(),
    reflection: z.object({ recent_commits: z.number().int().positive().optional(), next_action_limit: z.number().int().positive().optional() }).strict().optional(),
  }).strict(),
  get_dashboard: runtimeRepoPathSchema.extend({
    include_deep_analysis: z.boolean().optional(),
    recent_commits: z.number().int().positive().optional(),
  }).strict(),
  get_project_context: runtimeRepoPathSchema.strict(),
  get_change_context: runtimeRepoPathSchema.extend({
    change_id: z.string(),
    recent_commits: z.number().int().positive().optional(),
    retrieval_entrypoint: retrievalEntrypointSchema.optional(),
    task: z.string().optional(),
  }).strict(),
  list_modules: runtimeRepoPathSchema.extend({ limit: z.number().int().positive().optional() }).strict(),
  get_module_context: runtimeRepoPathSchema.extend({
    module_id: z.string(),
    recent_commits: z.number().int().positive().optional(),
  }).strict(),
  get_context_budget_plan: runtimeRepoPathSchema.extend({
    task: z.string(),
    change_id: z.string().optional(),
    budget_mode: budgetModeSchema.optional(),
    retrieval_entrypoint: retrievalEntrypointSchema.optional(),
  }).strict(),
  get_recent_activity: runtimeRepoPathSchema.extend({
    limit: z.number().int().positive().optional(),
    since_days: z.number().int().positive().optional(),
  }).strict(),
  analyze: runtimeRepoPathSchema.extend({
    depth: z.enum(['quick', 'full']).optional(),
    recent_commits: z.number().int().positive().optional(),
  }).strict(),
} as const;

export const getStateSchema = z.object({
  type: z.literal('get_state'),
  repo_path: z.string().optional().default(''),
}).strict();
