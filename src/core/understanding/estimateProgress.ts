import { Commit } from '../git/parseLog.js';
import { HotPath } from '../git/hotPaths.js';
import { Milestone } from '../storage/milestones.js';

export interface ContributingSignal {
  signal_type: string;
  weight: number;
  value: number;
  description: string;
}

export interface ProgressEstimation {
  milestone_name: string;
  percentage: number;
  confidence: 'low' | 'mid' | 'high';
  explanation: string;
  contributing_signals: ContributingSignal[];
}

export interface CompletionEstimate {
  range: '0-20' | '20-40' | '40-60' | '60-80' | '80-100';
  score: number;
  confidence: 'low' | 'mid' | 'high';
  reason: string;
}

export interface ProgressSummary {
  completion_estimate: CompletionEstimate;
  momentum_score: number;
  staleness_risk: 'low' | 'mid' | 'high';
}

export function estimateOverallProgress(commits: Commit[], hotPaths: HotPath[]): ProgressEstimation {
  const activityValue = Math.min(100, commits.length * 5);

  const deliveryCommits = commits.filter(
    c => c.tag === 'feat' || c.tag === 'fix' || c.tag === 'refactor'
  ).length;
  const deliveryRatio = commits.length > 0 ? (deliveryCommits / commits.length) * 100 : 0;

  let recencyValue = 0;
  if (commits.length > 0) {
    const now = new Date();
    const latestCommit = new Date(commits[0].time);
    const daysSince = (now.getTime() - latestCommit.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince <= 1) {
      recencyValue = 100;
    } else if (daysSince <= 7) {
      recencyValue = 100 - ((daysSince - 1) / 6) * 50;
    } else if (daysSince <= 30) {
      recencyValue = 50 - ((daysSince - 7) / 23) * 50;
    }
  }

  const hotPathCoverage = Math.min(100, hotPaths.slice(0, 3).reduce((sum, p) => sum + p.change_count, 0) * 10);

  const signals: ContributingSignal[] = [
    {
      signal_type: 'activity_volume',
      weight: 0.4,
      value: activityValue,
      description: `${commits.length} recent commits considered`,
    },
    {
      signal_type: 'delivery_mix',
      weight: 0.3,
      value: deliveryRatio,
      description: `${deliveryCommits} of ${commits.length} commits are feat/fix/refactor`,
    },
    {
      signal_type: 'recency',
      weight: 0.2,
      value: recencyValue,
      description: commits.length > 0 ? 'Recent activity contributes to momentum' : 'No recent commits',
    },
    {
      signal_type: 'hot_path_coverage',
      weight: 0.1,
      value: hotPathCoverage,
      description: `${hotPaths.length} active paths detected`,
    },
  ];

  const percentage = Math.round(
    signals.reduce((sum, signal) => sum + signal.value * signal.weight, 0)
  );

  let confidence: 'low' | 'mid' | 'high' = 'low';
  if (commits.length >= 15) {
    confidence = 'high';
  } else if (commits.length >= 5) {
    confidence = 'mid';
  }

  const explanation =
    `Estimated overall project progress from recent engineering activity (${commits.length} commits, ${hotPaths.length} hot paths).`;

  return {
    milestone_name: 'Overall Project Progress',
    percentage,
    confidence,
    explanation,
    contributing_signals: signals,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toCompletionRange(score: number): CompletionEstimate['range'] {
  if (score < 20) return '0-20';
  if (score < 40) return '20-40';
  if (score < 60) return '40-60';
  if (score < 80) return '60-80';
  return '80-100';
}

function estimateDeliverableEvidence(commits: Commit[]): { score: number; matches: number } {
  const keywords = [
    'mvp', 'ready', '上线', '上架', '发布', 'deploy', 'release', 'publish',
    'production', 'prod', '可运行', '可用', '完成', 'done', 'ship', 'shippable',
  ];

  let matches = 0;
  for (const commit of commits.slice(0, 30)) {
    const message = commit.message.toLowerCase();
    if (keywords.some(keyword => message.includes(keyword))) {
      matches++;
    }
  }

  if (matches >= 4) return { score: 95, matches };
  if (matches === 3) return { score: 80, matches };
  if (matches === 2) return { score: 60, matches };
  if (matches === 1) return { score: 35, matches };
  return { score: 10, matches: 0 };
}

function estimateStageScore(commits: Commit[]): number {
  const phaseSignals = {
    setup: ['init', 'bootstrap', 'setup', 'scaffold', 'config', '初始化', '搭建'],
    implementation: ['feat', 'implement', 'build', 'add', '开发', '实现'],
    integration: ['integrate', 'e2e', 'test', 'fix', '联调', '验证', '测试'],
    release: ['release', 'deploy', 'publish', '上线', '上架', '发布'],
  };

  let setupMatches = 0;
  let implementationMatches = 0;
  let integrationMatches = 0;
  let releaseMatches = 0;

  for (const commit of commits.slice(0, 30)) {
    const message = commit.message.toLowerCase();
    if (phaseSignals.setup.some(keyword => message.includes(keyword))) setupMatches++;
    if (phaseSignals.implementation.some(keyword => message.includes(keyword))) implementationMatches++;
    if (phaseSignals.integration.some(keyword => message.includes(keyword))) integrationMatches++;
    if (phaseSignals.release.some(keyword => message.includes(keyword))) releaseMatches++;
  }

  if (releaseMatches >= 1) return 90;
  if (integrationMatches >= 2) return 70;
  if (implementationMatches >= 2) return 50;
  if (setupMatches >= 2) return 25;
  if (commits.length > 0) return 15;
  return 0;
}

function estimateMilestoneCompletionScore(
  milestones: Milestone[],
  milestoneEstimations: ProgressEstimation[]
): number | null {
  if (milestones.length === 0) {
    return null;
  }

  const estimationMap = new Map(
    milestoneEstimations.map(estimation => [estimation.milestone_name, estimation.percentage])
  );

  let totalEstimation = 0;
  let statusScoreSum = 0;

  for (const milestone of milestones) {
    const estimation = estimationMap.get(milestone.name);
    if (typeof estimation === 'number') {
      totalEstimation += estimation;
    } else if (milestone.status === 'completed') {
      totalEstimation += 100;
    } else if (milestone.status === 'in_progress') {
      totalEstimation += 50;
    } else {
      totalEstimation += 0;
    }

    if (milestone.status === 'completed') {
      statusScoreSum += 100;
    } else if (milestone.status === 'in_progress') {
      statusScoreSum += 55;
    } else {
      statusScoreSum += 10;
    }
  }

  const estimationAverage = totalEstimation / milestones.length;
  const statusAverage = statusScoreSum / milestones.length;
  return Math.round(estimationAverage * 0.65 + statusAverage * 0.35);
}

function estimateCompletionConfidence(
  milestones: Milestone[],
  commits: Commit[],
  deliverableScore: number,
  stageScore: number
): 'low' | 'mid' | 'high' {
  let evidencePoints = 0;

  if (milestones.length > 0) evidencePoints++;
  if (commits.length >= 10) evidencePoints++;
  if (deliverableScore >= 40) evidencePoints++;
  if (stageScore >= 50) evidencePoints++;

  if (evidencePoints >= 3) return 'high';
  if (evidencePoints >= 2) return 'mid';
  return 'low';
}

function estimateStalenessRisk(
  commits: Commit[],
  momentumScore: number,
  deliverableScore: number
): 'low' | 'mid' | 'high' {
  if (commits.length === 0) {
    return 'high';
  }

  const latestCommitAt = new Date(commits[0].time);
  const daysSinceLatest = (Date.now() - latestCommitAt.getTime()) / (1000 * 60 * 60 * 24);

  let riskScore = 0;
  if (daysSinceLatest > 14) {
    riskScore = 85;
  } else if (daysSinceLatest > 7) {
    riskScore = 60;
  } else if (daysSinceLatest > 3) {
    riskScore = 40;
  } else {
    riskScore = 20;
  }

  if (momentumScore >= 70) {
    riskScore -= 15;
  }

  if (deliverableScore >= 60) {
    riskScore -= 10;
  }

  riskScore = clamp(riskScore, 0, 100);

  if (riskScore <= 33) return 'low';
  if (riskScore <= 66) return 'mid';
  return 'high';
}

export function estimateProgressSummary(
  milestones: Milestone[],
  milestoneEstimations: ProgressEstimation[],
  commits: Commit[],
  hotPaths: HotPath[]
): ProgressSummary {
  const momentum = estimateOverallProgress(commits, hotPaths);
  const momentumScore = momentum.percentage;
  const { score: deliverableScore, matches: deliverableMatches } = estimateDeliverableEvidence(commits);
  const stageScore = estimateStageScore(commits);
  const milestoneScore = estimateMilestoneCompletionScore(milestones, milestoneEstimations);

  let completionScore = 0;
  if (typeof milestoneScore === 'number') {
    completionScore = Math.round(
      milestoneScore * 0.7 + deliverableScore * 0.2 + stageScore * 0.1
    );
  } else {
    completionScore = Math.round(deliverableScore * 0.6 + stageScore * 0.4);
  }
  completionScore = clamp(completionScore, 0, 100);

  const completionConfidence = estimateCompletionConfidence(
    milestones,
    commits,
    deliverableScore,
    stageScore
  );

  const completionReason = typeof milestoneScore === 'number'
    ? `Milestone evidence ${milestoneScore}%, deliverable evidence ${deliverableScore}% (${deliverableMatches} matches), stage signal ${stageScore}%.`
    : `No explicit milestones yet; deliverable evidence ${deliverableScore}% (${deliverableMatches} matches), stage signal ${stageScore}%.`;

  const stalenessRisk = estimateStalenessRisk(commits, momentumScore, deliverableScore);

  return {
    completion_estimate: {
      range: toCompletionRange(completionScore),
      score: completionScore,
      confidence: completionConfidence,
      reason: completionReason,
    },
    momentum_score: momentumScore,
    staleness_risk: stalenessRisk,
  };
}

export function progressSummaryToOverallEstimation(summary: ProgressSummary): ProgressEstimation {
  const riskToStability = summary.staleness_risk === 'low'
    ? 85
    : summary.staleness_risk === 'mid'
    ? 55
    : 25;

  const signals: ContributingSignal[] = [
    {
      signal_type: 'completion_estimate',
      weight: 0.75,
      value: summary.completion_estimate.score,
      description: `Completion estimate range ${summary.completion_estimate.range}`,
    },
    {
      signal_type: 'momentum_score',
      weight: 0.15,
      value: summary.momentum_score,
      description: `Recent momentum score ${summary.momentum_score}`,
    },
    {
      signal_type: 'stability_from_staleness',
      weight: 0.1,
      value: riskToStability,
      description: `Staleness risk ${summary.staleness_risk}`,
    },
  ];

  return {
    milestone_name: 'Overall Project Progress',
    percentage: summary.completion_estimate.score,
    confidence: summary.completion_estimate.confidence,
    explanation: `${summary.completion_estimate.score}% completion estimate (${summary.completion_estimate.range}). ${summary.completion_estimate.reason} Momentum ${summary.momentum_score}, staleness risk ${summary.staleness_risk}.`,
    contributing_signals: signals,
  };
}

/**
 * Estimate progress for a single milestone based on commit activity and hot paths
 */
export function estimateMilestoneProgress(
  milestone: Milestone,
  commits: Commit[],
  hotPaths: HotPath[]
): ProgressEstimation {
  const signals: ContributingSignal[] = [];
  
  // Base percentage from status
  let basePercentage = 0;
  if (milestone.status === 'not_started') {
    basePercentage = 0;
  } else if (milestone.status === 'in_progress') {
    if (milestone.confidence === 'high') {
      basePercentage = 30;
    } else if (milestone.confidence === 'mid') {
      basePercentage = 20;
    } else {
      basePercentage = 10;
    }
  } else if (milestone.status === 'completed') {
    return {
      milestone_name: milestone.name,
      percentage: 100,
      confidence: 'high',
      explanation: 'Milestone marked as completed',
      contributing_signals: [{
        signal_type: 'status',
        weight: 1.0,
        value: 100,
        description: 'Status: completed'
      }]
    };
  }

  // Signal 1: Commit activity analysis (40% weight)
  const commitSignal = analyzeCommitActivity(milestone, commits);
  signals.push(commitSignal);

  // Signal 2: Hot path matching (30% weight)
  const hotPathSignal = analyzeHotPathMatch(milestone, hotPaths);
  signals.push(hotPathSignal);

  // Signal 3: Time-based activity (30% weight)
  const timeSignal = analyzeTimeActivity(milestone, commits);
  signals.push(timeSignal);

  // Calculate weighted percentage
  const weightedPercentage = signals.reduce((sum, signal) => {
    return sum + (signal.value * signal.weight);
  }, 0);

  const finalPercentage = Math.min(95, Math.max(basePercentage, weightedPercentage));
  const roundedPercentage = Math.round(finalPercentage);

  // Determine confidence based on signal consistency
  const confidence = determineConfidence(signals, commits);

  // Generate explanation
  const explanation = generateExplanation(roundedPercentage, signals, confidence);

  return {
    milestone_name: milestone.name,
    percentage: roundedPercentage,
    confidence,
    explanation,
    contributing_signals: signals
  };
}

/**
 * Analyze commit activity related to milestone
 */
function analyzeCommitActivity(milestone: Milestone, commits: Commit[]): ContributingSignal {
  const keywords = extractKeywords(milestone.name);
  const tagHints = inferTagHints(milestone.name, keywords);
  const recentCommits = commits.slice(0, 20); // Last 20 commits
  
  let matchCount = 0;
  for (const commit of recentCommits) {
    if (isCommitRelatedToMilestone(commit, keywords, tagHints)) {
      matchCount++;
    }
  }

  const matchRatio = recentCommits.length > 0 ? matchCount / recentCommits.length : 0;
  const value = Math.min(100, matchRatio * 200); // Scale up

  return {
    signal_type: 'commit_activity',
    weight: 0.4,
    value,
    description: `${matchCount} of ${recentCommits.length} recent commits match milestone keywords`
  };
}

/**
 * Analyze hot path matching
 */
function analyzeHotPathMatch(milestone: Milestone, hotPaths: HotPath[]): ContributingSignal {
  if (hotPaths.length === 0) {
    return {
      signal_type: 'hot_path_match',
      weight: 0.3,
      value: 0,
      description: 'No hot paths detected'
    };
  }

  const keywords = extractKeywords(milestone.name);
  const topHotPaths = hotPaths.slice(0, 3);
  
  let matchScore = 0;
  let matchedPaths: string[] = [];

  for (const hotPath of topHotPaths) {
    const pathLower = hotPath.path.toLowerCase();
    if (keywords.some(kw => pathLower.includes(kw))) {
      matchScore += hotPath.change_count;
      matchedPaths.push(hotPath.path);
    }
  }

  const totalChanges = topHotPaths.reduce((sum, hp) => sum + hp.change_count, 0);
  const value = totalChanges > 0 ? (matchScore / totalChanges) * 100 : 0;

  return {
    signal_type: 'hot_path_match',
    weight: 0.3,
    value,
    description: matchedPaths.length > 0 
      ? `Hot paths match: ${matchedPaths.join(', ')}`
      : 'No hot path matches milestone scope'
  };
}

/**
 * Analyze time-based activity
 */
function analyzeTimeActivity(milestone: Milestone, commits: Commit[]): ContributingSignal {
  if (commits.length === 0) {
    return {
      signal_type: 'time_activity',
      weight: 0.3,
      value: 0,
      description: 'No recent commits'
    };
  }

  const keywords = extractKeywords(milestone.name);
  const tagHints = inferTagHints(milestone.name, keywords);
  const now = new Date();
  
  // Find most recent matching commit
  let mostRecentMatch: Date | null = null;
  let recentMatchCount = 0;

  for (const commit of commits) {
    if (isCommitRelatedToMilestone(commit, keywords, tagHints)) {
      const commitDate = new Date(commit.time);
      if (!mostRecentMatch || commitDate > mostRecentMatch) {
        mostRecentMatch = commitDate;
      }
      
      // Count commits in last 7 days
      const daysSince = (now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 7) {
        recentMatchCount++;
      }
    }
  }

  if (!mostRecentMatch) {
    return {
      signal_type: 'time_activity',
      weight: 0.3,
      value: 0,
      description: 'No matching commits found'
    };
  }

  const daysSinceLastActivity = (now.getTime() - mostRecentMatch.getTime()) / (1000 * 60 * 60 * 24);
  
  // Decay function: 100% if today, 50% if 7 days ago, 0% if 30+ days ago
  let value = 0;
  if (daysSinceLastActivity <= 1) {
    value = 100;
  } else if (daysSinceLastActivity <= 7) {
    value = 100 - ((daysSinceLastActivity - 1) / 6) * 50;
  } else if (daysSinceLastActivity <= 30) {
    value = 50 - ((daysSinceLastActivity - 7) / 23) * 50;
  }

  return {
    signal_type: 'time_activity',
    weight: 0.3,
    value,
    description: `${recentMatchCount} related commits in last 7 days, most recent ${Math.round(daysSinceLastActivity)} days ago`
  };
}

/**
 * Extract keywords from milestone name
 */
function extractKeywords(milestoneName: string): string[] {
  const name = milestoneName.toLowerCase();
  const words = name.split(/\s+/);
  
  // Filter out common words
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  const keywords = words.filter(w => !stopWords.includes(w) && w.length > 2);

  const expandedKeywords = new Set<string>(keywords);

  for (const keyword of keywords) {
    if (keyword === 'documentation' || keyword === 'docs' || keyword === 'doc') {
      expandedKeywords.add('readme');
      expandedKeywords.add('document');
      expandedKeywords.add('文档');
      expandedKeywords.add('说明');
    }

    if (keyword === 'testing' || keyword === 'test' || keyword === 'spec') {
      expandedKeywords.add('测试');
      expandedKeywords.add('用例');
    }

    if (keyword === 'deployment' || keyword === 'deploy' || keyword === 'release') {
      expandedKeywords.add('发布');
      expandedKeywords.add('上线');
      expandedKeywords.add('部署');
    }
  }

  return Array.from(expandedKeywords);
}

function inferTagHints(milestoneName: string, keywords: string[]): Commit['tag'][] {
  const lowerName = milestoneName.toLowerCase();

  if (lowerName.includes('documentation') || lowerName.includes('docs') || keywords.includes('文档')) {
    return ['docs'];
  }

  if (lowerName.includes('test') || lowerName.includes('testing') || keywords.includes('测试')) {
    return ['test'];
  }

  if (lowerName.includes('refactor') || lowerName.includes('cleanup')) {
    return ['refactor'];
  }

  if (
    lowerName.includes('http') ||
    lowerName.includes('api') ||
    lowerName.includes('server') ||
    lowerName.includes('implementation')
  ) {
    return ['feat', 'fix', 'chore'];
  }

  return [];
}

function isCommitRelatedToMilestone(
  commit: Commit,
  keywords: string[],
  tagHints: Commit['tag'][]
): boolean {
  const message = commit.message.toLowerCase();
  const keywordMatched = keywords.some(kw => message.includes(kw));
  const tagMatched = tagHints.includes(commit.tag);
  return keywordMatched || tagMatched;
}

/**
 * Determine confidence level based on signal consistency
 */
function determineConfidence(signals: ContributingSignal[], commits: Commit[]): 'low' | 'mid' | 'high' {
  if (commits.length < 5) {
    return 'low'; // Not enough data
  }

  // Check signal variance
  const values = signals.map(s => s.value);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

  if (avg < 15) {
    return 'low';
  }

  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // High consistency = high confidence
  if (stdDev < 20) {
    return 'high';
  } else if (stdDev < 40) {
    return 'mid';
  } else {
    return 'low';
  }
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(percentage: number, signals: ContributingSignal[], confidence: string): string {
  const parts: string[] = [];
  
  for (const signal of signals) {
    const contribution = Math.round(signal.value * signal.weight);
    parts.push(`${signal.description} (${signal.weight * 100}% weight → ${contribution}%)`);
  }

  return `${percentage}% complete because:\n- ${parts.join('\n- ')}\nConfidence: ${confidence}`;
}

/**
 * Estimate progress for all milestones
 */
export function estimateAllMilestones(
  milestones: Milestone[],
  commits: Commit[],
  hotPaths: HotPath[]
): ProgressEstimation[] {
  return milestones.map(milestone => 
    estimateMilestoneProgress(milestone, commits, hotPaths)
  );
}
