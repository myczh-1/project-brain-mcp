import { createContextService } from '../../context/src/index.js';
import { createRuntime, createRuntimeService } from '../../runtime/src/index.js';
import { createHttpServer } from '../../transport-http/src/index.js';
import { createMcpHttpHandler } from '../../transport-mcp/src/index.js';
import { main as startServer } from '../../app/src/index.js';
import type { ContextService } from '../../context/src/index.js';
import type { RuntimeService } from '../../runtime/src/index.js';

export { createHttpServer } from '../../transport-http/src/index.js';
export { createMcpHttpHandler } from '../../transport-mcp/src/index.js';
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
