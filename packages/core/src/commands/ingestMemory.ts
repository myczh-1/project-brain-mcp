import type { StoragePort } from '../ports/storage.js';
import { createMemoryHandlers } from './ingestMemory/handlers.js';
import type { MemoryPayload, MemoryType } from './ingestMemory/shared.js';

export interface IngestMemoryInput {
  repo_path: string;
  memory: {
    type: MemoryType;
    payload: MemoryPayload;
    source?: string;
    confirmed_by_user?: boolean;
  };
}

export interface IngestMemoryOutput {
  status: 'ok' | 'rejected';
  recorded_type: MemoryType;
  routed_to?: string;
  created_id?: string;
  message: string;
  warnings?: string[];
}

function validateConfirmed(input: IngestMemoryInput): string | null {
  if (input.memory.confirmed_by_user !== true) {
    return 'confirmed_by_user=true is required before ingesting memory.';
  }
  return null;
}

const MEMORY_HANDLERS = createMemoryHandlers();

export async function ingestMemory(input: IngestMemoryInput, storage: StoragePort): Promise<IngestMemoryOutput> {
  const cwd = input.repo_path;
  const type = input.memory.type;
  const payload = input.memory.payload;
  const handler = MEMORY_HANDLERS[type as keyof typeof MEMORY_HANDLERS];

  if (!handler) {
    return {
      status: 'rejected',
      recorded_type: type,
      message: 'Unsupported memory type.',
    };
  }

  const confirmError = validateConfirmed(input);
  if (confirmError) {
    return {
      status: 'rejected',
      recorded_type: type,
      message: confirmError,
    };
  }

  const validationError = handler.validate(payload);
  if (validationError) {
    return {
      status: 'rejected',
      recorded_type: type,
      message: validationError,
    };
  }

  const warnings = handler.warnings(payload);
  const result = await handler.execute({
    cwd,
    payload,
    source: input.memory.source,
    type,
    storage,
  });

  return {
    ...result,
    recorded_type: type,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
