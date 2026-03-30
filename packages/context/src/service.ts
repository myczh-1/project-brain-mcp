import { brainAnalyze, type BrainAnalyzeInput, type BrainAnalyzeOutput } from './analysis/brainAnalyze.js';
import { finishWork, type FinishWorkInput, type FinishWorkOutput } from './analysis/finishWork.js';
import { projectRecentActivity, type RecentActivityInput, type RecentActivityOutput } from './analysis/recentActivity.js';
import { suggestNextActionsTool, type SuggestNextActionsInput, type SuggestNextActionsOutput } from './analysis/suggestNextActions.js';
import { changeContext, type ChangeContextInput, type ChangeContextOutput } from './context/getChangeContext.js';
import { projectContext, type ProjectContextInput, type ProjectContextOutput } from './context/getProjectContext.js';
import { brainDashboard, type DashboardToolInput, type DashboardToolOutput } from './dashboard/getDashboard.js';

export interface ContextService {
  getDashboard(input: DashboardToolInput): Promise<DashboardToolOutput>;
  getProjectContext(input: ProjectContextInput): Promise<ProjectContextOutput>;
  getChangeContext(input: ChangeContextInput): Promise<ChangeContextOutput>;
  getRecentActivity(input: RecentActivityInput): Promise<RecentActivityOutput>;
  suggestNextActions(input: SuggestNextActionsInput): Promise<SuggestNextActionsOutput>;
  analyze(input: BrainAnalyzeInput): Promise<BrainAnalyzeOutput>;
  finishWork(input: FinishWorkInput): Promise<FinishWorkOutput>;
}

export function createContextService(): ContextService {
  return {
    getDashboard: brainDashboard,
    getProjectContext: projectContext,
    getChangeContext: changeContext,
    getRecentActivity: projectRecentActivity,
    suggestNextActions: suggestNextActionsTool,
    analyze: brainAnalyze,
    finishWork,
  };
}
