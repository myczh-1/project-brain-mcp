import { createRuntime, createRuntimeService } from '@myczh/project-brain/application';
import type {
  RuntimeCommand,
  RuntimeCommandResult,
  RuntimeMessage,
  RuntimeMessageResult,
  RuntimeQuery,
  RuntimeQueryResult,
  RuntimeService,
} from '@myczh/project-brain/application';

export type {
  RuntimeCommand,
  RuntimeCommandResult,
  RuntimeMessage,
  RuntimeMessageResult,
  RuntimeQuery,
  RuntimeQueryResult,
  RuntimeService,
};

export interface EmbeddedMode {
  handle(message: RuntimeMessage): Promise<RuntimeMessageResult>;
  write(message: RuntimeCommand): Promise<RuntimeCommandResult>;
  read(message: RuntimeQuery): Promise<RuntimeQueryResult>;
  service: RuntimeService;
}

export function createEmbeddedMode(
  defaultRepoPath?: string,
  service: RuntimeService = createRuntimeService()
): EmbeddedMode {
  const runtime = createRuntime(defaultRepoPath, service);

  return {
    handle: runtime.handle,
    async write(message) {
      return runtime.handle(message) as Promise<RuntimeCommandResult>;
    },
    async read(message) {
      return runtime.handle(message) as Promise<RuntimeQueryResult>;
    },
    service,
  };
}
