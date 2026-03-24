// i18n templates for context generation

export interface I18nTemplates {
  projectContext: string;
  oneLiner: string;
  goals: string;
  constraintsTech: string;
  currentFocus: string;
  confidence: string;
  milestoneSignals: string;
  milestoneProgress: string;
  suggestedNextActions: string;
  recentProgress: string;
  keyDecisions: string;
  reason: string;
  recentActivity: string;
  unknowns: string;
  impact: string;
  effort: string;
  related: string;
}

export const templates: Record<string, I18nTemplates> = {
  'zh-CN': {
    projectContext: '# 项目上下文',
    oneLiner: '## 项目简介',
    goals: '## 项目目标',
    constraintsTech: '## 约束条件与技术栈',
    currentFocus: '## 当前开发重点',
    confidence: '置信度',
    milestoneSignals: '## 里程碑信号',
    milestoneProgress: '## 里程碑进度',
    suggestedNextActions: '## 建议的下一步行动',
    recentProgress: '## 最近进展',
    keyDecisions: '## 关键决策',
    reason: '原因',
    recentActivity: '## 最近活动',
    unknowns: '## 待确认事项',
    impact: '影响力',
    effort: '工作量',
    related: '相关',
  },
  'en-US': {
    projectContext: '# Project Context',
    oneLiner: '## One-liner',
    goals: '## Goals',
    constraintsTech: '## Constraints & Tech',
    currentFocus: '## Current inferred focus',
    confidence: 'confidence',
    milestoneSignals: '## Milestone Signals',
    milestoneProgress: '## Milestone Progress',
    suggestedNextActions: '## Suggested Next Actions',
    recentProgress: '## Recent Progress',
    keyDecisions: '## Key Decisions',
    reason: 'Reason',
    recentActivity: '## Recent activity',
    unknowns: '## Unknowns',
    impact: 'Impact',
    effort: 'Effort',
    related: 'Related',
  }
};

/**
 * Detect locale from manifest or content
 */
export function detectLocale(manifest: { locale?: string } | null | undefined, content?: string): string {
  // 1. Use explicit locale from manifest
  if (manifest?.locale && manifest.locale !== 'auto') {
    return manifest.locale;
  }

  // 2. Auto-detect from content
  if (content) {
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const totalChars = content.length;
    
    // If more than 20% Chinese characters, use zh-CN
    if (totalChars > 0 && chineseChars / totalChars > 0.2) {
      return 'zh-CN';
    }
  }

  // 3. Default to English
  return 'en-US';
}

/**
 * Get templates for locale
 */
export function getTemplates(locale: string): I18nTemplates {
  return templates[locale] || templates['en-US'];
}
