import { z } from 'zod';

export const stringArraySchema = z.array(z.string());
export const confidenceSchema = z.enum(['low', 'mid', 'high']);
export const changeStatusSchema = z.enum(['proposed', 'active', 'done', 'dropped']);
export const milestoneStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);
export const progressStatusSchema = z.enum(['planned', 'in_progress', 'blocked', 'done']);
export const decisionScopeSchema = z.enum(['project', 'change', 'module']);

export const defineProjectSpecPayloadSchema = z.object({
  product_goal: z.string(),
  non_goals: stringArraySchema.optional(),
  architecture_rules: stringArraySchema.optional(),
  coding_rules: stringArraySchema.optional(),
  agent_rules: stringArraySchema.optional(),
  source: z.string().optional(),
}).strict();

export const projectSpecMemoryPayloadSchema = z.object({
  product_goal: z.string(),
  non_goals: stringArraySchema.optional(),
  architecture_rules: stringArraySchema.optional(),
  coding_rules: stringArraySchema.optional(),
  agent_rules: stringArraySchema.optional(),
}).strict();

export const storedProjectSpecSchema = z.object({
  product_goal: z.string(),
  non_goals: stringArraySchema,
  architecture_rules: stringArraySchema,
  coding_rules: stringArraySchema,
  agent_rules: stringArraySchema,
  source: z.string(),
  updated_at: z.string(),
}).strict();

export const createChangePayloadSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  summary: z.string(),
  goals: stringArraySchema.optional(),
  non_goals: stringArraySchema.optional(),
  constraints: stringArraySchema.optional(),
  acceptance_criteria: stringArraySchema.optional(),
  affected_areas: stringArraySchema.optional(),
  module_ids: stringArraySchema.optional(),
  related_decision_ids: stringArraySchema.optional(),
  status: changeStatusSchema.optional(),
}).strict();

export const updateChangePatchSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  status: changeStatusSchema.optional(),
  goals: stringArraySchema.optional(),
  non_goals: stringArraySchema.optional(),
  constraints: stringArraySchema.optional(),
  acceptance_criteria: stringArraySchema.optional(),
  affected_areas: stringArraySchema.optional(),
  module_ids: stringArraySchema.optional(),
  related_decision_ids: stringArraySchema.optional(),
}).strict();

export const storedChangeSpecSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  status: changeStatusSchema,
  goals: stringArraySchema,
  non_goals: stringArraySchema,
  constraints: stringArraySchema,
  acceptance_criteria: stringArraySchema,
  affected_areas: stringArraySchema,
  module_ids: stringArraySchema.optional().default([]),
  related_decision_ids: stringArraySchema,
  created_at: z.string(),
  updated_at: z.string(),
}).strict();

export const decisionPayloadSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  decision: z.string(),
  rationale: z.string(),
  alternatives_considered: stringArraySchema.optional(),
  scope: decisionScopeSchema.optional(),
  related_change_id: z.string().optional(),
  module_ids: stringArraySchema.optional(),
  supersedes: z.string().optional(),
}).strict();

export const decisionMemoryPayloadSchema = z.object({
  title: z.string(),
  decision: z.string(),
  rationale: z.string(),
  alternatives_considered: stringArraySchema.optional(),
  scope: decisionScopeSchema.optional(),
  related_change_id: z.string().optional(),
  module_ids: stringArraySchema.optional(),
  supersedes: z.string().optional(),
}).strict();

export const storedDecisionSchema = z.object({
  id: z.string(),
  title: z.string(),
  decision: z.string(),
  rationale: z.string(),
  alternatives_considered: stringArraySchema,
  scope: decisionScopeSchema,
  related_change_id: z.string().optional(),
  module_ids: stringArraySchema.optional().default([]),
  supersedes: z.string().optional(),
  created_at: z.string(),
}).strict();

export const progressPayloadSchema = z.object({
  summary: z.string(),
  status: progressStatusSchema.optional(),
  blockers: stringArraySchema.optional(),
  related_change_id: z.string().optional(),
  module_ids: stringArraySchema.optional(),
  confidence: confidenceSchema,
}).strict();

export const storedProgressEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  summary: z.string(),
  status: progressStatusSchema.optional(),
  blockers: stringArraySchema.optional(),
  related_change_id: z.string().optional(),
  module_ids: stringArraySchema.optional().default([]),
  confidence: confidenceSchema,
}).strict();

export const milestonePayloadSchema = z.object({
  name: z.string(),
  status: milestoneStatusSchema,
  confidence: confidenceSchema.optional(),
  completion: confidenceSchema.optional(),
}).strict();

export const storedMilestoneSchema = z.object({
  name: z.string(),
  status: milestoneStatusSchema,
  confidence: confidenceSchema.optional(),
  completion: confidenceSchema.optional(),
  detected_at: z.string().optional(),
  last_updated: z.string().optional(),
}).strict();

export const notePayloadSchema = z.object({
  note: z.string(),
  tags: stringArraySchema.optional(),
  related_change_id: z.string().optional(),
  module_ids: stringArraySchema.optional(),
}).strict();

export const storedNoteSchema = z.object({
  id: z.string(),
  time: z.string(),
  tags: stringArraySchema,
  note: z.string(),
  related_change_id: z.string().optional(),
  module_ids: stringArraySchema.optional().default([]),
}).strict();

export const storedModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  aliases: stringArraySchema,
  key_paths: stringArraySchema,
  created_at: z.string(),
  updated_at: z.string(),
  last_used_at: z.string(),
}).strict();

export const storedNextActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority_score: z.number(),
  reasoning: z.string(),
  impact: z.number(),
  effort: z.number(),
  confidence: confidenceSchema,
  related_milestone: z.string().optional(),
  blocking_issues: stringArraySchema.optional(),
  suggested_by: z.string(),
  created_at: z.string(),
}).strict();
