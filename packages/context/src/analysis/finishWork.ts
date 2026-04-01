import { createRuntimeService } from '@myczh/project-brain/runtime';
import { brainAnalyze } from './brainAnalyze.js';
import { suggestNextActionsTool } from './suggestNextActions.js';
import type { CheckpointWorkInput } from '@myczh/project-brain/protocol/runtime';

export interface FinishWorkInput {
  repo_path?: string;
  change_id: string;
  final_status?: 'done' | 'dropped';
  summary_patch?: CheckpointWorkInput['change_patch'];
  final_progress?: CheckpointWorkInput['progress'];
  note?: CheckpointWorkInput['note'];
  reflection?: {
    recent_commits?: number;
    next_action_limit?: number;
  };
}

export interface FinishWorkOutput {
  status: 'ok';
  change_id: string;
  final_status: 'done' | 'dropped';
  updated_change?: Awaited<ReturnType<ReturnType<typeof createRuntimeService>['checkpointWork']>>['updated_change'];
  change_path?: string;
  progress_id?: string;
  note_id?: string;
  reflection: {
    summary: string;
    confidence: string;
    top_next_actions: Awaited<ReturnType<typeof suggestNextActionsTool>>['next_actions'];
  };
}

export async function finishWork(input: FinishWorkInput): Promise<FinishWorkOutput> {
  const cwd = input.repo_path || process.cwd();
  const finalStatus = input.final_status || 'done';
  const runtime = createRuntimeService();

  const checkpoint = await runtime.checkpointWork({
    repo_path: cwd,
    change_id: input.change_id,
    change_patch: {
      ...input.summary_patch,
      status: finalStatus,
    },
    progress: input.final_progress,
    note: input.note,
  });

  const analysis = await brainAnalyze({
    repo_path: cwd,
    depth: 'quick',
    recent_commits: input.reflection?.recent_commits,
  });

  const nextActions = await suggestNextActionsTool({
    repo_path: cwd,
    recent_commits: input.reflection?.recent_commits,
    limit: input.reflection?.next_action_limit || 3,
  });

  return {
    status: 'ok',
    change_id: input.change_id,
    final_status: finalStatus,
    updated_change: checkpoint.updated_change,
    change_path: checkpoint.change_path,
    progress_id: checkpoint.progress_id,
    note_id: checkpoint.note_id,
    reflection: {
      summary: analysis.summary,
      confidence: analysis.confidence,
      top_next_actions: nextActions.next_actions,
    },
  };
}
