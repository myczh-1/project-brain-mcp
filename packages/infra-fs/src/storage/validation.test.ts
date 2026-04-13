import { describe, expect, it } from 'vitest';
import {
  storedChangeSpecSchema,
  storedDecisionSchema,
  storedMilestoneSchema,
  storedNoteSchema,
  storedProgressEntrySchema,
  storedProjectSpecSchema,
} from '../../../protocol/src/index.js';
import {
  changeSpecSchema,
  decisionSchema,
  milestoneSchema,
  noteSchema,
  progressEntrySchema,
  projectSpecSchema,
} from './validation.js';

describe('storage validation schemas', () => {
  it('match the shared stored schema behavior for persisted records', () => {
    const projectSpec = {
      product_goal: 'Ship reliable memory',
      non_goals: [],
      architecture_rules: [],
      coding_rules: [],
      agent_rules: [],
      source: 'test',
      updated_at: '2026-04-10T00:00:00.000Z',
    };
    const change = {
      id: 'change-1',
      title: 'Change title',
      summary: 'Change summary',
      status: 'active',
      goals: [],
      non_goals: [],
      constraints: [],
      acceptance_criteria: [],
      affected_areas: [],
      related_decision_ids: [],
      created_at: '2026-04-10T00:00:00.000Z',
      updated_at: '2026-04-10T00:00:00.000Z',
    };
    const decision = {
      id: 'decision-1',
      title: 'Use shared schemas',
      decision: 'Centralize zod definitions',
      rationale: 'Avoid drift',
      alternatives_considered: [],
      scope: 'project',
      created_at: '2026-04-10T00:00:00.000Z',
    };
    const note = {
      id: 'note-1',
      time: '2026-04-10T00:00:00.000Z',
      tags: ['review'],
      note: 'Keep a single source of truth',
    };
    const progress = {
      id: 'progress-1',
      date: '2026-04-10T00:00:00.000Z',
      summary: 'Deduplicated schemas',
      confidence: 'high',
    };
    const milestone = {
      name: 'Schema Deduplication',
      status: 'in_progress',
      confidence: 'high',
    };

    expect(projectSpecSchema.safeParse(projectSpec)).toEqual(storedProjectSpecSchema.safeParse(projectSpec));
    expect(changeSpecSchema.safeParse(change)).toEqual(storedChangeSpecSchema.safeParse(change));
    expect(decisionSchema.safeParse(decision)).toEqual(storedDecisionSchema.safeParse(decision));
    expect(noteSchema.safeParse(note)).toEqual(storedNoteSchema.safeParse(note));
    expect(progressEntrySchema.safeParse(progress)).toEqual(storedProgressEntrySchema.safeParse(progress));
    expect(milestoneSchema.safeParse(milestone)).toEqual(storedMilestoneSchema.safeParse(milestone));
  });
});
