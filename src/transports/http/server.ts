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

type RouteParams = Record<string, string>;

interface RouteRequestContext {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  pathname: string;
}

interface RuntimeDeps {
  api: ReturnType<typeof createHttpApiHandlers>;
  mcpHandler: ReturnType<typeof createMcpHttpHandler>;
}

interface RouteHandlerDefinition extends RouteDefinition {
  match(pathname: string): RouteParams | null;
  handle(ctx: RouteRequestContext, params: RouteParams, deps: RuntimeDeps): Promise<void>;
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
  const methods = new Set<HttpMethod>();
  for (const route of ROUTE_HANDLERS) {
    if (route.match(pathname)) {
      methods.add(route.method);
    }
  }
  return Array.from(methods);
}

function matchExact(pathname: string): (input: string) => RouteParams | null {
  return (input: string) => (input === pathname ? {} : null);
}

function matchAny(paths: string[]): (input: string) => RouteParams | null {
  const allowed = new Set(paths);
  return (input: string) => (allowed.has(input) ? {} : null);
}

function matchChangeContextPath(pathname: string): RouteParams | null {
  const prefix = '/api/changes/';
  const suffix = '/context';
  if (!pathname.startsWith(prefix) || !pathname.endsWith(suffix)) {
    return null;
  }
  const encodedId = pathname.slice(prefix.length, pathname.length - suffix.length);
  return {
    changeId: decodeURIComponent(encodedId),
  };
}

const ROUTE_HANDLERS: RouteHandlerDefinition[] = [
  {
    method: 'GET',
    path: '/mcp',
    description: 'Open an MCP SSE stream for server-to-client messages or stream resumption.',
    match: matchExact('/mcp'),
    async handle({ req, res }, _params, deps) {
      await deps.mcpHandler.handle(req, res);
    },
  },
  {
    method: 'POST',
    path: '/mcp',
    description: 'Send MCP JSON-RPC requests over Streamable HTTP.',
    match: matchExact('/mcp'),
    async handle({ req, res }, _params, deps) {
      await deps.mcpHandler.handle(req, res);
    },
  },
  {
    method: 'DELETE',
    path: '/mcp',
    description: 'Terminate an MCP session.',
    match: matchExact('/mcp'),
    async handle({ req, res }, _params, deps) {
      await deps.mcpHandler.handle(req, res);
    },
  },
  {
    method: 'GET',
    path: '/ui',
    description: 'Open the Project Brain dashboard UI prototype.',
    match: matchAny(['/ui', '/ui/']),
    async handle({ res }) {
      sendText(res, 200, 'text/html; charset=utf-8', renderUiHtml());
    },
  },
  {
    method: 'GET',
    path: '/ui/styles.css',
    description: 'Serve dashboard UI styles.',
    match: matchExact('/ui/styles.css'),
    async handle({ res }) {
      sendText(res, 200, 'text/css; charset=utf-8', renderUiCss());
    },
  },
  {
    method: 'GET',
    path: '/ui/app.js',
    description: 'Serve dashboard UI client logic.',
    match: matchExact('/ui/app.js'),
    async handle({ res }) {
      sendText(res, 200, 'text/javascript; charset=utf-8', renderUiJs());
    },
  },
  {
    method: 'GET',
    path: '/',
    description: 'Describe the local Project Brain HTTP service.',
    match: matchExact('/'),
    async handle({ res }) {
      sendJson(res, 200, {
        service: 'project-brain-http',
        status: 'ok',
        transport: 'http',
        mcp_endpoint: '/mcp',
        ui_endpoint: '/ui',
        endpoints: ROUTES,
      });
    },
  },
  {
    method: 'GET',
    path: '/health',
    description: 'Return service health information.',
    match: matchExact('/health'),
    async handle({ res }) {
      sendJson(res, 200, {
        status: 'ok',
        service: 'project-brain-http',
        transport: 'http',
      });
    },
  },
  {
    method: 'GET',
    path: '/api',
    description: 'List HTTP API endpoints and supported query parameters.',
    match: matchExact('/api'),
    async handle({ res }) {
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
    },
  },
  {
    method: 'GET',
    path: '/api/dashboard',
    description: 'Inspect memory, activity, and next actions for a repository.',
    match: matchExact('/api/dashboard'),
    async handle({ res, url }, _params, deps) {
      const result = await deps.api.getDashboard({
        repo_path: getRepoPath(url),
        include_deep_analysis: parseBoolean(url.searchParams.get('include_deep_analysis')),
        recent_commits: parseNumber(url.searchParams.get('recent_commits')),
      });
      sendJson(res, 200, result as unknown as JsonRecord);
    },
  },
  {
    method: 'GET',
    path: '/api/context',
    description: 'Fetch lightweight project context for day-to-day execution.',
    match: matchExact('/api/context'),
    async handle({ res, url }, _params, deps) {
      const result = await deps.api.getProjectContext({
        repo_path: getRepoPath(url),
      });
      sendJson(res, 200, result as unknown as JsonRecord);
    },
  },
  {
    method: 'GET',
    path: '/api/changes/:changeId/context',
    description: 'Fetch detailed execution context for one change.',
    match: matchChangeContextPath,
    async handle({ res, url }, params, deps) {
      const changeId = params.changeId || '';
      const result = await deps.api.getChangeContext({
        repo_path: getRepoPath(url),
        change_id: changeId,
        recent_commits: parseNumber(url.searchParams.get('recent_commits')),
      });
      sendJson(res, 200, result as unknown as JsonRecord);
    },
  },
  {
    method: 'POST',
    path: '/api/init',
    description: 'Initialize or update the project identity anchor.',
    match: matchExact('/api/init'),
    async handle({ req, res }, _params, deps) {
      const body = await readJsonBody(req);
      const result = await deps.api.initializeProject(body as unknown as Parameters<typeof deps.api.initializeProject>[0]);
      sendJson(res, 200, result as unknown as JsonRecord);
    },
  },
  {
    method: 'POST',
    path: '/api/memory/ingest',
    description: 'Ingest one structured memory record.',
    match: matchExact('/api/memory/ingest'),
    async handle({ req, res }, _params, deps) {
      const body = await readJsonBody(req);
      const result = await deps.api.ingestMemory(body as unknown as Parameters<typeof deps.api.ingestMemory>[0]);
      sendJson(res, 200, result as unknown as JsonRecord);
    },
  },
  {
    method: 'PUT',
    path: '/api/project-spec',
    description: 'Update the stable project spec.',
    match: matchExact('/api/project-spec'),
    async handle({ req, res }, _params, deps) {
      const body = await readJsonBody(req);
      const result = await deps.api.updateProjectSpec(body as unknown as Parameters<typeof deps.api.updateProjectSpec>[0]);
      sendJson(res, 200, result as unknown as JsonRecord);
    },
  },
];

export function createHttpServer() {
  const api = createHttpApiHandlers();
  const mcpHandler = createMcpHttpHandler({
    allowedOrigins: getAllowedOriginsFromEnv(),
  });
  const deps: RuntimeDeps = { api, mcpHandler };

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

      const route = ROUTE_HANDLERS.find(candidate => {
        if (candidate.method !== req.method) {
          return false;
        }
        return candidate.match(pathname) !== null;
      });

      if (route) {
        const params = route.match(pathname);
        if (!params) {
          throw new HttpError(500, 'Route matcher produced inconsistent result.');
        }
        await route.handle({ req, res, url, pathname }, params, deps);
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
