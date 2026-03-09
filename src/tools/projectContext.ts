import { readManifest } from '../storage/manifest.js';
import { parseLog } from '../git/parseLog.js';
export interface ProjectContextInput {
  repo_path?: string;
}

export interface ProjectContextOutput {
  project_name: string;
  one_liner: string;
  goals: string[];
  current_focus: {
    area: string;
    confidence: string;
  };
  last_commit: {
    message: string;
    time: string;
    author: string;
  } | null;
  should_run_deep_analysis: boolean;
}

export async function projectContext(input: ProjectContextInput): Promise<ProjectContextOutput> {
  const cwd = input.repo_path || process.cwd();

  // Read manifest (lightweight)
  const manifest = readManifest(cwd);
  if (!manifest) {
    throw new Error('Project not initialized. Please run brain_init first.');
  }

  // Read only last 5 commits for quick focus inference
  const recentCommits = parseLog(5, cwd);
  
  // Simple focus inference: just look at commit tags
  let focusArea = 'Unknown';
  let focusConfidence = 'low';
  
  if (recentCommits.length > 0) {
    // Infer focus from commit tags
    const tags = recentCommits.map(c => c.tag);
    const tagCounts = new Map<string, number>();
    tags.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
    
    const topTag = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topTag && topTag[0] !== 'other') {
      focusArea = `Recent ${topTag[0]} work`;
      focusConfidence = topTag[1] >= 3 ? 'high' : 'mid';
    } else {
      focusArea = 'General development';
      focusConfidence = 'mid';
    }
  }

  // Determine if deep analysis is needed
  // Heuristic: if last commit was >24h ago, suggest deep analysis
  let shouldRunDeepAnalysis = false;
  if (recentCommits.length > 0) {
    const lastCommitTime = new Date(recentCommits[0].time);
    const hoursSinceLastCommit = (Date.now() - lastCommitTime.getTime()) / (1000 * 60 * 60);
    shouldRunDeepAnalysis = hoursSinceLastCommit > 24;
  }

  return {
    project_name: manifest.project_name,
    one_liner: manifest.one_liner,
    goals: manifest.goals,
    current_focus: {
      area: focusArea,
      confidence: focusConfidence,
    },
    last_commit: recentCommits.length > 0 ? {
      message: recentCommits[0].message,
      time: recentCommits[0].time,
      author: recentCommits[0].author,
    } : null,
    should_run_deep_analysis: shouldRunDeepAnalysis,
  };
}
