import { appendProgress, ProgressEntry } from '../../core/storage/progress.js';
import { updateMilestone, Milestone } from '../../core/storage/milestones.js';

export interface RecordProgressInput {
  type: 'progress' | 'milestone';
  repo_path?: string;
  
  progress?: {
    summary: string;
    status?: 'planned' | 'in_progress' | 'blocked' | 'done';
    blockers?: string[];
    related_change_id?: string;
    confidence: 'low' | 'mid' | 'high';
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
  progress_id?: string;
}

export async function recordProgress(input: RecordProgressInput): Promise<RecordProgressOutput> {
  const cwd = input.repo_path || process.cwd();

  switch (input.type) {
    case 'progress': {
      if (!input.progress) {
        throw new Error('progress data required when type is "progress"');
      }
      
      const entry: ProgressEntry = {
        id: `progress-${Date.now()}`,
        date: new Date().toISOString(),
        summary: input.progress.summary,
        status: input.progress.status,
        blockers: input.progress.blockers,
        related_change_id: input.progress.related_change_id,
        confidence: input.progress.confidence,
      };
      
      appendProgress(entry, cwd);
      return { status: 'ok', recorded_type: 'progress', progress_id: entry.id };
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
