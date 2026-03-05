import * as fs from 'fs';
import * as path from 'path';
import { ensureBrainDir, getBrainDir } from './brainDir.js';

export interface Milestone {
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  confidence?: 'low' | 'mid' | 'high';
  detected_at?: string;
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
  return JSON.parse(content);
}

export function writeMilestones(milestones: Milestone[], cwd?: string): void {
  ensureBrainDir(cwd);
  const milestonesPath = getMilestonesPath(cwd);
  fs.writeFileSync(milestonesPath, JSON.stringify(milestones, null, 2), 'utf-8');
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
