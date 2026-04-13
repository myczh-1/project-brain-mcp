import * as fs from 'fs';
import * as path from 'path';
import type { Milestone } from '@myczh/project-brain/core';
import { ensureBrainDir, getBrainDir } from './brainDir.js';
import { atomicWriteFile } from './fileOps.js';
import { milestoneSchema, parseJsonText } from './validation.js';

type Confidence = NonNullable<Milestone['confidence']>;

interface InferredMilestoneSignal {
  name: string;
  confidence: Confidence;
}

const MILESTONES_FILE = 'milestones.json';

export function getMilestonesPath(cwd?: string): string {
  return path.join(getBrainDir(cwd), MILESTONES_FILE);
}

export function readMilestones(cwd?: string): Milestone[] {
  const milestonesPath = getMilestonesPath(cwd);
  if (!fs.existsSync(milestonesPath)) {
    return [];
  }
  const content = fs.readFileSync(milestonesPath, 'utf-8');
  return parseJsonText(content, milestonesPath, milestoneSchema.array(), 'milestones');
}

export function writeMilestones(milestones: Milestone[], cwd?: string): void {
  ensureBrainDir(cwd);
  const milestonesPath = getMilestonesPath(cwd);
  atomicWriteFile(milestonesPath, JSON.stringify(milestones, null, 2));
}

export function updateMilestone(milestone: Milestone, cwd?: string): void {
  const milestones = readMilestones(cwd);
  const index = milestones.findIndex(m => m.name === milestone.name);

  if (index >= 0) {
    milestones[index] = milestone;
  } else {
    milestones.push(milestone);
  }

  writeMilestones(milestones, cwd);
}

function confidenceScore(confidence?: Confidence): number {
  if (confidence === 'high') return 3;
  if (confidence === 'mid') return 2;
  return 1;
}

function mergeConfidence(current?: Confidence, incoming?: Confidence): Confidence {
  const currentScore = confidenceScore(current);
  const incomingScore = confidenceScore(incoming);

  if (incomingScore > currentScore) {
    return incoming || 'low';
  }

  return current || incoming || 'low';
}

export function upsertInferredMilestones(signals: InferredMilestoneSignal[], cwd?: string): Milestone[] {
  if (signals.length === 0) {
    return readMilestones(cwd);
  }

  const milestones = readMilestones(cwd);
  const now = new Date().toISOString();
  let changed = false;

  for (const signal of signals) {
    const index = milestones.findIndex(m => m.name === signal.name);

    if (index < 0) {
      milestones.push({
        name: signal.name,
        status: 'in_progress',
        confidence: signal.confidence,
        detected_at: now,
        last_updated: now,
      });
      changed = true;
      continue;
    }

    const existing = milestones[index];
    const nextStatus = existing.status === 'completed' ? 'completed' : 'in_progress';
    const nextConfidence = mergeConfidence(existing.confidence, signal.confidence);
    const nextDetectedAt = existing.detected_at || now;
    const coreChanged =
      nextStatus !== existing.status ||
      nextConfidence !== existing.confidence ||
      nextDetectedAt !== existing.detected_at;
    const nextMilestone: Milestone = {
      ...existing,
      status: nextStatus,
      confidence: nextConfidence,
      detected_at: nextDetectedAt,
      last_updated: coreChanged ? now : existing.last_updated,
    };

    const hasChanged = coreChanged || nextMilestone.last_updated !== existing.last_updated;

    if (hasChanged) {
      milestones[index] = nextMilestone;
      changed = true;
    }
  }

  if (changed) {
    writeMilestones(milestones, cwd);
  }

  return milestones;
}
