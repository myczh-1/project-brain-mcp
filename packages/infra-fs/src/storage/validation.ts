import { z } from 'zod';

const confidenceSchema = z.enum(['low', 'mid', 'high']);

export const manifestFileSchema = z.object({
  project_name: z.string().optional(),
  summary: z.string().optional(),
  repo_type: z.string().optional(),
  primary_stack: z.array(z.string()).optional(),
  long_term_goal: z.string().optional(),
  locale: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  one_liner: z.string().optional(),
  goals: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
});

export const projectSpecSchema = z.object({
  product_goal: z.string(),
  non_goals: z.array(z.string()),
  architecture_rules: z.array(z.string()),
  coding_rules: z.array(z.string()),
  agent_rules: z.array(z.string()),
  source: z.string(),
  updated_at: z.string(),
});

export const changeSpecSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  status: z.enum(['proposed', 'active', 'done', 'dropped']),
  goals: z.array(z.string()),
  non_goals: z.array(z.string()),
  constraints: z.array(z.string()),
  acceptance_criteria: z.array(z.string()),
  affected_areas: z.array(z.string()),
  module_ids: z.array(z.string()).optional().default([]),
  related_decision_ids: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

export const moduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  aliases: z.array(z.string()),
  key_paths: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
  last_used_at: z.string(),
});

export const decisionSchema = z.object({
  id: z.string(),
  title: z.string(),
  decision: z.string(),
  rationale: z.string(),
  alternatives_considered: z.array(z.string()),
  scope: z.enum(['project', 'change', 'module']),
  related_change_id: z.string().optional(),
  module_ids: z.array(z.string()).optional().default([]),
  supersedes: z.string().optional(),
  created_at: z.string(),
});

export const legacyDecisionSchema = z.object({
  decision: z.string(),
  reason: z.string(),
  date: z.string(),
});

export const noteSchema = z.object({
  id: z.string(),
  time: z.string(),
  tags: z.array(z.string()),
  note: z.string(),
  related_change_id: z.string().optional(),
  module_ids: z.array(z.string()).optional().default([]),
});

export const progressEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  summary: z.string(),
  status: z.enum(['planned', 'in_progress', 'blocked', 'done']).optional(),
  blockers: z.array(z.string()).optional(),
  related_change_id: z.string().optional(),
  module_ids: z.array(z.string()).optional().default([]),
  confidence: confidenceSchema,
});

export const legacyProgressEntrySchema = z.object({
  date: z.string(),
  summary: z.string(),
  confidence: confidenceSchema,
});

export const milestoneSchema = z.object({
  name: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  confidence: confidenceSchema.optional(),
  completion: confidenceSchema.optional(),
  detected_at: z.string().optional(),
  last_updated: z.string().optional(),
});

export const nextActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority_score: z.number(),
  reasoning: z.string(),
  impact: z.number(),
  effort: z.number(),
  confidence: confidenceSchema,
  related_milestone: z.string().optional(),
  blocking_issues: z.array(z.string()).optional(),
  suggested_by: z.string(),
  created_at: z.string(),
});

function formatZodIssues(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
  return `${path}: ${issue.message}`;
}

export function parseJsonText<T>(content: string, filePath: string, schema: z.ZodType<T>, label: string): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${label} JSON in ${filePath}: ${message}`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid ${label} data in ${filePath}: ${formatZodIssues(result.error)}`);
  }

  return result.data;
}

export function parseNdjsonText<T>(content: string, filePath: string, schema: z.ZodType<T>, label: string): T[] {
  const lines = content.trim().split('\n').filter(line => line.trim());
  const parsed: T[] = [];

  for (const [index, line] of lines.entries()) {
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid ${label} JSON on line ${index + 1} in ${filePath}: ${message}`);
    }

    const result = schema.safeParse(value);
    if (!result.success) {
      throw new Error(
        `Invalid ${label} data on line ${index + 1} in ${filePath}: ${formatZodIssues(result.error)}`
      );
    }

    parsed.push(result.data);
  }

  return parsed;
}
