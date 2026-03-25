import { Commit } from '../git/parseLog.js';
import { HotPath } from '../git/hotPaths.js';

export interface FocusInference {
  focus: string;
  confidence: 'low' | 'mid' | 'high';
}

export interface MilestoneSignal {
  name: string;
  confidence: 'low' | 'mid' | 'high';
  reason: string;
}

export function inferFocus(commits: Commit[], hotPaths: HotPath[]): FocusInference {
  if (commits.length === 0) {
    return {
      focus: 'No recent activity detected',
      confidence: 'low'
    };
  }

  const tagCounts = new Map<string, number>();
  for (const commit of commits) {
    tagCounts.set(commit.tag, (tagCounts.get(commit.tag) || 0) + 1);
  }

  const sortedTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  const dominantTag = sortedTags[0];
  const topHotPath = hotPaths[0];

  let focus = '';
  let confidence: 'low' | 'mid' | 'high' = 'mid';

  if (dominantTag[1] >= commits.length * 0.6) {
    confidence = 'high';
  } else if (dominantTag[1] >= commits.length * 0.4) {
    confidence = 'mid';
  } else {
    confidence = 'low';
  }

  const tagDescriptions: Record<string, string> = {
    feat: 'Adding new features',
    fix: 'Bug fixing',
    refactor: 'Code refactoring',
    docs: 'Documentation updates',
    test: 'Testing improvements',
    chore: 'Maintenance work',
    other: 'General development'
  };

  focus = tagDescriptions[dominantTag[0]] || 'General development';
  
  if (topHotPath && topHotPath.change_count >= 3) {
    focus += ` in ${topHotPath.path}`;
  }

  return { focus, confidence };
}

export function inferMilestoneSignals(commits: Commit[], hotPaths: HotPath[]): MilestoneSignal[] {
  const signals: MilestoneSignal[] = [];

  const recentMessages = commits.slice(0, 10).map(c => c.message.toLowerCase());
  
  const milestonePatterns = [
    {
      keywords: ['http', 'api', 'server', 'transport'],
      name: 'HTTP Service Implementation',
      threshold: 2
    },
    {
      keywords: ['test', 'testing', 'spec'],
      name: 'Testing Infrastructure',
      threshold: 3
    },
    {
      keywords: ['deploy', 'release', 'publish'],
      name: 'Deployment Ready',
      threshold: 2
    },
    {
      keywords: ['refactor', 'cleanup', 'restructure'],
      name: 'Code Refactoring',
      threshold: 3
    },
    {
      keywords: ['docs', 'documentation', 'readme'],
      name: 'Documentation',
      threshold: 2
    }
  ];

  for (const pattern of milestonePatterns) {
    let matchCount = 0;
    
    for (const message of recentMessages) {
      if (pattern.keywords.some(kw => message.includes(kw))) {
        matchCount++;
      }
    }

    if (matchCount >= pattern.threshold) {
      const confidence: 'low' | 'mid' | 'high' = 
        matchCount >= pattern.threshold * 2 ? 'high' :
        matchCount >= pattern.threshold * 1.5 ? 'mid' : 'low';

      signals.push({
        name: pattern.name,
        confidence,
        reason: `Detected ${matchCount} related commits in recent activity`
      });
    }
  }

  return signals;
}
