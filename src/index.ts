#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { projectInit } from './tools/projectInit.js';
import { projectRecentActivity } from './tools/recentActivity.js';
import { projectContext } from './tools/projectContext.js';
import { projectCaptureNote } from './tools/captureNote.js';
import { recordProgress } from './tools/recordProgress.js';

const server = new Server(
  {
    name: 'project-brain',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'project_init',
        description: 'Initialize project brain with manifest information',
        inputSchema: {
          type: 'object',
          properties: {
            repo_path: {
              type: 'string',
              description: 'Optional repository path',
            },
            answers: {
              type: 'object',
              properties: {
                project_name: { type: 'string' },
                one_liner: { type: 'string' },
                goals: { type: 'array', items: { type: 'string' } },
                constraints: { type: 'array', items: { type: 'string' } },
                tech_stack: { type: 'array', items: { type: 'string' } },
              },
              required: ['project_name', 'one_liner'],
            },
          },
          required: ['answers'],
        },
      },
      {
        name: 'project_recent_activity',
        description: 'Get recent git activity with commits and hot paths',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of commits to retrieve (default: 50)',
            },
            since_days: {
              type: 'number',
              description: 'Get commits from last N days',
            },
            repo_path: {
              type: 'string',
              description: 'Optional repository path',
            },
          },
        },
      },
      {
        name: 'project_context',
        description: 'Generate AI-ready project context',
        inputSchema: {
          type: 'object',
          properties: {
            depth: {
              type: 'string',
              enum: ['short', 'normal'],
              description: 'Context depth (default: normal)',
            },
            include_recent_activity: {
              type: 'boolean',
              description: 'Include recent git activity (default: true)',
            },
            recent_commits: {
              type: 'number',
              description: 'Number of recent commits to include (default: 30)',
            },
            repo_path: {
              type: 'string',
              description: 'Optional repository path',
            },
          },
        },
      },
      {
        name: 'project_capture_note',
        description: 'Capture a note about the project',
        inputSchema: {
          type: 'object',
          properties: {
            note: {
              type: 'string',
              description: 'Note content',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization (e.g., decision, unknown, milestone)',
            },
            repo_path: {
              type: 'string',
              description: 'Optional repository path',
            },
          },
          required: ['note'],
        },
      },
      {
        name: 'record_progress',
        description: 'Record development progress, decisions, or milestone signals',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['progress', 'decision', 'milestone'],
              description: 'Type of record to create',
            },
            repo_path: {
              type: 'string',
              description: 'Optional repository path',
            },
            progress: {
              type: 'object',
              properties: {
                summary: { type: 'string' },
                confidence: { type: 'string', enum: ['low', 'mid', 'high'] },
              },
            },
            decision: {
              type: 'object',
              properties: {
                decision: { type: 'string' },
                reason: { type: 'string' },
              },
            },
            milestone: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                status: { type: 'string', enum: ['not_started', 'in_progress', 'completed'] },
                confidence: { type: 'string', enum: ['low', 'mid', 'high'] },
              },
            },
          },
          required: ['type'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'project_init': {
        const result = await projectInit(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'project_recent_activity': {
        const result = await projectRecentActivity(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'project_context': {
        const result = await projectContext(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.context_text,
            },
          ],
        };
      }
      case 'record_progress': {
        const result = await recordProgress(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'project_capture_note': {
        const result = await projectCaptureNote(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Project Brain MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
