import { projectInit, ProjectInitInput } from '../project/initializeProject.js';
import { brainDashboard, DashboardToolInput } from '../dashboard/getDashboard.js';
import { projectContext, ProjectContextInput } from '../context/getProjectContext.js';
import { changeContext, ChangeContextInput } from '../context/getChangeContext.js';
import { ingestMemory, IngestMemoryInput } from '../memory/ingestMemory.js';
import { defineProjectSpec, DefineProjectSpecInput } from '../internal/defineProjectSpec.js';

export interface HttpApiHandlers {
  initializeProject(input: ProjectInitInput): ReturnType<typeof projectInit>;
  getDashboard(input: DashboardToolInput): ReturnType<typeof brainDashboard>;
  getProjectContext(input: ProjectContextInput): ReturnType<typeof projectContext>;
  getChangeContext(input: ChangeContextInput): ReturnType<typeof changeContext>;
  ingestMemory(input: IngestMemoryInput): ReturnType<typeof ingestMemory>;
  updateProjectSpec(input: DefineProjectSpecInput): ReturnType<typeof defineProjectSpec>;
}

export function createHttpApiHandlers(): HttpApiHandlers {
  return {
    initializeProject: projectInit,
    getDashboard: brainDashboard,
    getProjectContext: projectContext,
    getChangeContext: changeContext,
    ingestMemory,
    updateProjectSpec: defineProjectSpec,
  };
}
