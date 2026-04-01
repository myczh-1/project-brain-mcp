import { main as startServer } from '@myczh/project-brain/app';
import {
  createContextService,
  createRuntime,
  createRuntimeService,
  type ContextService,
  type RuntimeService,
} from '@myczh/project-brain/application';
import { createHttpServer } from '@myczh/project-brain/transport-http';
import { createMcpHttpHandler } from '@myczh/project-brain/transport-mcp';

export { createHttpServer } from '@myczh/project-brain/transport-http';
export { createMcpHttpHandler } from '@myczh/project-brain/transport-mcp';
export { startServer };

export interface ServiceMode {
  runtime: ReturnType<typeof createRuntime>;
  runtimeService: RuntimeService;
  contextService: ContextService;
  createHttpServer: typeof createHttpServer;
  createMcpHttpHandler: typeof createMcpHttpHandler;
  startServer: typeof startServer;
}

export function createServiceMode(defaultRepoPath?: string): ServiceMode {
  const runtimeService = createRuntimeService();
  const runtime = createRuntime(defaultRepoPath, runtimeService);
  const contextService = createContextService();

  return {
    runtime,
    runtimeService,
    contextService,
    createHttpServer,
    createMcpHttpHandler,
    startServer,
  };
}
