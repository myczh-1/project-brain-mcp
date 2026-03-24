import { Commit } from '../git/parseLog.js';
import { HotPath } from '../git/hotPaths.js';
import { Milestone } from '../storage/milestones.js';
import { ProgressEntry } from '../storage/progress.js';
import { Decision } from '../storage/decisions.js';
import { NextAction } from '../storage/nextActions.js';
import { ProgressEstimation } from './estimateProgress.js';

export interface ActionRecommendation {
  next_actions: NextAction[];
  reasoning_summary: string;
}

/**
 * Generate next action recommendations based on project state
 */
export function recommendNextActions(
  milestones: Milestone[],
  commits: Commit[],
  hotPaths: HotPath[],
  progress: ProgressEntry[],
  decisions: Decision[],
  milestoneProgress?: ProgressEstimation[]
): ActionRecommendation {
  const candidates: NextAction[] = [];
  
  // Signal 1: Incomplete milestones
  for (const milestone of milestones) {
    if (milestone.status !== 'completed') {
      const action = generateMilestoneAction(milestone, commits, milestoneProgress);
      if (action) {
        candidates.push(action);
      }
    }
  }
  
  // Signal 2: Stalled milestones (no activity for 7+ days)
  const stalledActions = detectStalledMilestones(milestones, commits);
  candidates.push(...stalledActions);
  
  // Signal 3: Hot path continuation
  const hotPathActions = generateHotPathActions(hotPaths, commits);
  candidates.push(...hotPathActions);
  
  // Signal 4: Decision follow-ups
  const decisionActions = extractActionsFromDecisions(decisions);
  candidates.push(...decisionActions);
  
  // Calculate RICE scores and sort
  const scored = candidates.map(action => ({
    ...action,
    priority_score: calculateRICEScore(action)
  }));
  
  const sorted = scored.sort((a, b) => b.priority_score - a.priority_score);
  const topActions = sorted.slice(0, 5);
  
  const reasoningSummary = generateReasoningSummary(topActions, candidates.length);
  
  return {
    next_actions: topActions,
    reasoning_summary: reasoningSummary
  };
}

/**
 * Generate action for incomplete milestone
 */
function generateMilestoneAction(
  milestone: Milestone,
  commits: Commit[],
  milestoneProgress?: ProgressEstimation[]
): NextAction | null {
  const keywords = extractKeywords(milestone.name);
  
  // Find progress estimation for this milestone
  const estimation = milestoneProgress?.find(e => e.milestone_name === milestone.name);
  
  // Determine impact based on milestone status and progress
  let impact = 2; // Default medium
  if (milestone.status === 'in_progress') {
    impact = 3; // High impact for in-progress work
  }
  if (estimation && estimation.percentage > 70) {
    impact = 3; // High impact if close to completion
  }
  
  // Estimate effort based on progress
  let effort = 3; // Default medium
  if (estimation) {
    if (estimation.percentage > 80) {
      effort = 2; // Low effort if almost done
    } else if (estimation.percentage < 30) {
      effort = 4; // High effort if just started
    }
  }
  
  const progressText = estimation 
    ? `Currently at ${estimation.percentage}%` 
    : 'Progress unknown';
  
  return {
    id: `milestone-${milestone.name.toLowerCase().replace(/\s+/g, '-')}`,
    title: `Complete: ${milestone.name}`,
    description: `Work on completing the ${milestone.name} milestone. ${progressText}.`,
    priority_score: 0, // Will be calculated
    reasoning: `Milestone is ${milestone.status}. ${progressText}. ${estimation?.confidence || 'low'} confidence in estimate.`,
    impact,
    effort,
    confidence: milestone.confidence || 'mid',
    related_milestone: milestone.name,
    suggested_by: 'milestone_tracking',
    created_at: new Date().toISOString()
  };
}

/**
 * Detect stalled milestones (no activity for 7+ days)
 */
function detectStalledMilestones(milestones: Milestone[], commits: Commit[]): NextAction[] {
  const actions: NextAction[] = [];
  const now = new Date();
  
  for (const milestone of milestones) {
    if (milestone.status === 'completed') continue;
    
    const keywords = extractKeywords(milestone.name);
    
    // Find most recent matching commit
    let mostRecentMatch: Date | null = null;
    for (const commit of commits) {
      const message = commit.message.toLowerCase();
      if (keywords.some(kw => message.includes(kw))) {
        const commitDate = new Date(commit.time);
        if (!mostRecentMatch || commitDate > mostRecentMatch) {
          mostRecentMatch = commitDate;
        }
      }
    }
    
    // Check if stalled (7+ days without activity)
    if (mostRecentMatch) {
      const daysSince = (now.getTime() - mostRecentMatch.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSince >= 7) {
        actions.push({
          id: `stalled-${milestone.name.toLowerCase().replace(/\s+/g, '-')}`,
          title: `Revive: ${milestone.name}`,
          description: `This milestone has had no activity for ${Math.round(daysSince)} days. Consider reviewing blockers or re-prioritizing.`,
          priority_score: 0,
          reasoning: `Stalled for ${Math.round(daysSince)} days. May be blocked or deprioritized.`,
          impact: 2,
          effort: 3,
          confidence: 'mid',
          related_milestone: milestone.name,
          suggested_by: 'stall_detection',
          created_at: new Date().toISOString()
        });
      }
    }
  }
  
  return actions;
}

/**
 * Generate actions based on hot paths
 */
function generateHotPathActions(hotPaths: HotPath[], commits: Commit[]): NextAction[] {
  const actions: NextAction[] = [];
  
  if (hotPaths.length === 0) return actions;
  
  const topHotPath = hotPaths[0];
  
  // Suggest continuing work in the most active area
  if (topHotPath.change_count >= 5) {
    actions.push({
      id: `hotpath-${topHotPath.path.replace(/\//g, '-')}`,
      title: `Continue work in ${topHotPath.path}`,
      description: `This area has ${topHotPath.change_count} recent changes. Consider completing related tasks or adding tests.`,
      priority_score: 0,
      reasoning: `High activity area (${topHotPath.change_count} changes). Momentum suggests continuing here.`,
      impact: 2,
      effort: 2,
      confidence: 'mid',
      suggested_by: 'hot_path_analysis',
      created_at: new Date().toISOString()
    });
  }
  
  return actions;
}

/**
 * Extract action items from recent decisions
 */
function extractActionsFromDecisions(decisions: Decision[]): NextAction[] {
  const actions: NextAction[] = [];
  
  // Look for action-oriented keywords in recent decisions
  const actionKeywords = ['implement', 'add', 'create', 'build', 'refactor', 'fix', 'update'];
  const recentDecisions = decisions.slice(-5);
  
  for (const decision of recentDecisions) {
    const decisionLower = decision.decision.toLowerCase();
    const hasActionKeyword = actionKeywords.some(kw => decisionLower.includes(kw));
    
    if (hasActionKeyword) {
      actions.push({
        id: `decision-${decision.id}`,
        title: `Follow up: ${decision.decision}`,
        description: `Decision made: ${decision.decision}. Rationale: ${decision.rationale}`,
        priority_score: 0,
        reasoning: `Recent decision suggests this action. Made on ${decision.created_at.split('T')[0]}.`,
        impact: 2,
        effort: 3,
        confidence: 'mid',
        suggested_by: 'decision_analysis',
        created_at: new Date().toISOString()
      });
    }
  }
  
  return actions;
}

/**
 * Calculate RICE score for prioritization
 */
function calculateRICEScore(action: NextAction): number {
  const reach = 1; // Simplified: all actions have reach=1
  const confidenceMap = { high: 1.0, mid: 0.8, low: 0.5 };
  const confidenceValue = confidenceMap[action.confidence];
  
  // RICE = (Reach × Impact × Confidence) / Effort
  const score = (reach * action.impact * confidenceValue) / action.effort;
  
  // Scale to 0-100
  return Math.round(score * 100);
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  const keywords = words.filter(w => !stopWords.includes(w) && w.length > 2);
  
  return keywords;
}

/**
 * Generate reasoning summary
 */
function generateReasoningSummary(topActions: NextAction[], totalCandidates: number): string {
  if (topActions.length === 0) {
    return 'No actionable recommendations at this time.';
  }
  
  const signalTypes = new Set(topActions.map(a => a.suggested_by));
  const signalList = Array.from(signalTypes).join(', ');
  
  return `Generated ${totalCandidates} candidate actions from signals: ${signalList}. Top ${topActions.length} actions selected by RICE scoring (Impact × Confidence / Effort).`;
}
