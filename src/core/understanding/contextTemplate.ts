import { Manifest } from '../storage/manifest.js';
import { Commit } from '../git/parseLog.js';
import { Note } from '../storage/notes.js';
import { FocusInference, MilestoneSignal } from './inferFocus.js';
import { ProgressEntry } from '../storage/progress.js';
import { Decision } from '../storage/decisions.js';
import { Milestone } from '../storage/milestones.js';
import { ProgressEstimation } from './estimateProgress.js';
import { NextAction } from '../storage/nextActions.js';
import { detectLocale, getTemplates } from './i18n.js';

export interface ContextData {
  manifest: Manifest | null;
  recentCommits: Commit[];
  notes: Note[];
  focus: FocusInference | null;
  milestoneSignals?: MilestoneSignal[];
  progress?: ProgressEntry[];
  decisions?: Decision[];
  milestones?: Milestone[];
  milestoneProgress?: ProgressEstimation[];
  nextActions?: NextAction[];
}

export function generateContextText(data: ContextData): string {
  // Detect locale
  const contentSample = [
    data.manifest?.summary || '',
    data.manifest?.long_term_goal || '',
    ...(data.progress?.map(p => p.summary) || [])
  ].join(' ');
  
  const locale = detectLocale(data.manifest, contentSample);
  const t = getTemplates(locale);
  
  const sections: string[] = [];
  sections.push(`${t.projectContext}\n`);
  if (data.manifest) {
    sections.push(t.oneLiner);
    sections.push(data.manifest.summary || 'Not specified');
    sections.push('');
    if (data.manifest.long_term_goal) {
      sections.push(t.goals);
      sections.push(`- ${data.manifest.long_term_goal}`);
      sections.push('');
    }
    if (data.manifest.primary_stack.length > 0) {
      sections.push(t.constraintsTech);
      sections.push(`- Repo type: ${data.manifest.repo_type}`);
      data.manifest.primary_stack.forEach(stack => sections.push(`- ${stack}`));
      sections.push('');
    }
  }
  if (data.focus) {
    sections.push(t.currentFocus);
    sections.push(data.focus.focus);
    sections.push(`${t.confidence}: ${data.focus.confidence}`);
    sections.push('');
  }
  if (data.milestoneSignals && data.milestoneSignals.length > 0) {
    sections.push(t.milestoneSignals);
    data.milestoneSignals.forEach(signal => {
      sections.push(`- ${signal.name} (${t.confidence}: ${signal.confidence})`);
      sections.push(`  ${signal.reason}`);
    });
    sections.push('');
  }
  
  // Milestone Progress section
  if (data.milestoneProgress && data.milestoneProgress.length > 0) {
    sections.push(t.milestoneProgress);
    data.milestoneProgress.forEach(est => {
      sections.push(`- ${est.milestone_name}: ${est.percentage}% (${t.confidence}: ${est.confidence})`);
      const lines = est.explanation.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          sections.push(`  ${line}`);
        }
      });
    });
    sections.push('');
  }
  
  // Suggested Next Actions section
  if (data.nextActions && data.nextActions.length > 0) {
    sections.push(t.suggestedNextActions);
    data.nextActions.forEach((action, index) => {
      sections.push(`${index + 1}. [Priority: ${action.priority_score}] ${action.title}`);
      sections.push(`   - ${t.impact}: ${action.impact} | ${t.effort}: ${action.effort} | ${t.confidence}: ${action.confidence}`);
      sections.push(`   - ${t.reason}: ${action.reasoning}`);
      if (action.related_milestone) {
        sections.push(`   - ${t.related}: ${action.related_milestone}`);
      }
    });
    sections.push('');
  }
  if (data.progress && data.progress.length > 0) {
    sections.push(t.recentProgress);
    data.progress.slice(-5).forEach(p => {
      sections.push(`- [${p.date.split('T')[0]}] ${p.summary} (${t.confidence}: ${p.confidence})`);
    });
    sections.push('');
  }
  if (data.decisions && data.decisions.length > 0) {
    sections.push(t.keyDecisions);
    data.decisions.slice(-5).forEach(d => {
      sections.push(`- ${d.title}: ${d.decision}`);
      sections.push(`  ${t.reason}: ${d.rationale}`);
    });
    sections.push('');
  }
  if (data.recentCommits.length > 0) {
    sections.push(t.recentActivity);
    const summaryLines = data.recentCommits.slice(0, 10).map(c => 
      `- [${c.tag}] ${c.message.substring(0, 80)}`
    );
    sections.push(...summaryLines);
    sections.push('');
  }
  if (data.notes.length > 0) {
    const unknowns = data.notes.filter(n => n.tags.includes('unknown'));
    if (unknowns.length > 0) {
      sections.push(t.unknowns);
      unknowns.forEach(u => sections.push(`- ${u.note}`));
      sections.push('');
    }
  }
  return sections.join('\n');
}
