import type { GitPort } from '../ports/git.js';
import type { StoragePort } from '../ports/storage.js';
import { brainAnalyze, type BrainAnalyzeInput, type BrainAnalyzeOutput } from './analysis/brainAnalyze.js';
import { finishWork, type FinishWorkInput, type FinishWorkOutput } from './analysis/finishWork.js';
import { projectRecentActivity, type RecentActivityInput, type RecentActivityOutput } from './analysis/recentActivity.js';
import { changeContext, type ChangeContextInput, type ChangeContextOutput } from './context/getChangeContext.js';
import { contextBudgetPlan, type ContextBudgetPlanInput, type ContextBudgetPlanOutput } from './context/getContextBudgetPlan.js';
import { moduleContext, type ModuleContextInput, type ModuleContextOutput } from './context/getModuleContext.js';
import { projectContext, type ProjectContextInput, type ProjectContextOutput } from './context/getProjectContext.js';
import { listModules, type ListModulesInput, type ListModulesOutput } from './context/listModules.js';
import { brainDashboard, type DashboardToolInput, type DashboardToolOutput } from './dashboard/getDashboard.js';

export interface ContextService {
  getDashboard(input: DashboardToolInput): Promise<DashboardToolOutput>;
  getProjectContext(input: ProjectContextInput): Promise<ProjectContextOutput>;
  getChangeContext(input: ChangeContextInput): Promise<ChangeContextOutput>;
  listModules(input: ListModulesInput): Promise<ListModulesOutput>;
  getModuleContext(input: ModuleContextInput): Promise<ModuleContextOutput>;
  getContextBudgetPlan(input: ContextBudgetPlanInput): Promise<ContextBudgetPlanOutput>;
  getRecentActivity(input: RecentActivityInput): Promise<RecentActivityOutput>;
  analyze(input: BrainAnalyzeInput): Promise<BrainAnalyzeOutput>;
  finishWork(input: FinishWorkInput): Promise<FinishWorkOutput>;
}

export function createContextService(storage: StoragePort, git: GitPort): ContextService {
  return {
    getDashboard: (input) => brainDashboard(input, storage, git),
    getProjectContext: (input) => projectContext(input, storage, git),
    getChangeContext: (input) => changeContext(input, storage, git),
    listModules: (input) => listModules(input, storage),
    getModuleContext: (input) => moduleContext(input, storage, git),
    getContextBudgetPlan: (input) => contextBudgetPlan(input, storage, git),
    getRecentActivity: (input) => projectRecentActivity(input, git),
    analyze: (input) => brainAnalyze(input, storage, git),
    finishWork: (input) => finishWork(input, storage, git),
  };
}
