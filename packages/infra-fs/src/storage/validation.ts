import { z } from 'zod';
import {
  confidenceSchema,
  storedProjectSpecSchema as projectSpecSchema,
  storedChangeSpecSchema as changeSpecSchema,
  storedDecisionSchema as decisionSchema,
  storedNoteSchema as noteSchema,
  storedProgressEntrySchema as progressEntrySchema,
  storedMilestoneSchema as milestoneSchema,
  storedModuleSchema as moduleSchema,
  storedNextActionSchema as nextActionSchema,
} from '@myczh/project-brain/protocol';

export {
  confidenceSchema,
  projectSpecSchema,
  changeSpecSchema,
  decisionSchema,
  noteSchema,
  progressEntrySchema,
  milestoneSchema,
  moduleSchema,
  nextActionSchema,
};

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

export const legacyDecisionSchema = z.object({
  decision: z.string(),
  reason: z.string(),
  date: z.string(),
});

export const legacyProgressEntrySchema = z.object({
  date: z.string(),
  summary: z.string(),
  confidence: confidenceSchema,
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
