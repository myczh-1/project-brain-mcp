import * as path from 'path';
import type { GitPort } from '../../ports/git.js';
import type { ChangeSpec, StoragePort } from '../../ports/storage.js';
import { recommendNextActions } from '../../understanding/index.js';
import {
  buildHistoryEvidenceChain,
  evaluateRetrievalConfidence,
  textMatchesTerms,
  type RetrievalEntrypoint,
} from '../../understanding/index.js';

export interface RetrievalPools {
  decisions: ReturnType<StoragePort['readDecisions']>;
  progress: ReturnType<StoragePort['readProgress']>;
  notes: ReturnType<StoragePort['readNotes']>;
  milestones: ReturnType<StoragePort['readMilestones']>;
}

export interface FilteredRetrievalEvidence {
  decisions: ReturnType<StoragePort['readDecisions']>;
  progress: ReturnType<StoragePort['readProgress']>;
  notes: ReturnType<StoragePort['readNotes']>;
}

export interface RetrievalMetaSummary {
  confidence: 'low' | 'mid' | 'high';
  low_confidence_reason?: string;
  suggested_fallback_entrypoint?: 'investigation';
  investigation_term_hints?: string[];
  history_evidence_chain?: Array<{
    source: 'decision' | 'note' | 'progress';
    ref: string;
    excerpt: string;
  }>;
  why_not_found?: string;
}

interface OpenSpecChange {
  title: string;
  summary: string;
  goals: string[];
  non_goals: string[];
  constraints: string[];
  acceptance_criteria: string[];
  affected_areas: string[];
}

const UNKNOWN_OPENSPEC_TIMESTAMP = '';

export function readRetrievalPools(storage: StoragePort, cwd: string): RetrievalPools {
  return {
    decisions: storage.readDecisions(cwd),
    progress: storage.readProgress(cwd),
    notes: storage.readNotes(cwd),
    milestones: storage.readMilestones(cwd),
  };
}

export function filterRetrievalEvidence(args: {
  entrypoint: RetrievalEntrypoint;
  termHints: string[];
  change: ChangeSpec;
  pools: RetrievalPools;
}): FilteredRetrievalEvidence {
  const { entrypoint, termHints, change, pools } = args;

  const decisions = pools.decisions.filter(decision => {
    const related = change.related_decision_ids.includes(decision.id) || decision.related_change_id === change.id;
    if (entrypoint === 'standard') return related;
    return related || textMatchesTerms(`${decision.title} ${decision.decision} ${decision.rationale}`, termHints);
  });

  const progress = pools.progress.filter(entry => {
    const related = entry.related_change_id === change.id;
    if (entrypoint === 'standard') return related;
    return related || textMatchesTerms(entry.summary, termHints);
  });

  const notes = pools.notes.filter(note => {
    const related = note.related_change_id === change.id;
    if (entrypoint === 'standard') return related;
    return related || textMatchesTerms(note.note, termHints);
  });

  return { decisions, progress, notes };
}

export function buildRetrievalMeta(args: {
  entrypoint: RetrievalEntrypoint;
  termHints: string[];
  decisions: ReturnType<StoragePort['readDecisions']>;
  notes: ReturnType<StoragePort['readNotes']>;
  progress: ReturnType<StoragePort['readProgress']>;
  commitsCount: number;
}): RetrievalMetaSummary {
  const confidenceResult = evaluateRetrievalConfidence(
    args.entrypoint,
    args.decisions.length,
    args.notes.length,
    args.progress.length,
    args.commitsCount
  );
  const historyEvidenceChain = args.entrypoint === 'investigation'
    ? buildHistoryEvidenceChain(args.decisions, args.notes, args.progress)
    : undefined;

  return {
    confidence: confidenceResult.confidence,
    low_confidence_reason: confidenceResult.low_confidence_reason,
    suggested_fallback_entrypoint: confidenceResult.suggested_fallback_entrypoint,
    investigation_term_hints: args.entrypoint === 'investigation' ? args.termHints : undefined,
    history_evidence_chain: historyEvidenceChain,
    why_not_found:
      args.entrypoint === 'investigation' && historyEvidenceChain && historyEvidenceChain.length === 0
        ? 'No historical evidence matched expanded terms. Consider widening task terms or time span.'
        : undefined,
  };
}

export function buildRisks(
  projectSpec: ReturnType<StoragePort['readProjectSpec']>,
  change: ChangeSpec,
  decisionsCount: number,
  progressCount: number,
  commitsCount: number
): string[] {
  const risks: string[] = [];

  if (!projectSpec) risks.push('No project-spec found; stable governance rules are missing from context.');
  if (change.acceptance_criteria.length === 0) risks.push('Change has no acceptance criteria yet.');
  if (change.affected_areas.length === 0) risks.push('Change does not declare affected areas, so code navigation may be noisy.');
  if (decisionsCount === 0) risks.push('No related decisions found; rationale history may be incomplete.');
  if (progressCount === 0) risks.push('No change-linked progress entries found.');
  if (commitsCount === 0) risks.push('No recent git evidence found.');

  return risks;
}

export function buildRecommendedNextActions(args: {
  milestones: RetrievalPools['milestones'];
  commits: ReturnType<GitPort['parseLog']>;
  hotPaths: ReturnType<GitPort['calculateHotPaths']>;
  progress: FilteredRetrievalEvidence['progress'];
  decisions: FilteredRetrievalEvidence['decisions'];
}): ReturnType<typeof recommendNextActions>['next_actions'] {
  return recommendNextActions(args.milestones, args.commits, args.hotPaths, args.progress, args.decisions).next_actions;
}

export function resolveChange(changeId: string, storage: StoragePort, cwd: string): ChangeSpec {
  const change = storage.readChange(changeId, cwd) || readOpenSpecChange(changeId, storage, cwd);
  if (!change) {
    throw new Error(`Change not found in ProjectBrain or OpenSpec: ${changeId}`);
  }

  return change;
}

function readOpenSpecChange(changeId: string, storage: StoragePort, cwd?: string): ChangeSpec | null {
  const repoRoot = storage.getRepoRootPath(cwd);
  const candidates = [
    path.join(repoRoot, 'openspec', 'changes', changeId),
    path.join(repoRoot, 'openspec', 'changes', `${changeId}.md`),
  ];

  for (const candidate of candidates) {
    if (!storage.fileExists(candidate)) {
      continue;
    }

    if (storage.isFile(candidate)) {
      const parsed = parseBulletSections(storage.readTextFile(candidate));
      return toOpenSpecChangeSpec(changeId, parsed);
    }

    const proposalPath = path.join(candidate, 'proposal.md');
    if (storage.fileExists(proposalPath)) {
      const parsed = parseBulletSections(storage.readTextFile(proposalPath));
      return toOpenSpecChangeSpec(changeId, parsed);
    }
  }

  return null;
}

function toOpenSpecChangeSpec(changeId: string, parsed: OpenSpecChange): ChangeSpec {
  return {
    id: changeId,
    title: parsed.title || changeId,
    summary: parsed.summary,
    status: 'proposed',
    goals: parsed.goals,
    non_goals: parsed.non_goals,
    constraints: parsed.constraints,
    acceptance_criteria: parsed.acceptance_criteria,
    affected_areas: parsed.affected_areas,
    related_decision_ids: [],
    module_ids: [],
    created_at: UNKNOWN_OPENSPEC_TIMESTAMP,
    updated_at: UNKNOWN_OPENSPEC_TIMESTAMP,
  };
}

function parseBulletSections(content: string): OpenSpecChange {
  const lines = content.split('\n');
  const result: OpenSpecChange = {
    title: '',
    summary: '',
    goals: [],
    non_goals: [],
    constraints: [],
    acceptance_criteria: [],
    affected_areas: [],
  };

  let current: keyof OpenSpecChange | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('# ') && !result.title) {
      result.title = line.slice(2).trim();
      continue;
    }
    if (/^##\s+/i.test(line)) {
      const heading = line.replace(/^##\s+/i, '').toLowerCase();
      if (heading.includes('goal')) current = 'goals';
      else if (heading.includes('non')) current = 'non_goals';
      else if (heading.includes('constraint')) current = 'constraints';
      else if (heading.includes('accept')) current = 'acceptance_criteria';
      else if (heading.includes('affected') || heading.includes('scope')) current = 'affected_areas';
      else current = null;
      continue;
    }
    if (!result.summary && line && !line.startsWith('#') && !line.startsWith('- ')) {
      result.summary = line;
      continue;
    }
    if (current && line.startsWith('- ')) {
      result[current].push(line.slice(2).trim());
    }
  }

  return result;
}
