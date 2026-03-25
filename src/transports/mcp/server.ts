import { randomUUID } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { projectInit } from '../../service/project/initializeProject.js';
import { changeContext } from '../../service/context/getChangeContext.js';
import { projectContext } from '../../service/context/getProjectContext.js';
import { ingestMemory } from '../../service/memory/ingestMemory.js';
import { brainDashboard } from '../../service/dashboard/getDashboard.js';

function toTextContent(payload: unknown) {
  return [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }];
}

function toStructuredContent(payload: unknown) {
  return payload as unknown as Record<string, unknown>;
}

function createProjectBrainMcpServer() {
  const server = new McpServer(
    {
      name: 'project-brain',
      version: '0.0.3',
    },
    {
      capabilities: {
        tools: {
          listChanged: true,
        },
      },
      instructions:
        'Project Brain provides project memory, context, change context, initialization, and structured memory ingest over MCP Streamable HTTP.',
    }
  );

  server.registerTool(
    'brain_dashboard',
    {
      description: 'Inspect the current project memory and status through a unified dashboard view.',
      inputSchema: {
        repo_path: z.string().optional(),
        include_deep_analysis: z.boolean().optional(),
        recent_commits: z.number().optional(),
      },
    },
    async ({ repo_path, include_deep_analysis, recent_commits }) => {
      const result = await brainDashboard({
        repo_path,
        include_deep_analysis,
        recent_commits,
      });

      return {
        content: [{ type: 'text', text: result.summary }],
        structuredContent: toStructuredContent(result.dashboard),
      };
    }
  );

  server.registerTool(
    'brain_init',
    {
      description: 'Initialize or update the project identity anchor for this repository.',
      inputSchema: {
        repo_path: z.string().optional(),
        answers: z
          .object({
            project_name: z.string().optional(),
            summary: z.string().optional(),
            repo_type: z.string().optional(),
            primary_stack: z.array(z.string()).optional(),
            long_term_goal: z.string().optional(),
          })
          .optional(),
      },
    },
    async ({ repo_path, answers }) => {
      const result = await projectInit({
        repo_path,
        answers,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_change_context',
    {
      description:
        'Get detailed execution context for a specific change before making a larger decision or implementation move.',
      inputSchema: {
        repo_path: z.string().optional(),
        change_id: z.string(),
        recent_commits: z.number().optional(),
      },
    },
    async ({ repo_path, change_id, recent_commits }) => {
      const result = await changeContext({
        repo_path,
        change_id,
        recent_commits,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_ingest_memory',
    {
      description: 'Validate and ingest a single structured memory record from user input or GPT output.',
      inputSchema: {
        repo_path: z.string().optional(),
        memory: z.object({
          type: z.enum(['project_spec', 'change_spec', 'decision', 'note', 'progress']),
          confirmed_by_user: z.boolean(),
          source: z.string().optional(),
          payload: z.record(z.string(), z.unknown()),
        }),
      },
    },
    async ({ repo_path, memory }) => {
      const result = await ingestMemory({
        repo_path,
        memory: memory as unknown as Parameters<typeof ingestMemory>[0]['memory'],
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_context',
    {
      description: 'Get lightweight project context for everyday coding conversations.',
      inputSchema: {
        repo_path: z.string().optional(),
      },
    },
    async ({ repo_path }) => {
      const result = await projectContext({
        repo_path,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  return server;
}

type SessionTransport = StreamableHTTPServerTransport;

export interface McpHttpHandlerOptions {
  allowedOrigins?: string[];
}

export function createMcpHttpHandler(options: McpHttpHandlerOptions = {}) {
  const transports = new Map<string, SessionTransport>();
  const allowedOrigins = new Set(options.allowedOrigins || []);

  const validateOrigin = (req: IncomingMessage) => {
    const origin = req.headers.origin;
    if (!origin) {
      return;
    }

    if (allowedOrigins.size === 0) {
      throw new Error('Origin validation requires at least one allowed origin.');
    }

    if (!allowedOrigins.has(origin)) {
      throw new Error(`Origin not allowed: ${origin}`);
    }
  };

  const createTransport = () => {
    let transport: SessionTransport;

    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: sessionId => {
        transports.set(sessionId, transport);
      },
    });

    transport.onclose = () => {
      const sessionId = transport.sessionId;
      if (sessionId) {
        transports.delete(sessionId);
      }
    };

    return transport;
  };

  const respondJsonRpcError = (res: ServerResponse, statusCode: number, message: string) => {
    res.writeHead(statusCode, {
      'content-type': 'application/json; charset=utf-8',
    });
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message,
        },
        id: null,
      })
    );
  };

  return {
    async handle(req: IncomingMessage, res: ServerResponse) {
      try {
        validateOrigin(req);

        const sessionIdHeader = req.headers['mcp-session-id'];
        const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }

          const raw = Buffer.concat(chunks).toString('utf-8').trim();
          const parsedBody = raw ? (JSON.parse(raw) as unknown) : undefined;

          if (sessionId) {
            const transport = transports.get(sessionId);
            if (!transport) {
              respondJsonRpcError(res, 404, `Session not found: ${sessionId}`);
              return;
            }

            await transport.handleRequest(req, res, parsedBody);
            return;
          }

          if (!parsedBody || !isInitializeRequest(parsedBody)) {
            respondJsonRpcError(
              res,
              400,
              'Initialization request required before using the Project Brain MCP endpoint.'
            );
            return;
          }

          const transport = createTransport();
          const server = createProjectBrainMcpServer();
          await server.connect(transport);
          await transport.handleRequest(req, res, parsedBody);
          return;
        }

        if (req.method === 'GET' || req.method === 'DELETE') {
          if (!sessionId) {
            respondJsonRpcError(res, 400, 'Missing Mcp-Session-Id header.');
            return;
          }

          const transport = transports.get(sessionId);
          if (!transport) {
            respondJsonRpcError(res, 404, `Session not found: ${sessionId}`);
            return;
          }

          await transport.handleRequest(req, res);
          return;
        }

        res.writeHead(405, {
          allow: 'GET, POST, DELETE',
        });
        res.end();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        respondJsonRpcError(res, 500, message);
      }
    },
    async close() {
      await Promise.all(Array.from(transports.values()).map(transport => transport.close()));
      transports.clear();
    },
  };
}
