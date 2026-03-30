import { createContextService } from '../../context/src/index.js';
import { createRuntimeService } from '../../runtime/src/index.js';
import type { DashboardToolInput } from '../../context/src/dashboard/getDashboard.js';
import type { ChangeContextInput } from '../../context/src/context/getChangeContext.js';
import type { ProjectContextInput } from '../../context/src/context/getProjectContext.js';
import type { DefineProjectSpecInput } from '../../core-protocol/src/runtime/defineProjectSpec.js';
import type { IngestMemoryInput } from '../../core-protocol/src/runtime/ingestMemory.js';
import type { ProjectInitInput } from '../../core-protocol/src/runtime/initializeProject.js';

export interface HttpApiHandlers {
  initializeProject(input: ProjectInitInput): ReturnType<ReturnType<typeof createRuntimeService>['initializeProject']>;
  getDashboard(input: DashboardToolInput): ReturnType<ReturnType<typeof createContextService>['getDashboard']>;
  getProjectContext(input: ProjectContextInput): ReturnType<ReturnType<typeof createContextService>['getProjectContext']>;
  getChangeContext(input: ChangeContextInput): ReturnType<ReturnType<typeof createContextService>['getChangeContext']>;
  ingestMemory(input: IngestMemoryInput): ReturnType<ReturnType<typeof createRuntimeService>['ingestMemory']>;
  updateProjectSpec(input: DefineProjectSpecInput): ReturnType<ReturnType<typeof createRuntimeService>['defineProjectSpec']>;
}

export function createHttpApiHandlers(): HttpApiHandlers {
  const runtime = createRuntimeService();
  const context = createContextService();
  return {
    initializeProject: runtime.initializeProject,
    getDashboard: context.getDashboard,
    getProjectContext: context.getProjectContext,
    getChangeContext: context.getChangeContext,
    ingestMemory: runtime.ingestMemory,
    updateProjectSpec: runtime.defineProjectSpec,
  };
}
