import { appendDecision, Decision } from '../../core/storage/decisions.js';

export interface LogDecisionInput {
  repo_path?: string;
  decision: {
    id?: string;
    title: string;
    decision: string;
    rationale: string;
    alternatives_considered?: string[];
    scope?: Decision['scope'];
    related_change_id?: string;
    supersedes?: string;
  };
}

export interface LogDecisionOutput {
  status: 'ok';
  decision: Decision;
}

function normalize(values?: string[]): string[] {
  return Array.isArray(values) ? values.map(v => v.trim()).filter(Boolean) : [];
}

function validateDecisionInput(title: string, decisionText: string, rationale: string): void {
  const combined = `${title} ${decisionText} ${rationale}`.toLowerCase();
  const weakSignals = ['todo', 'idea', 'maybe', 'think about', '进度', '完成了', 'todo:', 'note'];
  if (weakSignals.some(signal => combined.includes(signal))) {
    throw new Error('Decision must record a concrete choice with rationale, not a note, progress update, or tentative idea.');
  }
}

export async function logDecision(input: LogDecisionInput): Promise<LogDecisionOutput> {
  const cwd = input.repo_path || process.cwd();
  const title = input.decision.title.trim();
  const decisionText = input.decision.decision.trim();
  const rationale = input.decision.rationale.trim();

  validateDecisionInput(title, decisionText, rationale);

  const decision: Decision = {
    id: input.decision.id?.trim() || `decision-${Date.now()}`,
    title,
    decision: decisionText,
    rationale,
    alternatives_considered: normalize(input.decision.alternatives_considered),
    scope: input.decision.scope || (input.decision.related_change_id ? 'change' : 'project'),
    related_change_id: input.decision.related_change_id?.trim() || undefined,
    supersedes: input.decision.supersedes?.trim() || undefined,
    created_at: new Date().toISOString(),
  };

  appendDecision(decision, cwd);

  return {
    status: 'ok',
    decision,
  };
}
