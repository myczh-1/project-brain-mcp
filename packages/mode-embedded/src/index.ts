import { createRuntime, createRuntimeService } from '../../runtime/src/index.js';
import type {
  RuntimeCommand,
  RuntimeCommandResult,
  RuntimeMessage,
  RuntimeMessageResult,
  RuntimeQuery,
  RuntimeQueryResult,
  RuntimeService,
} from '../../runtime/src/index.js';

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
