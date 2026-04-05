export type { StoragePort } from './ports/storage.js';
export type {
  ChangeSpec,
  ChangeStatus,
  Decision,
  Manifest,
  Milestone,
  NextAction,
  Note,
  ProgressEntry,
  ProjectSpec,
} from './ports/storage.js';

export type { GitPort } from './ports/git.js';
export type { Commit, HotPath } from './ports/git.js';

export {
  projectInit,
  defineProjectSpec,
  createChange,
  updateChange,
  logDecision,
  projectCaptureNote,
  recordProgress,
  startWork,
  checkpointWork,
  ingestMemory,
} from './commands/index.js';
export type {
  ProjectInitInput,
  ProjectInitOutput,
  DefineProjectSpecInput,
  DefineProjectSpecOutput,
  CreateChangeInput,
  CreateChangeOutput,
  UpdateChangeInput,
  UpdateChangeOutput,
  LogDecisionInput,
  LogDecisionOutput,
  CaptureNoteInput,
  CaptureNoteOutput,
  RecordProgressInput,
  RecordProgressOutput,
  StartWorkInput,
  StartWorkOutput,
  CheckpointWorkInput,
  CheckpointWorkOutput,
  IngestMemoryInput,
  IngestMemoryOutput,
} from './commands/index.js';

export { createContextService } from './queries/index.js';
export type { ContextService } from './queries/index.js';
export type {
  BrainAnalyzeInput,
  BrainAnalyzeOutput,
  FinishWorkInput,
  FinishWorkOutput,
  RecentActivityInput,
  RecentActivityOutput,
  SuggestNextActionsInput,
  SuggestNextActionsOutput,
  ChangeContextInput,
  ChangeContextOutput,
  ContextBudgetPlanInput,
  ContextBudgetPlanOutput,
  BudgetMode,
  ProjectContextInput,
  ProjectContextOutput,
  DashboardToolInput,
  DashboardToolOutput,
  DashboardData,
} from './queries/index.js';

export {
  generateContextText,
  estimateProgressOverview,
  inferFocus,
  inferMilestoneSignals,
  detectLocale,
  getTemplates,
  templates,
  recommendNextActions,
} from './understanding/index.js';
export type {
  ContextData,
  Completion,
  Momentum,
  StalenessRisk,
  ProgressOverview,
  FocusInference,
  MilestoneSignal,
  I18nTemplates,
  ActionRecommendation,
} from './understanding/index.js';
