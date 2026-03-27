import { createChange } from '../internal/createChange.js';
import { defineProjectSpec } from '../internal/defineProjectSpec.js';
import { logDecision } from '../internal/logDecision.js';
import { projectCaptureNote } from '../internal/captureNote.js';
import { recordProgress } from '../internal/recordProgress.js';
import { readProjectSpec } from '../../core/storage/projectSpec.js';
import { changeExists } from '../../core/storage/changes.js';

type MemoryType = 'project_spec' | 'change_spec' | 'decision' | 'note' | 'progress';

interface ProjectSpecPayload {
  product_goal: string;
  non_goals?: string[];
  architecture_rules?: string[];
  coding_rules?: string[];
  agent_rules?: string[];
}

interface ChangeSpecPayload {
  id?: string;
  title: string;
  summary: string;
  goals?: string[];
  non_goals?: string[];
  constraints?: string[];
  acceptance_criteria?: string[];
  affected_areas?: string[];
  related_decision_ids?: string[];
  status?: 'proposed' | 'active' | 'done' | 'dropped';
}

interface DecisionPayload {
  title: string;
  decision: string;
  rationale: string;
  alternatives_considered?: string[];
  scope?: 'project' | 'change' | 'module';
  related_change_id?: string;
  supersedes?: string;
}

interface NotePayload {
  note: string;
  tags?: string[];
  related_change_id?: string;
}

interface ProgressPayload {
  summary: string;
  status?: 'planned' | 'in_progress' | 'blocked' | 'done';
  blockers?: string[];
  related_change_id?: string;
  confidence: 'low' | 'mid' | 'high';
}

type MemoryPayload =
  | ProjectSpecPayload
  | ChangeSpecPayload
  | DecisionPayload
  | NotePayload
  | ProgressPayload;

export interface IngestMemoryInput {
  repo_path?: string;
  memory: {
    type: MemoryType;
    payload: MemoryPayload;
    source?: string;
    confirmed_by_user?: boolean;
  };
}

export interface IngestMemoryOutput {
  status: 'ok' | 'rejected';
  recorded_type: MemoryType;
  routed_to?: string;
  created_id?: string;
  message: string;
  warnings?: string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : [];
}

function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(item => hasMeaningfulValue(item));
  if (isObject(value)) return Object.values(value).some(item => hasMeaningfulValue(item));
  return value !== undefined && value !== null;
}

function looksLikeDecision(text: string): boolean {
  const lower = text.toLowerCase();
  const signals = ['we decided', 'decision', 'choose', 'selected', 'adopt', 'use ', '改为', '决定', '选用'];
  return signals.some(signal => lower.includes(signal));
}

function validateConfirmed(input: IngestMemoryInput): string | null {
  if (input.memory.confirmed_by_user !== true) {
    return 'confirmed_by_user=true is required before ingesting memory.';
  }
  return null;
}

interface MemoryHandler {
  validate(payload: unknown): string | null;
  warnings(payload: unknown): string[];
  execute(args: {
    cwd: string;
    payload: unknown;
    source?: string;
    type: MemoryType;
  }): Promise<Omit<IngestMemoryOutput, 'recorded_type' | 'warnings'>>;
}

function validateSharedPayload(payload: unknown): string | null {
  if (!isObject(payload)) {
    return 'payload must be an object.';
  }
  if (!hasMeaningfulValue(payload)) {
    return 'payload must contain at least one meaningful value.';
  }

  return null;
}

const MEMORY_HANDLERS: Record<MemoryType, MemoryHandler> = {
  project_spec: {
    validate(payload) {
      const sharedError = validateSharedPayload(payload);
      if (sharedError) {
        return sharedError;
      }
      return asTrimmedString((payload as ProjectSpecPayload).product_goal)
        ? null
        : 'project_spec.payload.product_goal is required.';
    },
    warnings() {
      return [];
    },
    async execute({ cwd, payload, source, type }) {
      if (readProjectSpec(cwd)) {
        return {
          status: 'rejected',
          recorded_type: type,
          message: 'project-spec already exists. Use brain_define_project_spec for explicit updates.',
        };
      }

      const projectSpecPayload = payload as ProjectSpecPayload;
      const result = await defineProjectSpec({
        repo_path: cwd,
        spec: {
          product_goal: asTrimmedString(projectSpecPayload.product_goal),
          non_goals: asStringArray(projectSpecPayload.non_goals),
          architecture_rules: asStringArray(projectSpecPayload.architecture_rules),
          coding_rules: asStringArray(projectSpecPayload.coding_rules),
          agent_rules: asStringArray(projectSpecPayload.agent_rules),
          source: asTrimmedString(source) || 'gpt_structured_output',
        },
      });

      return {
        status: 'ok',
        recorded_type: type,
        routed_to: 'brain_define_project_spec',
        message: 'Project spec ingested successfully.',
        created_id: result.project_spec_path,
      };
    },
  },
  change_spec: {
    validate(payload) {
      const sharedError = validateSharedPayload(payload);
      if (sharedError) {
        return sharedError;
      }
      const changePayload = payload as ChangeSpecPayload;
      if (!asTrimmedString(changePayload.title)) {
        return 'change_spec.payload.title is required.';
      }
      if (!asTrimmedString(changePayload.summary)) {
        return 'change_spec.payload.summary is required.';
      }
      return null;
    },
    warnings() {
      return [];
    },
    async execute({ cwd, payload, type }) {
      const changePayload = payload as ChangeSpecPayload;
      if (changePayload.id && changeExists(changePayload.id, cwd)) {
        return {
          status: 'rejected',
          recorded_type: type,
          message: `Change already exists: ${changePayload.id}. Use brain_update_change for explicit updates.`,
        };
      }

      const result = await createChange({
        repo_path: cwd,
        change: {
          id: asTrimmedString(changePayload.id) || undefined,
          title: asTrimmedString(changePayload.title),
          summary: asTrimmedString(changePayload.summary),
          goals: asStringArray(changePayload.goals),
          non_goals: asStringArray(changePayload.non_goals),
          constraints: asStringArray(changePayload.constraints),
          acceptance_criteria: asStringArray(changePayload.acceptance_criteria),
          affected_areas: asStringArray(changePayload.affected_areas),
          related_decision_ids: asStringArray(changePayload.related_decision_ids),
          status: changePayload.status,
        },
      });

      return {
        status: 'ok',
        recorded_type: type,
        routed_to: 'brain_create_change',
        created_id: result.change.id,
        message: 'Change spec ingested successfully.',
      };
    },
  },
  decision: {
    validate(payload) {
      const sharedError = validateSharedPayload(payload);
      if (sharedError) {
        return sharedError;
      }
      const decisionPayload = payload as DecisionPayload;
      if (!asTrimmedString(decisionPayload.title)) {
        return 'decision.payload.title is required.';
      }
      if (!asTrimmedString(decisionPayload.decision)) {
        return 'decision.payload.decision is required.';
      }
      if (!asTrimmedString(decisionPayload.rationale)) {
        return 'decision.payload.rationale is required.';
      }
      return null;
    },
    warnings() {
      return [];
    },
    async execute({ cwd, payload, type }) {
      const decisionPayload = payload as DecisionPayload;
      const result = await logDecision({
        repo_path: cwd,
        decision: {
          title: asTrimmedString(decisionPayload.title),
          decision: asTrimmedString(decisionPayload.decision),
          rationale: asTrimmedString(decisionPayload.rationale),
          alternatives_considered: asStringArray(decisionPayload.alternatives_considered),
          scope: decisionPayload.scope,
          related_change_id: asTrimmedString(decisionPayload.related_change_id) || undefined,
          supersedes: asTrimmedString(decisionPayload.supersedes) || undefined,
        },
      });

      return {
        status: 'ok',
        recorded_type: type,
        routed_to: 'brain_log_decision',
        created_id: result.decision.id,
        message: 'Decision ingested successfully.',
      };
    },
  },
  note: {
    validate(payload) {
      const sharedError = validateSharedPayload(payload);
      if (sharedError) {
        return sharedError;
      }
      return asTrimmedString((payload as NotePayload).note)
        ? null
        : 'note.payload.note is required.';
    },
    warnings(payload) {
      const notePayload = payload as NotePayload;
      if (looksLikeDecision(notePayload.note)) {
        return ['Note content looks like a decision. Consider ingesting it as type="decision".'];
      }
      return [];
    },
    async execute({ cwd, payload, type }) {
      const notePayload = payload as NotePayload;
      const result = await projectCaptureNote({
        repo_path: cwd,
        note: asTrimmedString(notePayload.note),
        tags: asStringArray(notePayload.tags),
        related_change_id: asTrimmedString(notePayload.related_change_id) || undefined,
      });

      return {
        status: 'ok',
        recorded_type: type,
        routed_to: 'brain_capture_note',
        created_id: result.note_id,
        message: 'Note ingested successfully.',
      };
    },
  },
  progress: {
    validate(payload) {
      const sharedError = validateSharedPayload(payload);
      if (sharedError) {
        return sharedError;
      }
      const progressPayload = payload as ProgressPayload;
      if (!asTrimmedString(progressPayload.summary)) {
        return 'progress.payload.summary is required.';
      }
      if (!asTrimmedString(progressPayload.confidence)) {
        return 'progress.payload.confidence is required.';
      }
      return null;
    },
    warnings(payload) {
      const progressPayload = payload as ProgressPayload;
      if (!progressPayload.related_change_id) {
        return ['Progress was recorded without related_change_id.'];
      }
      return [];
    },
    async execute({ cwd, payload, type }) {
      const progressPayload = payload as ProgressPayload;
      const result = await recordProgress({
        repo_path: cwd,
        type: 'progress',
        progress: {
          summary: asTrimmedString(progressPayload.summary),
          status: progressPayload.status,
          blockers: asStringArray(progressPayload.blockers),
          related_change_id: asTrimmedString(progressPayload.related_change_id) || undefined,
          confidence: progressPayload.confidence,
        },
      });

      return {
        status: 'ok',
        recorded_type: type,
        routed_to: 'brain_record_progress',
        created_id: result.progress_id,
        message: `Progress ingested successfully as ${result.recorded_type}.`,
      };
    },
  },
};

export async function ingestMemory(input: IngestMemoryInput): Promise<IngestMemoryOutput> {
  const cwd = input.repo_path || process.cwd();
  const type = input.memory.type;
  const payload = input.memory.payload;
  const handler = MEMORY_HANDLERS[type as keyof typeof MEMORY_HANDLERS];

  if (!handler) {
    return {
      status: 'rejected',
      recorded_type: type,
      message: 'Unsupported memory type.',
    };
  }

  const confirmError = validateConfirmed(input);
  if (confirmError) {
    return {
      status: 'rejected',
      recorded_type: type,
      message: confirmError,
    };
  }

  const validationError = handler.validate(payload);
  if (validationError) {
    return {
      status: 'rejected',
      recorded_type: type,
      message: validationError,
    };
  }

  const warnings = handler.warnings(payload);
  const result = await handler.execute({
    cwd,
    payload,
    source: input.memory.source,
    type,
  });

  return {
    ...result,
    recorded_type: type,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
