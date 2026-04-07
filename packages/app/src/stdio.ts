import { createRuntime, type RuntimeMessage } from '@myczh/project-brain/core';
import { createFsGit, createFsStorage } from '@myczh/project-brain/infra-fs';
import * as readline from 'readline';

export interface StdioRequest {
  id?: string | number | null;
  message: RuntimeMessage;
}

export interface StdioSuccessResponse {
  id: string | number | null;
  ok: true;
  result: unknown;
}

export interface StdioErrorResponse {
  id: string | number | null;
  ok: false;
  error: {
    message: string;
  };
}

export type StdioResponse = StdioSuccessResponse | StdioErrorResponse;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validateRequest(value: unknown): StdioRequest {
  if (!isObject(value)) {
    throw new Error('Request must be a JSON object.');
  }
  if (!('message' in value)) {
    throw new Error('Request must include a "message" field.');
  }
  return {
    id: (value.id as string | number | null | undefined) ?? null,
    message: value.message as RuntimeMessage,
  };
}

export async function handleStdioLine(
  line: string,
  handle: (message: RuntimeMessage) => Promise<unknown>
): Promise<StdioResponse | null> {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  let request: StdioRequest;
  try {
    request = validateRequest(JSON.parse(trimmed));
  } catch (error) {
    return {
      id: null,
      ok: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }

  try {
    const result = await handle(request.message);
    return {
      id: request.id ?? null,
      ok: true,
      result,
    };
  } catch (error) {
    return {
      id: request.id ?? null,
      ok: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export async function runStdio(): Promise<void> {
  const storage = createFsStorage();
  const git = createFsGit();
  const runtime = createRuntime(storage, git, process.cwd());
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const response = await handleStdioLine(line, runtime.handle);
    if (!response) {
      continue;
    }
    process.stdout.write(`${JSON.stringify(response)}\n`);
  }
}
