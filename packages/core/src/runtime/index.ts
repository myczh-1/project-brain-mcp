import type { StoragePort } from '../ports/storage.js';
import type { GitPort } from '../ports/git.js';
import { createRuntimeService, type RuntimeService } from './service.js';
import type {
  RuntimeCommand,
  RuntimeCommandResult,
  RuntimeMessage,
  RuntimeMessageResult,
  RuntimeQuery,
  RuntimeQueryResult,
} from './protocol.js';

export { createRuntimeService } from './service.js';
export { parseRuntimeMessage, runtimeMessageSchema } from './protocol.js';
export type { RuntimeService, RuntimeStateSnapshot } from './service.js';
export type {
  RuntimeCommand,
  RuntimeCommandResult,
  RuntimeMessage,
  RuntimeMessageResult,
  RuntimeQuery,
  RuntimeQueryResult,
} from './protocol.js';

export interface Runtime {
  handle(message: RuntimeCommand): Promise<RuntimeCommandResult>;
  handle(message: RuntimeQuery): Promise<RuntimeQueryResult>;
  handle(message: RuntimeMessage): Promise<RuntimeMessageResult>;
}

export function createRuntime(
  storage: StoragePort,
  git: GitPort,
  defaultRepoPath?: string,
  service: RuntimeService = createRuntimeService(storage, git)
): Runtime {
  function handle(message: RuntimeCommand): Promise<RuntimeCommandResult>;
  function handle(message: RuntimeQuery): Promise<RuntimeQueryResult>;
  async function handle(message: RuntimeMessage): Promise<RuntimeMessageResult> {
    switch (message.type) {
      case 'initialize_project':
        return service.initializeProject(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'define_project_spec':
        return service.defineProjectSpec(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'create_change':
        return service.createChange(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'update_change':
        return service.updateChange(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'log_decision':
        return service.logDecision(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'capture_note':
        return service.captureNote(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'record_progress':
        return service.recordProgress(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'start_work':
        return service.startWork(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'checkpoint_work':
        return service.checkpointWork(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'ingest_memory':
        return service.ingestMemory(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'finish_work':
        return service.finishWork(withRequiredRepoPath(message.input, defaultRepoPath));
      case 'get_dashboard':
        return service.getDashboard(withConfiguredRepoPath(message.input, defaultRepoPath));
      case 'get_project_context':
        return service.getProjectContext(withConfiguredRepoPath(message.input, defaultRepoPath));
      case 'get_change_context':
        return service.getChangeContext(withConfiguredRepoPath(message.input, defaultRepoPath));
      case 'list_modules':
        return service.listModules(withConfiguredRepoPath(message.input, defaultRepoPath));
      case 'get_module_context':
        return service.getModuleContext(withConfiguredRepoPath(message.input, defaultRepoPath));
      case 'get_context_budget_plan':
        return service.getContextBudgetPlan(withConfiguredRepoPath(message.input, defaultRepoPath));
      case 'get_recent_activity':
        return service.getRecentActivity(withConfiguredRepoPath(message.input, defaultRepoPath));
      case 'analyze':
        return service.analyze(withConfiguredRepoPath(message.input, defaultRepoPath));
      case 'get_state':
        return service.getState(message.repo_path || defaultRepoPath);
      default:
        return assertNever(message);
    }
  }

  return {
    handle,
  };
}

function withConfiguredRepoPath<T extends { repo_path: string }>(input: T, defaultRepoPath?: string): T {
  if (input.repo_path) {
    return input;
  }

  if (defaultRepoPath) {
    return { ...input, repo_path: defaultRepoPath };
  }

  throw new Error('repo_path is required when the runtime has no configured default repository path.');
}

function withRequiredRepoPath<T extends { repo_path: string }>(input: T, defaultRepoPath?: string): T {
  return withConfiguredRepoPath(input, defaultRepoPath);
}

function assertNever(value: never): never {
  throw new Error(`Unsupported runtime message: ${JSON.stringify(value)}`);
}
