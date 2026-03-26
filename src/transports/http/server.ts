import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { createHttpApiHandlers } from '../../service/api/index.js';
import { createMcpHttpHandler } from '../mcp/server.js';
import { renderUiCss, renderUiHtml, renderUiJs } from './ui.js';

type JsonRecord = Record<string, unknown>;
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RouteDefinition {
  method: HttpMethod;
  path: string;
  description: string;
}

class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const ROUTES: RouteDefinition[] = [
  { method: 'GET', path: '/', description: 'Describe the local Project Brain HTTP service.' },
  { method: 'GET', path: '/health', description: 'Return service health information.' },
  { method: 'GET', path: '/api', description: 'List HTTP API endpoints and supported query parameters.' },
  { method: 'GET', path: '/ui', description: 'Open the Project Brain dashboard UI prototype.' },
  { method: 'GET', path: '/ui/styles.css', description: 'Serve dashboard UI styles.' },
  { method: 'GET', path: '/ui/app.js', description: 'Serve dashboard UI client logic.' },
  {
    method: 'GET',
    path: '/api/dashboard',
    description: 'Inspect memory, activity, and next actions for a repository.',
  },
  {
    method: 'GET',
    path: '/api/context',
    description: 'Fetch lightweight project context for day-to-day execution.',
  },
  {
    method: 'GET',
    path: '/api/changes/:changeId/context',
    description: 'Fetch detailed execution context for one change.',
  },
  {
    method: 'POST',
    path: '/api/init',
    description: 'Initialize or update the project identity anchor.',
  },
  {
    method: 'POST',
    path: '/api/memory/ingest',
    description: 'Ingest one structured memory record.',
  },
  {
    method: 'PUT',
    path: '/api/project-spec',
    description: 'Update the stable project spec.',
  },
  {
    method: 'POST',
    path: '/mcp',
    description: 'Send MCP JSON-RPC requests over Streamable HTTP.',
  },
  {
    method: 'GET',
    path: '/mcp',
    description: 'Open an MCP SSE stream for server-to-client messages or stream resumption.',
  },
  {
    method: 'DELETE',
    path: '/mcp',
    description: 'Terminate an MCP session.',
  },
];

function sendNoContent(res: ServerResponse, statusCode: number) {
  res.writeHead(statusCode, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  });
  res.end();
}

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

function sendText(
  res: ServerResponse,
  statusCode: number,
  contentType: string,
  body: string
) {
  res.writeHead(statusCode, {
    'content-type': contentType,
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  });
  res.end(body);
}

async function readJsonBody(req: IncomingMessage): Promise<JsonRecord> {
  validateJsonRequest(req);

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

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new HttpError(400, 'JSON body must be an object.');
  }

  return parsed as JsonRecord;
}

function validateJsonRequest(req: IncomingMessage) {
  const contentType = req.headers['content-type'];
  if (!contentType) {
    return;
  }

  const normalized = contentType.toLowerCase();
  if (!normalized.includes('application/json')) {
    throw new HttpError(415, 'Request body must use Content-Type: application/json.');
  }
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new HttpError(400, `Expected boolean query value "true" or "false", received "${value}".`);
}

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new HttpError(400, `Expected numeric query value, received "${value}".`);
  }
  return parsed;
}

function getRepoPath(url: URL): string | undefined {
  return url.searchParams.get('repo_path') || undefined;
}

function getAllowedOriginsFromEnv() {
  const configured = process.env.PROJECT_BRAIN_ALLOWED_ORIGINS
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  if (configured && configured.length > 0) {
    return configured;
  }

  return [
    'http://127.0.0.1',
    'http://localhost',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3210',
    'http://localhost:3210',
  ];
}

function getAllowedMethods(pathname: string): HttpMethod[] {
  if (pathname === '/mcp') {
    return ['GET', 'POST', 'DELETE'];
  }
  if (pathname === '/ui' || pathname === '/ui/' || pathname === '/ui/styles.css' || pathname === '/ui/app.js') {
    return ['GET'];
  }
  if (pathname === '/' || pathname === '/health' || pathname === '/api') {
    return ['GET'];
  }
  if (pathname === '/api/dashboard' || pathname === '/api/context') {
    return ['GET'];
  }
  if (pathname.startsWith('/api/changes/') && pathname.endsWith('/context')) {
    return ['GET'];
  }
  if (pathname === '/api/init' || pathname === '/api/memory/ingest') {
    return ['POST'];
  }
  if (pathname === '/api/project-spec') {
    return ['PUT'];
  }
  return [];
}

export function createHttpServer() {
  const api = createHttpApiHandlers();
  const mcpHandler = createMcpHttpHandler({
    allowedOrigins: getAllowedOriginsFromEnv(),
  });

  return createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        sendJson(res, 400, { error: 'Missing request URL or method.' });
        return;
      }

      if (req.method === 'OPTIONS') {
        sendNoContent(res, 204);
        return;
      }

      const url = new URL(req.url, 'http://127.0.0.1');
      const { pathname } = url;
      const allowedMethods = getAllowedMethods(pathname);

      if (allowedMethods.length > 0 && !allowedMethods.includes(req.method as HttpMethod)) {
        res.setHeader('allow', allowedMethods.join(', '));
        sendJson(res, 405, {
          error: 'Method not allowed',
          method: req.method,
          path: pathname,
          allowed_methods: allowedMethods,
        });
        return;
      }

      if (pathname === '/mcp') {
        await mcpHandler.handle(req, res);
        return;
      }

      if (req.method === 'GET' && (pathname === '/ui' || pathname === '/ui/')) {
        sendText(res, 200, 'text/html; charset=utf-8', renderUiHtml());
        return;
      }

      if (req.method === 'GET' && pathname === '/ui/styles.css') {
        sendText(res, 200, 'text/css; charset=utf-8', renderUiCss());
        return;
      }

      if (req.method === 'GET' && pathname === '/ui/app.js') {
        sendText(res, 200, 'text/javascript; charset=utf-8', renderUiJs());
        return;
      }

      if (req.method === 'GET' && pathname === '/') {
        sendJson(res, 200, {
          service: 'project-brain-http',
          status: 'ok',
          transport: 'http',
          mcp_endpoint: '/mcp',
          ui_endpoint: '/ui',
          endpoints: ROUTES,
        });
        return;
      }

      if (req.method === 'GET' && pathname === '/health') {
        sendJson(res, 200, {
          status: 'ok',
          service: 'project-brain-http',
          transport: 'http',
        });
        return;
      }

      if (req.method === 'GET' && pathname === '/api') {
        sendJson(res, 200, {
          service: 'project-brain-http',
          base_path: '/api',
          mcp_endpoint: '/mcp',
          query_parameters: {
            repo_path: 'Optional repository path for read routes.',
            recent_commits: 'Optional commit window for dashboard or change context.',
            include_deep_analysis: 'Optional boolean toggle for dashboard depth.',
          },
          endpoints: ROUTES.filter(route => route.path.startsWith('/api')),
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
      if (error instanceof HttpError) {
        sendJson(res, error.statusCode, { error: error.message });
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  });
}
