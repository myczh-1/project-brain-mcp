import type { StoragePort } from '../../ports/storage.js';

export type MemoryType = 'project_spec' | 'change_spec' | 'decision' | 'note' | 'progress';

export interface ProjectSpecPayload {
  product_goal: string;
  non_goals?: string[];
  architecture_rules?: string[];
  coding_rules?: string[];
  agent_rules?: string[];
}

export interface ChangeSpecPayload {
  id?: string;
  title: string;
  summary: string;
  goals?: string[];
  non_goals?: string[];
  constraints?: string[];
  acceptance_criteria?: string[];
  affected_areas?: string[];
  module_ids?: string[];
  related_decision_ids?: string[];
  status?: 'proposed' | 'active' | 'done' | 'dropped';
}

export interface DecisionPayload {
  title: string;
  decision: string;
  rationale: string;
  alternatives_considered?: string[];
  scope?: 'project' | 'change' | 'module';
  related_change_id?: string;
  module_ids?: string[];
  supersedes?: string;
}

export interface NotePayload {
  note: string;
  tags?: string[];
  related_change_id?: string;
  module_ids?: string[];
}

export interface ProgressPayload {
  summary: string;
  status?: 'planned' | 'in_progress' | 'blocked' | 'done';
  blockers?: string[];
  related_change_id?: string;
  module_ids?: string[];
  confidence: 'low' | 'mid' | 'high';
}

export type MemoryPayload =
  | ProjectSpecPayload
  | ChangeSpecPayload
  | DecisionPayload
  | NotePayload
  | ProgressPayload;

export interface IngestMemoryHandlerResult {
  status: 'ok' | 'rejected';
  routed_to?: string;
  created_id?: string;
  message: string;
}

export interface MemoryHandler {
  validate(payload: unknown): string | null;
  warnings(payload: unknown): string[];
  execute(args: {
    cwd: string;
    payload: unknown;
    source?: string;
    type: MemoryType;
    storage: StoragePort;
  }): Promise<IngestMemoryHandlerResult>;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : [];
}

export function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(item => hasMeaningfulValue(item));
  if (isObject(value)) return Object.values(value).some(item => hasMeaningfulValue(item));
  return value !== undefined && value !== null;
}

export function looksLikeDecision(text: string): boolean {
  const lower = text.toLowerCase();
  const signals = ['we decided', 'decision', 'choose', 'selected', 'adopt', 'use ', '改为', '决定', '选用'];
  return signals.some(signal => lower.includes(signal));
}

export function validateSharedPayload(payload: unknown): string | null {
  if (!isObject(payload)) {
    return 'payload must be an object.';
  }
  if (!hasMeaningfulValue(payload)) {
    return 'payload must contain at least one meaningful value.';
  }

  return null;
}

export function validateRequiredString(payload: unknown, fieldName: string, fieldValue: unknown): string | null {
  const sharedError = validateSharedPayload(payload);
  if (sharedError) {
    return sharedError;
  }

  return asTrimmedString(fieldValue) ? null : `${fieldName} is required.`;
}
