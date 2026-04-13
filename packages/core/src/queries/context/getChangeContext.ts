import type { GitPort } from '../../ports/git.js';
import type { ChangeSpec, StoragePort } from '../../ports/storage.js';
import {
  expandRetrievalTerms,
  recommendNextActions,
  resolveCommitWindow,
  type RetrievalEntrypoint,
} from '../../understanding/index.js';
import {
  buildRecommendedNextActions,
  buildRetrievalMeta,
  buildRisks,
  filterRetrievalEvidence,
  readRetrievalPools,
  resolveChange,
} from './changeContextHelpers.js';

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

export async function changeContext(input: ChangeContextInput, storage: StoragePort, git: GitPort): Promise<ChangeContextOutput> {
  const cwd = input.repo_path;
  const entrypoint = input.retrieval_entrypoint || 'standard';
  const recentCommitCount = resolveCommitWindow(entrypoint, input.recent_commits);
  const manifest = storage.readManifest(cwd) || storage.buildFallbackManifest(cwd);
  const projectSpec = storage.readProjectSpec(cwd);
  const change = resolveChange(input.change_id, storage, cwd);
  const termHints = expandRetrievalTerms(input.task, [change.title, change.summary, ...change.affected_areas]);
  const pools = readRetrievalPools(storage, cwd);
  const evidence = filterRetrievalEvidence({ entrypoint, termHints, change, pools });
  const commits = git.parseLog(recentCommitCount, cwd);
  const hotPaths = git.calculateHotPaths(commits);
  const recommendations = buildRecommendedNextActions({
    milestones: pools.milestones,
    commits,
    hotPaths,
    progress: evidence.progress,
    decisions: evidence.decisions,
  });
  const retrievalMeta = buildRetrievalMeta({
    entrypoint,
    termHints,
    decisions: evidence.decisions,
    notes: evidence.notes,
    progress: evidence.progress,
    commitsCount: commits.length,
  });

  return {
    project_identity: manifest,
    stable_rules: projectSpec,
    change_contract: change,
    relevant_decisions: evidence.decisions,
    execution_state: {
      progress: evidence.progress,
      milestones: pools.milestones,
      notes: evidence.notes,
    },
    code_evidence: {
      commits: commits.slice(0, 10),
      hot_paths: hotPaths.slice(0, 10),
    },
    recommended_next_actions: recommendations,
    risks_or_unknowns: buildRisks(projectSpec, change, evidence.decisions.length, evidence.progress.length, commits.length),
    retrieval_meta: {
      entrypoint,
      ...retrievalMeta,
    },
  };
}
