import {
  createContextService,
  defineProjectSpec,
  ingestMemory,
  projectInit,
  type ChangeContextInput,
  type DashboardToolInput,
  type DefineProjectSpecInput,
  type IngestMemoryInput,
  type ProjectContextInput,
  type ProjectInitInput,
} from '@myczh/project-brain/core';
import { createFsStorage, createFsGit } from '@myczh/project-brain/infra-fs';

export interface HttpApiHandlers {
  initializeProject(input: ProjectInitInput): ReturnType<typeof projectInit>;
  getDashboard(input: DashboardToolInput): ReturnType<ReturnType<typeof createContextService>['getDashboard']>;
  getProjectContext(input: ProjectContextInput): ReturnType<ReturnType<typeof createContextService>['getProjectContext']>;
  getChangeContext(input: ChangeContextInput): ReturnType<ReturnType<typeof createContextService>['getChangeContext']>;
  ingestMemory(input: IngestMemoryInput): ReturnType<typeof ingestMemory>;
  updateProjectSpec(input: DefineProjectSpecInput): ReturnType<typeof defineProjectSpec>;
}

export function createHttpApiHandlers(): HttpApiHandlers {
  const storage = createFsStorage();
  const git = createFsGit();
  const context = createContextService(storage, git);
  return {
    initializeProject: (input) => projectInit(input, storage),
    getDashboard: context.getDashboard,
    getProjectContext: context.getProjectContext,
    getChangeContext: context.getChangeContext,
    ingestMemory: (input) => ingestMemory(input, storage),
    updateProjectSpec: (input) => defineProjectSpec(input, storage),
  };
}
