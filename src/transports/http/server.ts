import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { createHttpApiHandlers } from '../../service/api/index.js';

type JsonRecord = Record<string, unknown>;

function sendJson(res: ServerResponse, statusCode: number, body: JsonRecord) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  });
  res.end(payload);
}

async function readJsonBody(req: IncomingMessage): Promise<JsonRecord> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) {
    return {};
  }

  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('JSON body must be an object.');
  }

  return parsed as JsonRecord;
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getRepoPath(url: URL): string | undefined {
  return url.searchParams.get('repo_path') || undefined;
}

export function createHttpServer() {
  const api = createHttpApiHandlers();

  return createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        sendJson(res, 400, { error: 'Missing request URL or method.' });
        return;
      }

      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
          'access-control-allow-headers': 'Content-Type',
        });
        res.end();
        return;
      }

      const url = new URL(req.url, 'http://127.0.0.1');
      const { pathname } = url;

      if (req.method === 'GET' && pathname === '/health') {
        sendJson(res, 200, {
          status: 'ok',
          service: 'project-brain-http',
          transport: 'http',
        });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/dashboard') {
        const result = await api.getDashboard({
          repo_path: getRepoPath(url),
          include_deep_analysis: parseBoolean(url.searchParams.get('include_deep_analysis')),
          recent_commits: parseNumber(url.searchParams.get('recent_commits')),
        });
        sendJson(res, 200, result as unknown as JsonRecord);
        return;
      }

      if (req.method === 'GET' && pathname === '/api/context') {
        const result = await api.getProjectContext({
          repo_path: getRepoPath(url),
        });
        sendJson(res, 200, result as unknown as JsonRecord);
        return;
      }

      if (req.method === 'GET' && pathname.startsWith('/api/changes/') && pathname.endsWith('/context')) {
        const changeId = decodeURIComponent(pathname.replace(/^\/api\/changes\//, '').replace(/\/context$/, ''));
        const result = await api.getChangeContext({
          repo_path: getRepoPath(url),
          change_id: changeId,
          recent_commits: parseNumber(url.searchParams.get('recent_commits')),
        });
        sendJson(res, 200, result as unknown as JsonRecord);
        return;
      }

      if (req.method === 'POST' && pathname === '/api/init') {
        const body = await readJsonBody(req);
        const result = await api.initializeProject(body as unknown as Parameters<typeof api.initializeProject>[0]);
        sendJson(res, 200, result as unknown as JsonRecord);
        return;
      }

      if (req.method === 'POST' && pathname === '/api/memory/ingest') {
        const body = await readJsonBody(req);
        const result = await api.ingestMemory(body as unknown as Parameters<typeof api.ingestMemory>[0]);
        sendJson(res, 200, result as unknown as JsonRecord);
        return;
      }

      if (req.method === 'PUT' && pathname === '/api/project-spec') {
        const body = await readJsonBody(req);
        const result = await api.updateProjectSpec(body as unknown as Parameters<typeof api.updateProjectSpec>[0]);
        sendJson(res, 200, result as unknown as JsonRecord);
        return;
      }

      sendJson(res, 404, {
        error: 'Not found',
        path: pathname,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  });
}
