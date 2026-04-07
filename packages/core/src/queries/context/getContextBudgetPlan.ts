import type { GitPort } from '../../ports/git.js';
import type { StoragePort } from '../../ports/storage.js';
import { evaluateRetrievalConfidence, type RetrievalEntrypoint } from '../../understanding/index.js';

export type BudgetMode = 'tiny' | 'normal' | 'deep' | 'investigation';

export interface ContextBudgetPlanInput {
  repo_path: string;
  task: string;
  change_id?: string;
  budget_mode?: BudgetMode;
  retrieval_entrypoint?: RetrievalEntrypoint;
}

export interface ContextBudgetPlanOutput {
  entrypoint: RetrievalEntrypoint;
  budget_mode: BudgetMode;
  confidence: 'low' | 'mid' | 'high';
  reason: string;
  suggested_fallback_entrypoint?: 'investigation';
  lightweight_workflow: Array<{
    step: number;
    action: string;
    budget_share: string;
    why: string;
  }>;
}

function resolveBudgetMode(input: ContextBudgetPlanInput): BudgetMode {
  if (input.budget_mode) return input.budget_mode;
  if (input.retrieval_entrypoint === 'investigation') return 'investigation';
  return 'normal';
}

function inferEntrypoint(task: string, preferred?: RetrievalEntrypoint): RetrievalEntrypoint {
  if (preferred) return preferred;
  const lowered = task.toLowerCase();
  if (
    lowered.includes('legacy') ||
    lowered.includes('regression') ||
    lowered.includes('古早') ||
    lowered.includes('历史') ||
    lowered.includes('兼容')
  ) {
    return 'investigation';
  }
  return 'standard';
}

function buildWorkflow(entrypoint: RetrievalEntrypoint, budgetMode: BudgetMode) {
  if (entrypoint === 'investigation') {
    return [
      { step: 1, action: 'read project overview + project spec', budget_share: '15%', why: 'Anchor global invariants before tracing history.' },
      { step: 2, action: 'scan cold memory (notes/decisions/progress/changes) with expanded terms', budget_share: '35%', why: 'Recover historical terms and prior assumptions.' },
      { step: 3, action: 'map historical hits to current modules and recent commits', budget_share: '30%', why: 'Bridge old evidence to current code reality.' },
      { step: 4, action: 'build change context and only then pull evidence snippets', budget_share: '20%', why: 'Keep evidence retrieval bounded and task-focused.' },
    ];
  }

  const evidenceShare = budgetMode === 'deep' ? '35%' : '25%';
  return [
    { step: 1, action: 'read project overview', budget_share: '15%', why: 'Start with stable project-level constraints.' },
    { step: 2, action: 'read one to two relevant modules', budget_share: '25%', why: 'Limit scope and avoid whole-repo noise.' },
    { step: 3, action: 'build change context', budget_share: '35%', why: 'Assemble task-scoped decisions, progress, and risks.' },
    { step: 4, action: 'pull evidence pack on demand', budget_share: evidenceShare, why: 'Read concrete files/commits only when needed.' },
  ];
}

export async function contextBudgetPlan(
  input: ContextBudgetPlanInput,
  storage: StoragePort,
  git: GitPort
): Promise<ContextBudgetPlanOutput> {
  const repoPath = input.repo_path;
  const budgetMode = resolveBudgetMode(input);
  const entrypoint = inferEntrypoint(input.task, input.retrieval_entrypoint);

  const decisions = storage.readDecisions(repoPath);
  const notes = storage.readNotes(repoPath);
  const progress = storage.readProgress(repoPath);
  const commits = git.parseLog(entrypoint === 'investigation' ? 120 : 30, repoPath);

  const confidenceResult = evaluateRetrievalConfidence(
    entrypoint,
    decisions.length,
    notes.length,
    progress.length,
    commits.length
  );

  const reason =
    entrypoint === 'investigation'
      ? 'Task shape indicates historical tracing; investigation-first workflow selected.'
      : 'Task shape indicates standard delivery flow; standard entrypoint selected.';

  return {
    entrypoint,
    budget_mode: budgetMode,
    confidence: confidenceResult.confidence,
    reason,
    suggested_fallback_entrypoint: confidenceResult.suggested_fallback_entrypoint,
    lightweight_workflow: buildWorkflow(entrypoint, budgetMode),
  };
}
