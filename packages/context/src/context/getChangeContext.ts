import * as fs from 'fs';
import * as path from 'path';
import { calculateHotPaths, parseLog } from '@myczh/project-brain/core-protocol/git';
import {
  buildFallbackManifest,
  getRepoRootPath,
  readChange,
  readDecisions,
  readManifest,
  readMilestones,
  readNotes,
  readProgress,
  readProjectSpec,
  type ChangeSpec,
} from '@myczh/project-brain/core-protocol/storage';
import { recommendNextActions } from '@myczh/project-brain/core-protocol/understanding';

export interface ChangeContextInput {
  change_id: string;
  repo_path?: string;
  recent_commits?: number;
}

export interface ChangeContextOutput {
  project_identity: ReturnType<typeof readManifest>;
  stable_rules: ReturnType<typeof readProjectSpec>;
  change_contract: ChangeSpec;
  relevant_decisions: ReturnType<typeof readDecisions>;
  execution_state: {
    progress: ReturnType<typeof readProgress>;
    milestones: ReturnType<typeof readMilestones>;
    notes: ReturnType<typeof readNotes>;
  };
  code_evidence: {
    commits: ReturnType<typeof parseLog>;
    hot_paths: ReturnType<typeof calculateHotPaths>;
  };
  recommended_next_actions: ReturnType<typeof recommendNextActions>['next_actions'];
  risks_or_unknowns: string[];
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

function readOpenSpecChange(changeId: string, cwd?: string): ChangeSpec | null {
  const repoRoot = getRepoRootPath(cwd);
  const candidates = [
    path.join(repoRoot, 'openspec', 'changes', changeId),
    path.join(repoRoot, 'openspec', 'changes', `${changeId}.md`),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    if (fs.statSync(candidate).isFile()) {
      const parsed = parseBulletSections(fs.readFileSync(candidate, 'utf-8'));
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const proposalPath = path.join(candidate, 'proposal.md');
    if (fs.existsSync(proposalPath)) {
      const parsed = parseBulletSections(fs.readFileSync(proposalPath, 'utf-8'));
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  return null;
}

function buildRisks(
  projectSpec: ReturnType<typeof readProjectSpec>,
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

export async function changeContext(input: ChangeContextInput): Promise<ChangeContextOutput> {
  const cwd = input.repo_path || process.cwd();
  const recentCommitCount = input.recent_commits || 30;
  const manifest = readManifest(cwd) || buildFallbackManifest(cwd);

  const projectSpec = readProjectSpec(cwd);
  const change = readChange(input.change_id, cwd) || readOpenSpecChange(input.change_id, cwd);
  if (!change) {
    throw new Error(`Change not found in ProjectBrain or OpenSpec: ${input.change_id}`);
  }

  const decisions = readDecisions(cwd).filter(decision =>
    change.related_decision_ids.includes(decision.id) || decision.related_change_id === change.id
  );
  const progress = readProgress(cwd).filter(entry => entry.related_change_id === change.id);
  const milestones = readMilestones(cwd);
  const notes = readNotes(cwd).filter(note => note.related_change_id === change.id);
  const commits = parseLog(recentCommitCount, cwd);
  const hotPaths = calculateHotPaths(commits);
  const recommendations = recommendNextActions(milestones, commits, hotPaths, progress, decisions);

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
  };
}
