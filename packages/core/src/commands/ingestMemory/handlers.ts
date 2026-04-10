import { createChange } from '../createChange.js';
import { defineProjectSpec } from '../defineProjectSpec.js';
import { logDecision } from '../logDecision.js';
import { projectCaptureNote } from '../captureNote.js';
import { recordProgress } from '../recordProgress.js';
import {
  asStringArray,
  asTrimmedString,
  looksLikeDecision,
  type ChangeSpecPayload,
  type DecisionPayload,
  type MemoryHandler,
  type MemoryType,
  type NotePayload,
  type ProgressPayload,
  type ProjectSpecPayload,
  validateRequiredString,
  validateSharedPayload,
} from './shared.js';

export function createMemoryHandlers(): Record<MemoryType, MemoryHandler> {
  return {
    project_spec: {
      validate(payload) {
        return validateRequiredString(payload, 'project_spec.payload.product_goal', (payload as ProjectSpecPayload).product_goal);
      },
      warnings() {
        return [];
      },
      async execute({ cwd, payload, source, storage }) {
        if (storage.readProjectSpec(cwd)) {
          return {
            status: 'rejected',
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
        }, storage);

        return {
          status: 'ok',
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
      async execute({ cwd, payload, storage }) {
        const changePayload = payload as ChangeSpecPayload;
        if (changePayload.id && storage.changeExists(changePayload.id, cwd)) {
          return {
            status: 'rejected',
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
            module_ids: asStringArray(changePayload.module_ids),
            related_decision_ids: asStringArray(changePayload.related_decision_ids),
            status: changePayload.status,
          },
        }, storage);

        return {
          status: 'ok',
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
      async execute({ cwd, payload, storage }) {
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
            module_ids: asStringArray(decisionPayload.module_ids),
            supersedes: asTrimmedString(decisionPayload.supersedes) || undefined,
          },
        }, storage);

        return {
          status: 'ok',
          routed_to: 'brain_log_decision',
          created_id: result.decision.id,
          message: 'Decision ingested successfully.',
        };
      },
    },
    note: {
      validate(payload) {
        return validateRequiredString(payload, 'note.payload.note', (payload as NotePayload).note);
      },
      warnings(payload) {
        const notePayload = payload as NotePayload;
        if (looksLikeDecision(notePayload.note)) {
          return ['Note content looks like a decision. Consider ingesting it as type="decision".'];
        }
        return [];
      },
      async execute({ cwd, payload, storage }) {
        const notePayload = payload as NotePayload;
        const result = await projectCaptureNote({
          repo_path: cwd,
          note: asTrimmedString(notePayload.note),
          tags: asStringArray(notePayload.tags),
          related_change_id: asTrimmedString(notePayload.related_change_id) || undefined,
          module_ids: asStringArray(notePayload.module_ids),
        }, storage);

        return {
          status: 'ok',
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
      async execute({ cwd, payload, storage }) {
        const progressPayload = payload as ProgressPayload;
        const result = await recordProgress({
          repo_path: cwd,
          type: 'progress',
          progress: {
            summary: asTrimmedString(progressPayload.summary),
            status: progressPayload.status,
            blockers: asStringArray(progressPayload.blockers),
            related_change_id: asTrimmedString(progressPayload.related_change_id) || undefined,
            module_ids: asStringArray(progressPayload.module_ids),
            confidence: progressPayload.confidence,
          },
        }, storage);

        return {
          status: 'ok',
          routed_to: 'brain_record_progress',
          created_id: result.progress_id,
          message: `Progress ingested successfully as ${result.recorded_type}.`,
        };
      },
    },
  };
}
