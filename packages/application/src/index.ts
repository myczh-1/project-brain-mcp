export * from './commands/index.js';
export { createContextService } from '@myczh/project-brain/context';
export type {
  BrainAnalyzeInput,
  BrainAnalyzeOutput,
  ChangeContextInput,
  ChangeContextOutput,
  ContextService,
  DashboardToolInput,
  DashboardToolOutput,
  FinishWorkInput,
  FinishWorkOutput,
  ProjectContextInput,
  ProjectContextOutput,
  RecentActivityInput,
  RecentActivityOutput,
  SuggestNextActionsInput,
  SuggestNextActionsOutput,
} from '@myczh/project-brain/context';

export { createRuntime, createRuntimeService } from '@myczh/project-brain/runtime';
export type {
  RuntimeCommand,
  RuntimeCommandResult,
  RuntimeMessage,
  RuntimeMessageResult,
  RuntimeQuery,
  RuntimeQueryResult,
  RuntimeService,
  RuntimeStateSnapshot,
} from '@myczh/project-brain/runtime';
