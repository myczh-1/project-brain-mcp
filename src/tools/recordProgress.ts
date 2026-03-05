import { appendProgress, ProgressEntry } from '../storage/progress.js';
import { appendDecision, Decision } from '../storage/decisions.js';
import { updateMilestone, Milestone } from '../storage/milestones.js';

export interface RecordProgressInput {
  type: 'progress' | 'decision' | 'milestone';
  repo_path?: string;
  
  progress?: {
    summary: string;
    confidence: 'low' | 'mid' | 'high';
  };
  
  decision?: {
    decision: string;
    reason: string;
  };
  
  milestone?: {
    name: string;
    status: 'not_started' | 'in_progress' | 'completed';
    confidence?: 'low' | 'mid' | 'high';
  };
}

export interface RecordProgressOutput {
  status: 'ok';
  recorded_type: string;
}

export async function recordProgress(input: RecordProgressInput): Promise<RecordProgressOutput> {
  const cwd = input.repo_path || process.cwd();

  switch (input.type) {
    case 'progress': {
      if (!input.progress) {
        throw new Error('progress data required when type is "progress"');
      }
      
      const entry: ProgressEntry = {
        date: new Date().toISOString(),
        summary: input.progress.summary,
        confidence: input.progress.confidence,
      };
      
      appendProgress(entry, cwd);
      return { status: 'ok', recorded_type: 'progress' };
    }

    case 'decision': {
      if (!input.decision) {
        throw new Error('decision data required when type is "decision"');
      }
      
      const decision: Decision = {
        decision: input.decision.decision,
        reason: input.decision.reason,
        date: new Date().toISOString(),
      };
      
      appendDecision(decision, cwd);
      return { status: 'ok', recorded_type: 'decision' };
    }

    case 'milestone': {
      if (!input.milestone) {
        throw new Error('milestone data required when type is "milestone"');
      }
      
      const milestone: Milestone = {
        name: input.milestone.name,
        status: input.milestone.status,
        confidence: input.milestone.confidence,
        detected_at: new Date().toISOString(),
      };
      
      updateMilestone(milestone, cwd);
      return { status: 'ok', recorded_type: 'milestone' };
    }

    default:
      throw new Error(`Unknown type: ${input.type}`);
  }
}
