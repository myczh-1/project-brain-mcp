import { randomUUID } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createContextService, createRuntimeService } from '@myczh/project-brain/application';

function toTextContent(payload: unknown) {
  return [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }];
}

function toStructuredContent(payload: unknown): Record<string, unknown> {
  return payload as Record<string, unknown>;
}

function createProjectBrainMcpServer() {
  const runtime = createRuntimeService();
  const context = createContextService();
  const {
    initializeProject: projectInit,
    ingestMemory,
    createChange,
    updateChange,
    logDecision,
    recordProgress,
    captureNote: projectCaptureNote,
    startWork,
    checkpointWork,
  } = runtime;
  const {
    getChangeContext: changeContext,
    getProjectContext: projectContext,
    getDashboard: brainDashboard,
    getRecentActivity: projectRecentActivity,
    suggestNextActions: suggestNextActionsTool,
    analyze: brainAnalyze,
    finishWork,
  } = context;

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
        'Project Brain is the durable memory, development-recording, and reflection layer for AI-assisted software development. IMPORTANT: Every tool call requires `repo_path` — the absolute path to the target project repository. The server runs as a shared service and cannot infer the client working directory. Use the Project Brain protocol as the source of truth. In practice: read `brain_context` before substantial work, re-read `brain_change_context`, `brain_context`, or `brain_dashboard` before resuming work or writing from stale context, record meaningful execution updates while work is happening, and reflect larger outcomes before concluding.',
    }
  );

  server.registerTool(
    'brain_dashboard',
    {
      description:
        'Inspect the current project memory and status through a unified dashboard view before resuming work, reconciling current state, or writing broader project updates.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository. Required — the server cannot infer the client working directory.'),
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
        repo_path: z.string().describe('Absolute path to the target project repository.'),
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
    'brain_start_work',
    {
      description:
        'Create, reuse, or adopt a change as the active execution anchor, and optionally write an initial progress update.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        change_id: z.string().optional(),
        create_change: z
          .object({
            id: z.string().optional(),
            title: z.string(),
            summary: z.string(),
            goals: z.array(z.string()).optional(),
            non_goals: z.array(z.string()).optional(),
            constraints: z.array(z.string()).optional(),
            acceptance_criteria: z.array(z.string()).optional(),
            affected_areas: z.array(z.string()).optional(),
            related_decision_ids: z.array(z.string()).optional(),
            status: z.enum(['proposed', 'active', 'done', 'dropped']).optional(),
          })
          .optional(),
        initial_progress: z
          .object({
            summary: z.string(),
            status: z.enum(['planned', 'in_progress', 'blocked', 'done']).optional(),
            blockers: z.array(z.string()).optional(),
            related_change_id: z.string().optional(),
            confidence: z.enum(['low', 'mid', 'high']),
          })
          .optional(),
      },
    },
    async ({ repo_path, change_id, create_change, initial_progress }) => {
      const result = await startWork({
        repo_path,
        change_id,
        create_change,
        initial_progress,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_checkpoint',
    {
      description:
        'Record an in-progress checkpoint by updating a change and optionally appending progress and a note.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        change_id: z.string(),
        change_patch: z
          .object({
            title: z.string().optional(),
            summary: z.string().optional(),
            status: z.enum(['proposed', 'active', 'done', 'dropped']).optional(),
            goals: z.array(z.string()).optional(),
            non_goals: z.array(z.string()).optional(),
            constraints: z.array(z.string()).optional(),
            acceptance_criteria: z.array(z.string()).optional(),
            affected_areas: z.array(z.string()).optional(),
            related_decision_ids: z.array(z.string()).optional(),
          })
          .optional(),
        progress: z
          .object({
            summary: z.string(),
            status: z.enum(['planned', 'in_progress', 'blocked', 'done']).optional(),
            blockers: z.array(z.string()).optional(),
            related_change_id: z.string().optional(),
            confidence: z.enum(['low', 'mid', 'high']),
          })
          .optional(),
        note: z
          .object({
            note: z.string(),
            tags: z.array(z.string()).optional(),
          })
          .optional(),
      },
    },
    async ({ repo_path, change_id, change_patch, progress, note }) => {
      const result = await checkpointWork({
        repo_path,
        change_id,
        change_patch,
        progress,
        note,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_finish_work',
    {
      description:
        'Finish a change by setting a terminal status, optionally writing final progress and a note, then returning a reflection summary and next actions.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        change_id: z.string(),
        final_status: z.enum(['done', 'dropped']).optional(),
        summary_patch: z
          .object({
            title: z.string().optional(),
            summary: z.string().optional(),
            goals: z.array(z.string()).optional(),
            non_goals: z.array(z.string()).optional(),
            constraints: z.array(z.string()).optional(),
            acceptance_criteria: z.array(z.string()).optional(),
            affected_areas: z.array(z.string()).optional(),
            related_decision_ids: z.array(z.string()).optional(),
          })
          .optional(),
        final_progress: z
          .object({
            summary: z.string(),
            status: z.enum(['planned', 'in_progress', 'blocked', 'done']).optional(),
            blockers: z.array(z.string()).optional(),
            related_change_id: z.string().optional(),
            confidence: z.enum(['low', 'mid', 'high']),
          })
          .optional(),
        note: z
          .object({
            note: z.string(),
            tags: z.array(z.string()).optional(),
          })
          .optional(),
        reflection: z
          .object({
            recent_commits: z.number().optional(),
            next_action_limit: z.number().optional(),
          })
          .optional(),
      },
    },
    async ({ repo_path, change_id, final_status, summary_patch, final_progress, note, reflection }) => {
      const result = await finishWork({
        repo_path,
        change_id,
        final_status,
        summary_patch,
        final_progress,
        note,
        reflection,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_create_change',
    {
      description: 'Create a structured change record for a concrete implementation task.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        change: z.object({
          id: z.string().optional(),
          title: z.string(),
          summary: z.string(),
          goals: z.array(z.string()).optional(),
          non_goals: z.array(z.string()).optional(),
          constraints: z.array(z.string()).optional(),
          acceptance_criteria: z.array(z.string()).optional(),
          affected_areas: z.array(z.string()).optional(),
          related_decision_ids: z.array(z.string()).optional(),
          status: z.enum(['proposed', 'active', 'done', 'dropped']).optional(),
        }),
      },
    },
    async ({ repo_path, change }) => {
      const result = await createChange({
        repo_path,
        change,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_update_change',
    {
      description: 'Update an existing change record as implementation progresses.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        change_id: z.string(),
        patch: z.object({
          title: z.string().optional(),
          summary: z.string().optional(),
          status: z.enum(['proposed', 'active', 'done', 'dropped']).optional(),
          goals: z.array(z.string()).optional(),
          non_goals: z.array(z.string()).optional(),
          constraints: z.array(z.string()).optional(),
          acceptance_criteria: z.array(z.string()).optional(),
          affected_areas: z.array(z.string()).optional(),
          related_decision_ids: z.array(z.string()).optional(),
        }),
      },
    },
    async ({ repo_path, change_id, patch }) => {
      const result = await updateChange({
        repo_path,
        change_id,
        patch,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_log_decision',
    {
      description: 'Record a concrete implementation or project decision with rationale.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        decision: z.object({
          id: z.string().optional(),
          title: z.string(),
          decision: z.string(),
          rationale: z.string(),
          alternatives_considered: z.array(z.string()).optional(),
          scope: z.enum(['project', 'change']).optional(),
          related_change_id: z.string().optional(),
          supersedes: z.string().optional(),
        }),
      },
    },
    async ({ repo_path, decision }) => {
      const result = await logDecision({
        repo_path,
        decision,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_record_progress',
    {
      description: 'Record execution progress updates or milestone status during development.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        type: z.enum(['progress', 'milestone']),
        progress: z
          .object({
            summary: z.string(),
            status: z.enum(['planned', 'in_progress', 'blocked', 'done']).optional(),
            blockers: z.array(z.string()).optional(),
            related_change_id: z.string().optional(),
            confidence: z.enum(['low', 'mid', 'high']),
          })
          .optional(),
        milestone: z
          .object({
            name: z.string(),
            status: z.enum(['not_started', 'in_progress', 'completed']),
            confidence: z.enum(['low', 'mid', 'high']).optional(),
            completion: z.enum(['low', 'mid', 'high']).optional(),
          })
          .optional(),
      },
    },
    async ({ repo_path, type, progress, milestone }) => {
      const result = await recordProgress({
        repo_path,
        type,
        progress,
        milestone,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_capture_note',
    {
      description: 'Capture a raw implementation note, observation, or follow-up fragment.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        note: z.string(),
        tags: z.array(z.string()).optional(),
        related_change_id: z.string().optional(),
      },
    },
    async ({ repo_path, note, tags, related_change_id }) => {
      const result = await projectCaptureNote({
        repo_path,
        note,
        tags,
        related_change_id,
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
        'Get detailed execution context for a specific change before resuming, extending, or updating that change so reads happen before additional progress writes.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
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
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        memory: z.object({
          type: z.enum(['project_spec', 'change_spec', 'decision', 'note', 'progress']),
          confirmed_by_user: z.boolean(),
          source: z.string().optional(),
          payload: z.record(z.string(), z.unknown()),
        }),
      },
    },
    async ({ repo_path, memory }) => {
      // The zod schema validates structure, but ingestMemory performs its own
      // deep validation on the payload. Widen through unknown at the boundary.
      const validatedMemory: unknown = memory;
      const result = await ingestMemory({
        repo_path,
        memory: validatedMemory as Parameters<typeof ingestMemory>[0]['memory'],
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
      description:
        'Get lightweight project context to hydrate current goals, active changes, recent decisions, and recent progress before planning work or recording new updates.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
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

  server.registerTool(
    'brain_recent_activity',
    {
      description: 'Inspect recent repository activity and hot paths for reflection and context updates.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        limit: z.number().optional(),
        since_days: z.number().optional(),
      },
    },
    async ({ repo_path, limit, since_days }) => {
      const result = await projectRecentActivity({
        repo_path,
        limit,
        since_days,
      });

      return {
        content: [{ type: 'text', text: result.summary }],
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_suggest_actions',
    {
      description: 'Suggest next engineering actions from current project memory and recent repository activity.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        limit: z.number().optional(),
        filter_by_milestone: z.string().optional(),
        recent_commits: z.number().optional(),
      },
    },
    async ({ repo_path, limit, filter_by_milestone, recent_commits }) => {
      const result = await suggestNextActionsTool({
        repo_path,
        limit,
        filter_by_milestone,
        recent_commits,
      });

      return {
        content: toTextContent(result),
        structuredContent: toStructuredContent(result),
      };
    }
  );

  server.registerTool(
    'brain_analyze',
    {
      description: 'Run a broader project reflection pass across memory, milestones, and repository activity.',
      inputSchema: {
        repo_path: z.string().describe('Absolute path to the target project repository.'),
        depth: z.enum(['quick', 'full']).optional(),
        recent_commits: z.number().optional(),
      },
    },
    async ({ repo_path, depth, recent_commits }) => {
      const result = await brainAnalyze({
        repo_path,
        depth,
        recent_commits,
      });

      return {
        content: [{ type: 'text', text: result.summary }],
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
