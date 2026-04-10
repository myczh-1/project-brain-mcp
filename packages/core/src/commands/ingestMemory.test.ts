import { describe, expect, it, vi } from 'vitest';
import type { StoragePort } from '../ports/storage.js';
import { createMemoryHandlers } from './ingestMemory/handlers.js';
import { ingestMemory } from './ingestMemory.js';

function createStorageMock(): StoragePort {
  return {
    ensureBrainDir: vi.fn(),
    brainDirExists: vi.fn(),
    getBrainDir: vi.fn(),
    readManifest: vi.fn(),
    writeManifest: vi.fn(),
    buildFallbackManifest: vi.fn(),
    manifestExists: vi.fn(),
    getManifestPath: vi.fn(),
    readProjectSpec: vi.fn().mockReturnValue(null),
    writeProjectSpec: vi.fn().mockReturnValue('/repo/.project-brain/project-spec.json'),
    getProjectSpecPath: vi.fn(),
    readChange: vi.fn(),
    writeChange: vi.fn().mockImplementation(change => `/repo/.project-brain/changes/${change.id}.json`),
    readAllChanges: vi.fn(),
    changeExists: vi.fn().mockReturnValue(false),
    ensureChangesDir: vi.fn(),
    generateChangeId: vi.fn().mockReturnValue('generated-change'),
    sanitizeChangeId: vi.fn(),
    getChangePath: vi.fn(),
    appendDecision: vi.fn(),
    readDecisions: vi.fn(),
    appendNote: vi.fn(),
    readNotes: vi.fn(),
    generateNoteId: vi.fn().mockReturnValue('note-1'),
    appendProgress: vi.fn(),
    readProgress: vi.fn(),
    readMilestones: vi.fn(),
    writeMilestones: vi.fn(),
    updateMilestone: vi.fn(),
    upsertInferredMilestones: vi.fn(),
    readNextActions: vi.fn(),
    writeNextActions: vi.fn(),
    readModules: vi.fn(),
    writeModules: vi.fn(),
    upsertModules: vi.fn(),
    getRepoRootPath: vi.fn(),
    atomicWriteFile: vi.fn(),
    fileExists: vi.fn(),
    isFile: vi.fn(),
    readTextFile: vi.fn(),
  } as unknown as StoragePort;
}

describe('ingestMemory', () => {
  it('assembles handlers for every supported memory type', () => {
    expect(Object.keys(createMemoryHandlers()).sort()).toEqual([
      'change_spec',
      'decision',
      'note',
      'progress',
      'project_spec',
    ]);
  });

  it('rejects unconfirmed memory before any handler logic runs', async () => {
    const storage = createStorageMock();

    const result = await ingestMemory({
      repo_path: '/repo',
      memory: {
        type: 'note',
        payload: { note: 'hello' },
      },
    }, storage);

    expect(result).toEqual({
      status: 'rejected',
      recorded_type: 'note',
      message: 'confirmed_by_user=true is required before ingesting memory.',
    });
    expect(storage.appendNote).not.toHaveBeenCalled();
  });

  it('routes valid project spec payloads through defineProjectSpec behavior', async () => {
    const storage = createStorageMock();

    const result = await ingestMemory({
      repo_path: '/repo',
      memory: {
        type: 'project_spec',
        confirmed_by_user: true,
        source: 'test-suite',
        payload: {
          product_goal: ' Ship a durable memory system ',
          non_goals: ['  chat archive  '],
        },
      },
    }, storage);

    expect(result).toEqual({
      status: 'ok',
      recorded_type: 'project_spec',
      routed_to: 'brain_define_project_spec',
      message: 'Project spec ingested successfully.',
      created_id: '/repo/.project-brain/project-spec.json',
    });
    expect(storage.writeProjectSpec).toHaveBeenCalledTimes(1);
    expect(storage.writeProjectSpec).toHaveBeenCalledWith({
      product_goal: 'Ship a durable memory system',
      non_goals: ['chat archive'],
      architecture_rules: [],
      coding_rules: [],
      agent_rules: [],
      source: 'test-suite',
      updated_at: expect.any(String),
    }, '/repo');
  });

  it('returns decision-like note warnings while still recording the note', async () => {
    const storage = createStorageMock();

    const result = await ingestMemory({
      repo_path: '/repo',
      memory: {
        type: 'note',
        confirmed_by_user: true,
        payload: {
          note: 'We decided to adopt the new storage layer.',
          tags: ['architecture'],
        },
      },
    }, storage);

    expect(result).toEqual({
      status: 'ok',
      recorded_type: 'note',
      routed_to: 'brain_capture_note',
      created_id: 'note-1',
      message: 'Note ingested successfully.',
      warnings: ['Note content looks like a decision. Consider ingesting it as type="decision".'],
    });
    expect(storage.appendNote).toHaveBeenCalledTimes(1);
  });

  it('rejects duplicate change ids with the existing message', async () => {
    const storage = createStorageMock();
    vi.mocked(storage.changeExists).mockReturnValue(true);

    const result = await ingestMemory({
      repo_path: '/repo',
      memory: {
        type: 'change_spec',
        confirmed_by_user: true,
        payload: {
          id: 'existing-change',
          title: 'Existing change',
          summary: 'duplicate',
        },
      },
    }, storage);

    expect(result).toEqual({
      status: 'rejected',
      recorded_type: 'change_spec',
      message: 'Change already exists: existing-change. Use brain_update_change for explicit updates.',
    });
    expect(storage.writeChange).not.toHaveBeenCalled();
  });

  it('preserves progress warnings when related_change_id is missing', async () => {
    const storage = createStorageMock();

    const result = await ingestMemory({
      repo_path: '/repo',
      memory: {
        type: 'progress',
        confirmed_by_user: true,
        payload: {
          summary: 'Finished refactor',
          confidence: 'high',
        },
      },
    }, storage);

    expect(result).toEqual({
      status: 'ok',
      recorded_type: 'progress',
      routed_to: 'brain_record_progress',
      created_id: expect.any(String),
      message: 'Progress ingested successfully as progress.',
      warnings: ['Progress was recorded without related_change_id.'],
    });
    expect(storage.appendProgress).toHaveBeenCalledTimes(1);
  });
});
