import type { Decision, StoragePort } from '../ports/storage.js';

export interface LogDecisionInput {
  repo_path: string;
  decision: {
    id?: string;
    title: string;
    decision: string;
    rationale: string;
    alternatives_considered?: string[];
    scope?: Decision['scope'];
    related_change_id?: string;
    module_ids?: string[];
    supersedes?: string;
  };
}

export interface LogDecisionOutput {
  status: 'ok';
  decision: Decision;
  warnings?: string[];
}

function normalize(values?: string[]): string[] {
  return Array.isArray(values) ? values.map(v => v.trim()).filter(Boolean) : [];
}

function validateDecisionInput(title: string, decisionText: string, rationale: string): string[] {
  const combined = `${title} ${decisionText} ${rationale}`.toLowerCase();
  const weakSignals = ['todo', 'idea', 'maybe', 'think about', '进度', '完成了', 'todo:', 'note'];
  if (weakSignals.some(signal => combined.includes(signal))) {
    return ['Decision text contains weak signals (todo, idea, maybe, etc.). Consider using brain_capture_note or brain_record_progress instead.'];
  }
  return [];
}

export async function logDecision(input: LogDecisionInput, storage: StoragePort): Promise<LogDecisionOutput> {
  const cwd = input.repo_path;
  const title = input.decision.title.trim();
  const decisionText = input.decision.decision.trim();
  const rationale = input.decision.rationale.trim();

  const warnings = validateDecisionInput(title, decisionText, rationale);

  const decision: Decision = {
    id: input.decision.id?.trim() || `decision-${Date.now()}`,
    title,
    decision: decisionText,
    rationale,
    alternatives_considered: normalize(input.decision.alternatives_considered),
    scope: input.decision.scope || (input.decision.related_change_id ? 'change' : 'project'),
    related_change_id: input.decision.related_change_id?.trim() || undefined,
    module_ids: normalize(input.decision.module_ids),
    supersedes: input.decision.supersedes?.trim() || undefined,
    created_at: new Date().toISOString(),
  };

  storage.upsertModules(decision.module_ids, cwd);
  storage.appendDecision(decision, cwd);

  return {
    status: 'ok',
    decision,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
