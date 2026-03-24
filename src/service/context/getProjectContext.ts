import { readManifest } from '../../core/storage/manifest.js';
import { readProjectSpec } from '../../core/storage/projectSpec.js';
import { readDecisions } from '../../core/storage/decisions.js';
import { readProgress } from '../../core/storage/progress.js';
import { readMilestones } from '../../core/storage/milestones.js';
import { parseLog } from '../../core/git/parseLog.js';
import { calculateHotPaths } from '../../core/git/hotPaths.js';
export interface ProjectContextInput {
  repo_path?: string;
}

export interface ProjectContextOutput {
  project_identity: {
    project_name: string;
    summary: string;
    repo_type: string;
    primary_stack: string[];
    long_term_goal?: string;
  };
  stable_rules: {
    product_goal: string;
    non_goals: string[];
    architecture_rules: string[];
    coding_rules: string[];
    agent_rules: string[];
  } | null;
  recent_decisions: {
    id: string;
    title: string;
    rationale: string;
    scope: string;
    created_at: string;
  }[];
  execution_state: {
    recent_progress: {
      summary: string;
      status?: string;
      blockers?: string[];
      confidence: string;
      date: string;
    }[];
    milestones: {
      name: string;
      status: string;
      confidence?: string;
    }[];
  };
  code_evidence: {
    last_commit: {
      message: string;
      time: string;
      author: string;
    } | null;
    hot_paths: {
      path: string;
      change_count: number;
    }[];
  };
  should_run_deep_analysis: boolean;
}

export async function projectContext(input: ProjectContextInput): Promise<ProjectContextOutput> {
  const cwd = input.repo_path || process.cwd();

  // Read manifest (lightweight)
  const manifest = readManifest(cwd);
  if (!manifest) {
    throw new Error('Project not initialized. Please run brain_init first.');
  }
  const projectSpec = readProjectSpec(cwd);
  const decisions = readDecisions(cwd).slice(-5).reverse();
  const progress = readProgress(cwd).slice(-5).reverse();
  const milestones = readMilestones(cwd);

  // Read only last 5 commits for quick focus inference
  const recentCommits = parseLog(5, cwd);
  const hotPaths = calculateHotPaths(recentCommits, cwd);
  
  // Determine if deep analysis is needed
  // Heuristic: if last commit was >24h ago, suggest deep analysis
  let shouldRunDeepAnalysis = false;
  if (recentCommits.length > 0) {
    const lastCommitTime = new Date(recentCommits[0].time);
    const hoursSinceLastCommit = (Date.now() - lastCommitTime.getTime()) / (1000 * 60 * 60);
    shouldRunDeepAnalysis = hoursSinceLastCommit > 24;
  }

  return {
    project_identity: {
      project_name: manifest.project_name,
      summary: manifest.summary,
      repo_type: manifest.repo_type,
      primary_stack: manifest.primary_stack,
      long_term_goal: manifest.long_term_goal,
    },
    stable_rules: projectSpec
      ? {
          product_goal: projectSpec.product_goal,
          non_goals: projectSpec.non_goals,
          architecture_rules: projectSpec.architecture_rules,
          coding_rules: projectSpec.coding_rules,
          agent_rules: projectSpec.agent_rules,
        }
      : null,
    recent_decisions: decisions.map(decision => ({
      id: decision.id,
      title: decision.title,
      rationale: decision.rationale,
      scope: decision.scope,
      created_at: decision.created_at,
    })),
    execution_state: {
      recent_progress: progress.map(entry => ({
        summary: entry.summary,
        status: entry.status,
        blockers: entry.blockers,
        confidence: entry.confidence,
        date: entry.date,
      })),
      milestones: milestones.map(milestone => ({
        name: milestone.name,
        status: milestone.status,
        confidence: milestone.confidence,
      })),
    },
    code_evidence: {
      last_commit: recentCommits.length > 0
        ? {
            message: recentCommits[0].message,
            time: recentCommits[0].time,
            author: recentCommits[0].author,
          }
        : null,
      hot_paths: hotPaths.slice(0, 5).map(pathEntry => ({
        path: pathEntry.path,
        change_count: pathEntry.change_count,
      })),
    },
    should_run_deep_analysis: shouldRunDeepAnalysis,
  };
}
