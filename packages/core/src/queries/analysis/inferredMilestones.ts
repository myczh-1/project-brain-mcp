import type { Milestone } from '../../ports/storage.js';
import type { MilestoneSignal } from '../../understanding/inferFocus.js';

function mergeConfidence(
  current: Milestone['confidence'],
  inferred: MilestoneSignal['confidence']
): Milestone['confidence'] {
  const rank: Record<MilestoneSignal['confidence'], number> = {
    low: 0,
    mid: 1,
    high: 2,
  };

  if (!current) {
    return inferred;
  }

  return rank[inferred] > rank[current] ? inferred : current;
}

export function mergeInferredMilestones(
  persisted: Milestone[],
  inferred: MilestoneSignal[]
): Milestone[] {
  const merged = new Map(persisted.map((milestone) => [milestone.name, milestone]));

  for (const signal of inferred) {
    const existing = merged.get(signal.name);
    if (existing) {
      merged.set(signal.name, {
        ...existing,
        confidence: mergeConfidence(existing.confidence, signal.confidence),
      });
      continue;
    }

    merged.set(signal.name, {
      name: signal.name,
      status: 'not_started',
      confidence: signal.confidence,
    });
  }

  return Array.from(merged.values());
}
