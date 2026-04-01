const state = {
  params: {
    repo_path: '',
    recent_commits: '50',
    include_deep_analysis: true,
  },
  dashboard: null,
  activeTab: 'decisions',
  selectedDetailId: null,
};

const elements = {
  form: document.querySelector('#controls-form'),
  repoPath: document.querySelector('#repo-path'),
  recentCommits: document.querySelector('#recent-commits'),
  includeAnalysis: document.querySelector('#include-analysis'),
  statusPill: document.querySelector('#status-pill'),
  metaStatus: document.querySelector('#meta-status'),
  metaRepoPath: document.querySelector('#meta-repo-path'),
  metaGeneratedAt: document.querySelector('#meta-generated-at'),
  metaDegradation: document.querySelector('#meta-degradation'),
  metaToggle: document.querySelector('#meta-toggle'),
  metaClose: document.querySelector('#meta-close'),
  metaDrawer: document.querySelector('#meta-drawer'),
  heroProjectName: document.querySelector('#hero-project-name'),
  overviewSummary: document.querySelector('#overview-summary'),
  metricFocus: document.querySelector('#metric-focus'),
  metricFocusDetail: document.querySelector('#metric-focus-detail'),
  metricProgress: document.querySelector('#metric-progress'),
  metricProgressDetail: document.querySelector('#metric-progress-detail'),
  metricRunning: document.querySelector('#metric-running'),
  metricRunningDetail: document.querySelector('#metric-running-detail'),
  metricRisk: document.querySelector('#metric-risk'),
  metricRiskDetail: document.querySelector('#metric-risk-detail'),
  initChip: document.querySelector('#init-chip'),
  layerProjectName: document.querySelector('#layer-project-name'),
  layerProjectSummary: document.querySelector('#layer-project-summary'),
  goalList: document.querySelector('#goal-list'),
  decisionHeadline: document.querySelector('#decision-headline'),
  decisionHeadlineCopy: document.querySelector('#decision-headline-copy'),
  decisionRail: document.querySelector('#decision-rail'),
  inProgressList: document.querySelector('#in-progress-list'),
  evidenceList: document.querySelector('#evidence-list'),
  memoryTabs: document.querySelector('#memory-tabs'),
  memorySummary: document.querySelector('#memory-summary'),
  memoryList: document.querySelector('#memory-list'),
  detailTitle: document.querySelector('#detail-title'),
  detailBody: document.querySelector('#detail-body'),
  detailMeta: document.querySelector('#detail-meta'),
  detailLinks: document.querySelector('#detail-links'),
  workSpotlight: document.querySelector('#work-spotlight'),
  actionsList: document.querySelector('#actions-list'),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setStatus(text, type) {
  elements.statusPill.innerHTML = '<span class="status-badge-dot"></span>' + escapeHtml(text);
  elements.statusPill.className = 'status-badge ' + type;
  elements.metaStatus.textContent = text;
}

function formatDate(value) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function textOrFallback(value, fallback) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
}

function summarizeText(parts) {
  return parts.filter(Boolean).join(' • ');
}

function renderEmpty(container, text) {
  container.innerHTML = '<div class="empty-state">' + escapeHtml(text) + '</div>';
}

function renderList(container, items, renderer, emptyText) {
  if (!items || items.length === 0) {
    renderEmpty(container, emptyText);
    return;
  }

  container.innerHTML = items.map(renderer).join('');
}

function miniCard(item) {
  return '<article class="mini-item">' +
    '<h3>' + escapeHtml(item.title) + '</h3>' +
    '<div class="mini-copy">' + escapeHtml(item.body) + '</div>' +
    '<div class="mini-meta">' + escapeHtml(item.meta) + '</div>' +
    '</article>';
}

function spotlightCard(item) {
  return '<article class="spotlight-item">' +
    '<h3>' + escapeHtml(item.title) + '</h3>' +
    '<div class="spotlight-copy">' + escapeHtml(item.body) + '</div>' +
    '<div class="spotlight-meta">' + escapeHtml(item.meta) + '</div>' +
    '</article>';
}

function workRow(item) {
  const statusClass = (item.status || 'in-progress').replaceAll('_', '-');
  return '<article class="work-row">' +
    '<div>' +
      '<h3 class="work-title">' + escapeHtml(item.title) + '</h3>' +
      '<div class="work-copy">' + escapeHtml(item.body) + '</div>' +
      '<div class="work-sub">' + escapeHtml(item.meta) + '</div>' +
    '</div>' +
    '<span class="work-status ' + escapeHtml(statusClass) + '">' + escapeHtml(item.status_label || 'In Progress') + '</span>' +
  '</article>';
}

function browserButton(item) {
  const isActive = state.selectedDetailId === item.id;
  return '<button type="button" class="browser-item' + (isActive ? ' active' : '') + '" data-detail-id="' + escapeHtml(item.id) + '">' +
    '<h3>' + escapeHtml(item.title) + '</h3>' +
    '<div class="browser-copy">' + escapeHtml(item.preview) + '</div>' +
    '<div class="browser-meta">' + escapeHtml(item.meta) + '</div>' +
    '</button>';
}

function linkItem(item) {
  return '<button type="button" class="link-item link-button" data-link-tab="' + escapeHtml(item.tab) + '" data-link-id="' + escapeHtml(item.id) + '">' +
    '<strong>' + escapeHtml(item.title) + '</strong>' +
    '<div class="link-copy">' + escapeHtml(item.body) + '</div>' +
    '<div class="browser-meta">' + escapeHtml(item.meta) + '</div>' +
    '</button>';
}

function openMetaDrawer() {
  elements.metaDrawer.classList.add('open');
  elements.metaDrawer.setAttribute('aria-hidden', 'false');
  elements.metaToggle.setAttribute('aria-expanded', 'true');
}

function closeMetaDrawer() {
  elements.metaDrawer.classList.remove('open');
  elements.metaDrawer.setAttribute('aria-hidden', 'true');
  elements.metaToggle.setAttribute('aria-expanded', 'false');
}

function syncFormFromQuery() {
  const search = new URLSearchParams(window.location.search);
  const repoPath = search.get('repo_path');
  const recentCommits = search.get('recent_commits');
  const includeAnalysis = search.get('include_deep_analysis');

  if (repoPath !== null) state.params.repo_path = repoPath;
  if (recentCommits !== null) state.params.recent_commits = recentCommits;
  if (includeAnalysis !== null) state.params.include_deep_analysis = includeAnalysis !== 'false';

  elements.repoPath.value = state.params.repo_path;
  elements.recentCommits.value = state.params.recent_commits;
  elements.includeAnalysis.checked = state.params.include_deep_analysis;
}

function buildQuery() {
  const query = new URLSearchParams();
  if (state.params.repo_path.trim()) query.set('repo_path', state.params.repo_path.trim());
  if (state.params.recent_commits.trim()) query.set('recent_commits', state.params.recent_commits.trim());
  query.set('include_deep_analysis', String(state.params.include_deep_analysis));
  return query;
}

function getInProgressItems(dashboard) {
  const milestones = dashboard.memory.milestone_memory.items
    .filter(item => item.status === 'in_progress')
    .map(item => ({
      kind: 'milestone',
      title: item.name,
      body: 'Milestone in progress.',
      meta: summarizeText([
        item.completion ? 'Completion: ' + item.completion : '',
        item.confidence || '',
      ]),
      status: 'in_progress',
      status_label: 'In Progress',
    }));

  const progressEntries = dashboard.memory.progress_memory.items
    .filter(item => item.status === 'in_progress' || item.status === 'blocked' || item.status === 'planned')
    .map(item => ({
      kind: 'progress',
      title: item.summary,
      body: item.blockers && item.blockers.length > 0
        ? 'Blockers: ' + item.blockers.join(', ')
        : 'Execution record without blockers.',
      meta: summarizeText([item.status || '', item.confidence || '', formatDate(item.date)]),
      status: item.status || 'in_progress',
      status_label: textOrFallback(item.status, 'in progress').replaceAll('_', ' '),
    }));

  return [...milestones, ...progressEntries];
}

function getEvidenceItems(dashboard) {
  const notes = dashboard.memory.note_memory.items.slice(0, 2).map(item => ({
    title: item.tags && item.tags.length > 0 ? item.tags.join(', ') : 'Note',
    body: textOrFallback(item.note, 'No note body provided.'),
    meta: formatDate(item.time),
  }));

  const commits = dashboard.activity.recent_commits.slice(0, 2).map(item => ({
    title: item.message || 'Commit',
    body: item.author || 'Unknown author',
    meta: formatDate(item.time),
  }));

  return [...notes, ...commits];
}

function getBrowserData(dashboard) {
  const decisions = dashboard.memory.decision_memory.items.map(item => ({
    id: item.id,
    kind: 'decision',
    title: textOrFallback(item.title, 'Untitled decision'),
    preview: textOrFallback(item.decision, 'No decision summary provided.'),
    meta: summarizeText([item.scope, formatDate(item.created_at)]),
    detailTitle: textOrFallback(item.title, 'Untitled decision'),
    detailBody: textOrFallback(item.decision, 'No decision summary provided.'),
    detailMeta: [
      item.rationale ? 'Rationale: ' + item.rationale : '',
      item.alternatives_considered?.length ? 'Alternatives: ' + item.alternatives_considered.join(', ') : '',
      item.related_change_id ? 'Related change: ' + item.related_change_id : '',
    ].filter(Boolean),
    related_change_id: item.related_change_id || null,
    related_milestone: null,
  }));

  const progress = dashboard.memory.progress_memory.items.map(item => ({
    id: item.id,
    kind: 'progress',
    title: textOrFallback(item.summary, 'Progress update'),
    preview: item.blockers && item.blockers.length > 0
      ? 'Blockers: ' + item.blockers.join(', ')
      : 'Execution update with no blockers recorded.',
    meta: summarizeText([item.status || '', item.confidence || '', formatDate(item.date)]),
    detailTitle: textOrFallback(item.summary, 'Progress update'),
    detailBody: item.blockers && item.blockers.length > 0
      ? 'Blockers: ' + item.blockers.join(', ')
      : 'Execution update with no blockers recorded.',
    detailMeta: [
      item.status ? 'Status: ' + item.status : '',
      item.confidence ? 'Confidence: ' + item.confidence : '',
      item.related_change_id ? 'Related change: ' + item.related_change_id : '',
      item.date ? 'Recorded: ' + formatDate(item.date) : '',
    ].filter(Boolean),
    related_change_id: item.related_change_id || null,
    related_milestone: null,
  }));

  const milestones = dashboard.memory.milestone_memory.items.map(item => ({
    id: 'milestone:' + item.name,
    kind: 'milestone',
    title: textOrFallback(item.name, 'Unnamed milestone'),
    preview: item.completion ? 'Completion: ' + item.completion : 'No completion set yet.',
    meta: summarizeText([
      item.status || '',
      item.completion ? 'Completion: ' + item.completion : '',
      item.confidence || '',
    ]),
    detailTitle: textOrFallback(item.name, 'Unnamed milestone'),
    detailBody: item.completion ? 'Manual completion set to ' + item.completion + '.' : 'No completion set yet.',
    detailMeta: [
      item.status ? 'Status: ' + item.status : '',
      item.completion ? 'Completion: ' + item.completion : '',
      item.confidence ? 'Confidence: ' + item.confidence : '',
      item.last_updated ? 'Updated: ' + formatDate(item.last_updated) : '',
    ].filter(Boolean),
    related_change_id: null,
    related_milestone: item.name || null,
  }));

  const notes = dashboard.memory.note_memory.items.map(item => ({
    id: item.id,
    kind: 'note',
    title: item.tags && item.tags.length > 0 ? item.tags.join(', ') : 'Note',
    preview: textOrFallback(item.note, 'No note body provided.'),
    meta: summarizeText([item.related_change_id ? 'linked' : '', formatDate(item.time)]),
    detailTitle: item.tags && item.tags.length > 0 ? item.tags.join(', ') : 'Note',
    detailBody: textOrFallback(item.note, 'No note body provided.'),
    detailMeta: [
      item.related_change_id ? 'Related change: ' + item.related_change_id : '',
      item.tags && item.tags.length > 0 ? 'Tags: ' + item.tags.join(', ') : '',
      item.time ? 'Recorded: ' + formatDate(item.time) : '',
    ].filter(Boolean),
    related_change_id: item.related_change_id || null,
    related_milestone: null,
  }));

  return {
    decisions: {
      summary: dashboard.memory.decision_memory.summary,
      items: decisions,
      empty: 'No decision memory yet.',
    },
    progress: {
      summary: dashboard.memory.progress_memory.summary,
      items: progress,
      empty: 'No progress memory yet.',
    },
    milestones: {
      summary: dashboard.memory.milestone_memory.summary,
      items: milestones,
      empty: 'No milestone memory yet.',
    },
    notes: {
      summary: dashboard.memory.note_memory.summary,
      items: notes,
      empty: 'No notes yet.',
    },
  };
}

function getLinkedItems(selected, browserData, dashboard) {
  const linked = [];
  const kindToTab = {
    decision: 'decisions',
    progress: 'progress',
    milestone: 'milestones',
    note: 'notes',
  };

  const allItems = [
    ...browserData.decisions.items,
    ...browserData.progress.items,
    ...browserData.milestones.items,
    ...browserData.notes.items,
  ];

  for (const item of allItems) {
    if (item.id === selected.id) continue;

    const sameChange = selected.related_change_id && item.related_change_id && selected.related_change_id === item.related_change_id;
    const sameMilestone = selected.related_milestone && item.related_milestone && selected.related_milestone === item.related_milestone;

    if (sameChange || sameMilestone) {
      linked.push({
        id: item.id,
        tab: kindToTab[item.kind] || 'decisions',
        title: item.title,
        body: item.preview,
        meta: summarizeText([item.kind, item.meta]),
      });
    }
  }

  if (selected.kind === 'milestone') {
    for (const action of dashboard.next_actions || []) {
      if (action.related_milestone === selected.related_milestone) {
        linked.push({
          id: selected.id,
          tab: 'milestones',
          title: action.title || 'Next action',
          body: action.description || action.reasoning || 'No action description provided.',
          meta: summarizeText(['next action', action.confidence || '']),
        });
      }
    }
  }

  return linked.slice(0, 6);
}

function renderGoals(goals) {
  if (!goals || goals.length === 0) {
    renderEmpty(elements.goalList, 'No long-term goals surfaced yet.');
    return;
  }

  elements.goalList.innerHTML = goals
    .map(goal => '<span class="goal-pill">' + escapeHtml(goal) + '</span>')
    .join('');
}

function renderDetail(tabData, browserData) {
  if (!tabData.items.length) {
    elements.detailTitle.textContent = 'No items';
    elements.detailBody.textContent = tabData.empty;
    elements.detailMeta.innerHTML = '';
    renderEmpty(elements.detailLinks, 'No linked memory.');
    return;
  }

  const selected = tabData.items.find(item => item.id === state.selectedDetailId) || tabData.items[0];
  state.selectedDetailId = selected.id;

  elements.detailTitle.textContent = selected.detailTitle;
  elements.detailBody.textContent = selected.detailBody;

  renderList(
    elements.detailMeta,
    selected.detailMeta || [],
    item => '<div class="detail-meta-item">' + escapeHtml(item) + '</div>',
    'No detail metadata.'
  );

  const linked = getLinkedItems(selected, browserData, state.dashboard);
  renderList(elements.detailLinks, linked, linkItem, 'No linked memory found for this item.');
}

function renderBrowser() {
  if (!state.dashboard) return;

  const browserData = getBrowserData(state.dashboard);
  const tabData = browserData[state.activeTab];
  elements.memorySummary.textContent = tabData.summary;

  if (!tabData.items.length) {
    renderEmpty(elements.memoryList, tabData.empty);
    renderDetail(tabData, browserData);
    return;
  }

  if (!tabData.items.some(item => item.id === state.selectedDetailId)) {
    state.selectedDetailId = tabData.items[0].id;
  }

  elements.memoryList.innerHTML = tabData.items.map(browserButton).join('');
  renderDetail(tabData, browserData);
}

function renderDashboard(dashboard) {
  state.dashboard = dashboard;

  const inProgressItems = getInProgressItems(dashboard);
  const evidenceItems = getEvidenceItems(dashboard);
  const topDecision = dashboard.memory.decision_memory.items[0];

  elements.heroProjectName.textContent = dashboard.overview.project_name || 'Unnamed project';
  elements.overviewSummary.textContent = dashboard.overview.summary || 'No summary available.';

  elements.metricFocus.textContent = dashboard.overview.current_focus.area || 'No current focus';
  elements.metricFocusDetail.textContent = 'Confidence: ' + (dashboard.overview.current_focus.confidence || 'unknown');
  elements.metricProgress.textContent = dashboard.overview.overall_completion === null ? 'Unknown' : dashboard.overview.overall_completion;
  elements.metricProgressDetail.textContent = 'Model confidence: ' + (dashboard.overview.confidence || 'unknown');
  elements.metricRunning.textContent = String(inProgressItems.length);
  elements.metricRunningDetail.textContent = inProgressItems.length > 0 ? 'Milestones or progress entries currently active.' : 'No active execution items recorded.';
  elements.metricRisk.textContent = dashboard.activity.staleness_risk || 'unknown';
  elements.metricRiskDetail.textContent = 'Last active: ' + formatDate(dashboard.activity.last_active_at);

  elements.initChip.textContent = dashboard.meta.is_initialized ? 'Initialized' : 'Uninitialized';
  elements.layerProjectName.textContent = dashboard.overview.project_name || 'Unnamed project';
  elements.layerProjectSummary.textContent = dashboard.memory.long_term.project_spec?.product_goal
    || dashboard.memory.long_term.manifest?.summary
    || 'No long-term project summary available.';
  renderGoals(dashboard.overview.goals || []);

  elements.decisionHeadline.textContent = topDecision?.title || 'No decisions recorded yet';
  elements.decisionHeadlineCopy.textContent = topDecision?.decision || 'Decision memory is still empty.';

  renderList(
    elements.decisionRail,
    dashboard.memory.decision_memory.items.slice(0, 3).map(item => ({
      title: item.title || 'Untitled decision',
      body: item.rationale || item.decision || 'No rationale provided.',
      meta: summarizeText([item.scope, formatDate(item.created_at)]),
    })),
    miniCard,
    'No decisions recorded yet.'
  );

  renderList(elements.inProgressList, inProgressItems, miniCard, 'No in-progress memory has been captured yet.');
  renderList(elements.evidenceList, evidenceItems, miniCard, 'No evidence captured yet.');
  renderList(elements.workSpotlight, inProgressItems.slice(0, 6), workRow, 'No current work surfaced yet.');

  renderList(
    elements.actionsList,
    dashboard.next_actions || [],
    item => spotlightCard({
      title: textOrFallback(item.title, 'Untitled action'),
      body: textOrFallback(item.description || item.reasoning, 'No action description provided.'),
      meta: summarizeText([
        item.related_milestone || '',
        item.confidence || '',
        item.created_at ? formatDate(item.created_at) : '',
      ]),
    }),
    'No next actions were suggested.'
  );

  elements.metaRepoPath.textContent = dashboard.meta.repo_path || '-';
  elements.metaGeneratedAt.textContent = formatDate(dashboard.meta.generated_at);
  elements.metaDegradation.textContent = dashboard.meta.degradation_notice || '-';

  renderBrowser();
}

async function loadDashboard() {
  setStatus('Loading', 'status-badge-offline');
  const query = buildQuery();
  const url = '/api/dashboard?' + query.toString();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Dashboard request failed with ' + response.status);
    }

    const payload = await response.json();
    renderDashboard(payload.dashboard);
    history.replaceState({}, '', '/ui?' + query.toString());
    setStatus('Synced', 'status-badge-live');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus('Error', 'status-badge-error');
    elements.overviewSummary.textContent = message;
    renderEmpty(elements.inProgressList, 'Unable to fetch dashboard data.');
    renderEmpty(elements.actionsList, 'Unable to fetch dashboard data.');
    renderEmpty(elements.memoryList, 'Unable to fetch dashboard data.');
  }
}

elements.form.addEventListener('submit', event => {
  event.preventDefault();
  state.params.repo_path = elements.repoPath.value;
  state.params.recent_commits = elements.recentCommits.value;
  state.params.include_deep_analysis = elements.includeAnalysis.checked;
  loadDashboard();
});

elements.memoryTabs.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest('[data-tab]');
  if (!(button instanceof HTMLElement)) return;

  const tab = button.getAttribute('data-tab');
  if (!tab || tab === state.activeTab) return;

  state.activeTab = tab;
  state.selectedDetailId = null;

  for (const tabButton of elements.memoryTabs.querySelectorAll('.tab-button')) {
    tabButton.classList.toggle('active', tabButton.getAttribute('data-tab') === tab);
  }

  renderBrowser();
});

elements.memoryList.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest('[data-detail-id]');
  if (!(button instanceof HTMLElement)) return;

  state.selectedDetailId = button.getAttribute('data-detail-id');
  renderBrowser();
});

elements.detailLinks.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest('[data-link-tab][data-link-id]');
  if (!(button instanceof HTMLElement)) return;

  const tab = button.getAttribute('data-link-tab');
  const id = button.getAttribute('data-link-id');
  if (!tab || !id) return;

  state.activeTab = tab;
  state.selectedDetailId = id;

  for (const tabButton of elements.memoryTabs.querySelectorAll('.tab-button')) {
    tabButton.classList.toggle('active', tabButton.getAttribute('data-tab') === tab);
  }

  renderBrowser();
});

elements.metaToggle.addEventListener('click', () => {
  if (elements.metaDrawer.classList.contains('open')) {
    closeMetaDrawer();
  } else {
    openMetaDrawer();
  }
});

elements.metaClose.addEventListener('click', closeMetaDrawer);
elements.metaDrawer.addEventListener('click', event => {
  if (event.target === elements.metaDrawer) {
    closeMetaDrawer();
  }
});

syncFormFromQuery();
loadDashboard();
