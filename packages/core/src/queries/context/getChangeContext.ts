import * as path from 'path';
import type { GitPort } from '../../ports/git.js';
import type { ChangeSpec, StoragePort } from '../../ports/storage.js';
import { recommendNextActions } from '../../understanding/index.js';
import {
  buildHistoryEvidenceChain,
  evaluateRetrievalConfidence,
  expandRetrievalTerms,
  resolveCommitWindow,
  textMatchesTerms,
  type RetrievalEntrypoint,
} from '../../understanding/index.js';

export interface ChangeContextInput {
  change_id: string;
  repo_path: string;
  recent_commits?: number;
  retrieval_entrypoint?: RetrievalEntrypoint;
  task?: string;
}

export interface ChangeContextOutput {
  project_identity: ReturnType<StoragePort['readManifest']>;
  stable_rules: ReturnType<StoragePort['readProjectSpec']>;
  change_contract: ChangeSpec;
  relevant_decisions: ReturnType<StoragePort['readDecisions']>;
  execution_state: {
    progress: ReturnType<StoragePort['readProgress']>;
    milestones: ReturnType<StoragePort['readMilestones']>;
    notes: ReturnType<StoragePort['readNotes']>;
  };
  code_evidence: {
    commits: ReturnType<GitPort['parseLog']>;
    hot_paths: ReturnType<GitPort['calculateHotPaths']>;
  };
  recommended_next_actions: ReturnType<typeof recommendNextActions>['next_actions'];
  risks_or_unknowns: string[];
  retrieval_meta: {
    entrypoint: RetrievalEntrypoint;
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
  };
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const proposalPath = path.join(candidate, 'proposal.md');
    if (storage.fileExists(proposalPath)) {
      const parsed = parseBulletSections(storage.readTextFile(proposalPath));
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  return null;
}

function buildRisks(
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

export async function changeContext(input: ChangeContextInput, storage: StoragePort, git: GitPort): Promise<ChangeContextOutput> {
  const cwd = input.repo_path;
  const entrypoint = input.retrieval_entrypoint || 'standard';
  const recentCommitCount = resolveCommitWindow(entrypoint, input.recent_commits);
  const manifest = storage.readManifest(cwd) || storage.buildFallbackManifest(cwd);

  const projectSpec = storage.readProjectSpec(cwd);
  const change = storage.readChange(input.change_id, cwd) || readOpenSpecChange(input.change_id, storage, cwd);
  if (!change) {
    throw new Error(`Change not found in ProjectBrain or OpenSpec: ${input.change_id}`);
  }

  const termHints = expandRetrievalTerms(input.task, [change.title, change.summary, ...change.affected_areas]);
  const decisionsPool = storage.readDecisions(cwd);
  const progressPool = storage.readProgress(cwd);
  const notesPool = storage.readNotes(cwd);

  const decisions = decisionsPool.filter(decision => {
    const related = change.related_decision_ids.includes(decision.id) || decision.related_change_id === change.id;
    if (entrypoint === 'standard') return related;
    return related || textMatchesTerms(`${decision.title} ${decision.decision} ${decision.rationale}`, termHints);
  });
  const progress = progressPool.filter(entry => {
    const related = entry.related_change_id === change.id;
    if (entrypoint === 'standard') return related;
    return related || textMatchesTerms(entry.summary, termHints);
  });
  const milestones = storage.readMilestones(cwd);
  const notes = notesPool.filter(note => {
    const related = note.related_change_id === change.id;
    if (entrypoint === 'standard') return related;
    return related || textMatchesTerms(note.note, termHints);
  });
  const commits = git.parseLog(recentCommitCount, cwd);
  const hotPaths = git.calculateHotPaths(commits);
  const recommendations = recommendNextActions(milestones, commits, hotPaths, progress, decisions);

  const confidenceResult = evaluateRetrievalConfidence(
    entrypoint,
    decisions.length,
    notes.length,
    progress.length,
    commits.length
  );
  const historyEvidenceChain = entrypoint === 'investigation'
    ? buildHistoryEvidenceChain(decisions, notes, progress)
    : undefined;

  return {
    project_identity: manifest,
    stable_rules: projectSpec,
    change_contract: change,
    relevant_decisions: decisions,
    execution_state: {
      progress,
      milestones,
      notes,
    },
    code_evidence: {
      commits: commits.slice(0, 10),
      hot_paths: hotPaths.slice(0, 10),
    },
    recommended_next_actions: recommendations.next_actions,
    risks_or_unknowns: buildRisks(projectSpec, change, decisions.length, progress.length, commits.length),
    retrieval_meta: {
      entrypoint,
      confidence: confidenceResult.confidence,
      low_confidence_reason: confidenceResult.low_confidence_reason,
      suggested_fallback_entrypoint: confidenceResult.suggested_fallback_entrypoint,
      investigation_term_hints: entrypoint === 'investigation' ? termHints : undefined,
      history_evidence_chain: historyEvidenceChain,
      why_not_found:
        entrypoint === 'investigation' && historyEvidenceChain && historyEvidenceChain.length === 0
          ? 'No historical evidence matched expanded terms. Consider widening task terms or time span.'
          : undefined,
    },
  };
}
