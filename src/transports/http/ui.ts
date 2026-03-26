function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderUiHtml(): string {
  const title = 'Project Brain Console';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/ui/styles.css" />
  </head>
  <body>
    <div class="app-shell">
      <button id="meta-toggle" class="meta-toggle" type="button" aria-expanded="false" aria-controls="meta-drawer">
        System
      </button>

      <aside id="meta-drawer" class="meta-drawer" aria-hidden="true">
        <div class="meta-card">
          <div class="section-header">
            <div>
              <p class="eyebrow">Runtime</p>
              <h2 class="section-title">System Meta</h2>
            </div>
            <button id="meta-close" class="subtle-button" type="button">Close</button>
          </div>
          <dl class="meta-list">
            <div>
              <dt>Status</dt>
              <dd id="meta-status">Loading</dd>
            </div>
            <div>
              <dt>Repo Path</dt>
              <dd id="meta-repo-path">-</dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd id="meta-generated-at">-</dd>
            </div>
            <div>
              <dt>Degradation Notice</dt>
              <dd id="meta-degradation">-</dd>
            </div>
          </dl>
        </div>
      </aside>

      <section class="dashboard-shell">
        <header class="hero-card">
          <div class="hero-grid">
            <div>
              <p class="eyebrow">Project Brain Observability</p>
              <h1 class="hero-title" id="hero-project-name">Operations Dashboard</h1>
              <p class="hero-copy" id="overview-summary">
                Loading dashboard data.
              </p>
            </div>
            <div class="status-stack">
              <span id="status-pill" class="status-badge status-badge-offline">
                <span class="status-badge-dot"></span>
                Loading
              </span>
            </div>
          </div>

          <form id="controls-form" class="control-bar">
            <label class="control-field control-field-wide">
              <span>Repository path</span>
              <input id="repo-path" name="repo_path" type="text" placeholder="Defaults to server cwd" />
            </label>
            <label class="control-field">
              <span>Recent commits</span>
              <input id="recent-commits" name="recent_commits" type="number" min="1" max="200" value="50" />
            </label>
            <label class="control-toggle">
              <input id="include-analysis" name="include_deep_analysis" type="checkbox" checked />
              <span>Deep analysis</span>
            </label>
            <button type="submit">Refresh</button>
          </form>
        </header>

        <section class="metric-grid">
          <article class="metric-card">
            <p class="metric-label">Current focus</p>
            <p id="metric-focus" class="metric-value">-</p>
            <p id="metric-focus-detail" class="metric-detail">-</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Overall progress</p>
            <p id="metric-progress" class="metric-value numeric">-</p>
            <p id="metric-progress-detail" class="metric-detail">-</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Current work</p>
            <p id="metric-running" class="metric-value numeric">-</p>
            <p id="metric-running-detail" class="metric-detail">-</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Staleness risk</p>
            <p id="metric-risk" class="metric-value">-</p>
            <p id="metric-risk-detail" class="metric-detail">-</p>
          </article>
        </section>

        <section class="section-card">
          <div class="section-header">
            <div>
              <p class="eyebrow">Memory Layers</p>
              <h2 class="section-title">Truth to Execution</h2>
              <p class="section-copy">Project Brain is strongest when stable truth, decisions, work-in-flight, and evidence stay connected but distinct.</p>
            </div>
            <span id="init-chip" class="tag">-</span>
          </div>

          <div class="flow-grid">
            <article class="flow-card">
              <p class="flow-kicker">Long-term truth</p>
              <h3 id="layer-project-name">-</h3>
              <p id="layer-project-summary" class="flow-copy">-</p>
              <div id="goal-list" class="goal-list"></div>
            </article>
            <article class="flow-card">
              <p class="flow-kicker">Decision memory</p>
              <h3 id="decision-headline">-</h3>
              <p id="decision-headline-copy" class="flow-copy">-</p>
              <div id="decision-rail" class="mini-list"></div>
            </article>
            <article class="flow-card flow-card-active">
              <p class="flow-kicker">Active execution</p>
              <h3>In progress now</h3>
              <div id="in-progress-list" class="mini-list"></div>
            </article>
            <article class="flow-card">
              <p class="flow-kicker">Evidence and notes</p>
              <h3>Captured signals</h3>
              <div id="evidence-list" class="mini-list"></div>
            </article>
          </div>
        </section>

        <div class="content-grid">
          <section class="section-card">
            <div class="section-header">
              <div>
                <p class="eyebrow">Memory Browser</p>
                <h2 class="section-title">Inspect One Layer</h2>
                <p id="memory-summary" class="section-copy">-</p>
              </div>
              <div id="memory-tabs" class="tab-row">
                <button class="tab-button active" type="button" data-tab="decisions">Decisions</button>
                <button class="tab-button" type="button" data-tab="progress">Progress</button>
                <button class="tab-button" type="button" data-tab="milestones">Milestones</button>
                <button class="tab-button" type="button" data-tab="notes">Notes</button>
              </div>
            </div>

            <div class="browser-grid">
              <div class="browser-column">
                <div id="memory-list" class="browser-list"></div>
              </div>

              <aside class="detail-card">
                <div class="detail-block">
                  <p class="eyebrow">Detail</p>
                  <h3 id="detail-title" class="detail-title">Select an item</h3>
                  <p id="detail-body" class="detail-copy">Choose an item to inspect the full record.</p>
                  <div id="detail-meta" class="detail-meta"></div>
                </div>

                <div class="detail-block">
                  <p class="eyebrow">Linked Memory</p>
                  <div id="detail-links" class="link-list"></div>
                </div>
              </aside>
            </div>
          </section>

          <aside class="side-column">
            <section class="section-card">
              <div class="section-header">
                <div>
                  <p class="eyebrow">Execution</p>
                  <h2 class="section-title">Current Work</h2>
                </div>
              </div>
              <div id="work-spotlight" class="work-table"></div>
            </section>

            <section class="section-card">
              <div class="section-header">
                <div>
                  <p class="eyebrow">Suggestions</p>
                  <h2 class="section-title">Next Actions</h2>
                </div>
              </div>
              <div id="actions-list" class="spotlight-list"></div>
            </section>
          </aside>
        </div>
      </section>
    </div>

    <script type="module" src="/ui/app.js"></script>
  </body>
</html>`;
}

export function renderUiCss(): string {
  return `:root {
  color-scheme: light;
  --page: #f7f7f8;
  --page-soft: #fbfbfc;
  --page-deep: #ececf1;
  --card: rgba(255, 255, 255, 0.94);
  --card-muted: #f3f4f6;
  --ink: #202123;
  --muted: #6e6e80;
  --line: #ececf1;
  --line-strong: #d9d9e3;
  --accent: #10a37f;
  --accent-ink: #0f513f;
  --accent-soft: #e8faf4;
  --danger: #b42318;
  --danger-soft: #fef3f2;
  --warn: #b54708;
  --warn-soft: #fffaeb;
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.05);
  --shadow-lg: 0 20px 50px rgba(15, 23, 42, 0.08);
}

* {
  box-sizing: border-box;
}

html {
  background: var(--page);
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(16, 163, 127, 0.12) 0%, rgba(16, 163, 127, 0) 30%),
    linear-gradient(180deg, var(--page-soft) 0%, var(--page) 24%, #f3f4f6 100%);
  color: var(--ink);
  font-family: "Sohne", "SF Pro Text", "Helvetica Neue", "Segoe UI", sans-serif;
  line-height: 1.5;
}

button,
input {
  font: inherit;
}

button {
  appearance: none;
}

pre,
code,
.mono,
.numeric,
.eyebrow,
.tag,
.status-badge,
.subtle-button,
.tab-button,
dt {
  font-family: "Sohne Mono", "SFMono-Regular", "SF Mono", Consolas, "Liberation Mono", monospace;
}

.numeric {
  font-variant-numeric: tabular-nums slashed-zero;
  font-feature-settings: "tnum" 1, "zero" 1;
}

.app-shell {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1rem 3.5rem;
}

.dashboard-shell {
  display: grid;
  gap: 1rem;
}

.hero-card,
.section-card,
.metric-card,
.meta-card,
.detail-card,
.flow-card {
  background: var(--card);
  border: 1px solid rgba(217, 217, 227, 0.82);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
}

.hero-card {
  border-radius: 28px;
  padding: clamp(1.25rem, 3vw, 2rem);
  box-shadow: var(--shadow-lg);
}

.hero-grid,
.section-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 600;
}

.hero-title {
  margin: 0.35rem 0 0;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.hero-copy,
.section-copy,
.flow-copy,
.detail-copy,
.meta-list dd,
.mini-copy,
.browser-copy,
.spotlight-copy {
  color: var(--muted);
}

.hero-copy {
  margin: 0.75rem 0 0;
  max-width: 46rem;
  font-size: 1rem;
}

.status-stack {
  display: grid;
  justify-items: end;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2rem;
  padding: 0.35rem 0.78rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card-muted);
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.status-badge-dot {
  width: 0.52rem;
  height: 0.52rem;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.9;
}

.status-badge-live {
  background: var(--accent-soft);
  border-color: rgba(16, 163, 127, 0.18);
  color: var(--accent-ink);
}

.status-badge-offline {
  background: #f5f5f7;
  border-color: var(--line-strong);
  color: var(--muted);
}

.status-badge-error {
  background: var(--danger-soft);
  border-color: rgba(180, 35, 24, 0.16);
  color: var(--danger);
}

.control-bar {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) 10rem auto auto;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.control-field,
.control-toggle {
  display: grid;
  gap: 0.4rem;
}

.control-field span,
.control-toggle span {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.control-toggle {
  grid-auto-flow: column;
  align-items: center;
  justify-content: start;
  padding-top: 1.45rem;
  gap: 0.55rem;
}

.control-field input {
  width: 100%;
  min-width: 0;
}

input[type='text'],
input[type='number'] {
  border: 1px solid var(--line-strong);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--ink);
  padding: 0.78rem 0.92rem;
}

input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}

button[type='submit'] {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: white;
  border-radius: 999px;
  padding: 0.72rem 1.08rem;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: -0.01em;
  box-shadow: 0 8px 20px rgba(16, 163, 127, 0.18);
  transition:
    transform 140ms ease,
    box-shadow 140ms ease;
  align-self: end;
}

button[type='submit']:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(16, 163, 127, 0.22);
}

.metric-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.metric-card {
  border-radius: 22px;
  padding: 1rem 1.05rem 1.1rem;
}

.metric-label {
  margin: 0;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.metric-value {
  margin: 0.35rem 0 0;
  font-size: clamp(1.55rem, 2vw, 2.05rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.metric-detail,
.browser-meta,
.spotlight-meta,
.mini-meta,
.tag {
  margin: 0.45rem 0 0;
  color: var(--muted);
  font-size: 0.86rem;
}

.section-card {
  border-radius: 24px;
  padding: 1.15rem 1.2rem 1.25rem;
}

.section-title {
  margin: 0.25rem 0 0;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}

.section-copy {
  margin: 0.35rem 0 0;
}

.tag {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.3rem 0.72rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card-muted);
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 1rem;
}

.flow-card {
  border-radius: 20px;
  padding: 1rem;
}

.flow-card-active {
  border-color: rgba(16, 163, 127, 0.24);
  background: linear-gradient(180deg, rgba(232, 250, 244, 0.88), rgba(255, 255, 255, 0.94));
}

.flow-kicker {
  margin: 0 0 0.3rem;
  color: var(--muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.flow-card h3,
.detail-title,
.browser-item h3,
.spotlight-item h3,
.mini-item h3 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: -0.015em;
}

.goal-list,
.mini-list,
.spotlight-list,
.browser-list,
.detail-meta,
.link-list,
.work-table {
  display: grid;
  gap: 0.7rem;
}

.goal-pill,
.mini-item,
.spotlight-item,
.browser-item,
.detail-meta-item,
.link-item,
.meta-list div {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.goal-pill {
  display: inline-flex;
  align-items: center;
  margin: 0.6rem 0.4rem 0 0;
  padding: 0.42rem 0.68rem;
  color: var(--ink);
  font-size: 0.86rem;
}

.mini-item,
.spotlight-item,
.browser-item,
.detail-meta-item,
.link-item {
  padding: 0.8rem 0.9rem;
}

.mini-copy,
.browser-copy,
.spotlight-copy,
.link-copy,
.detail-copy {
  margin-top: 0.35rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.78fr);
  gap: 1rem;
}

.side-column {
  display: grid;
  gap: 1rem;
  align-self: start;
}

.tab-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tab-button,
.subtle-button,
.meta-toggle {
  appearance: none;
  border: 1px solid var(--line-strong);
  background: rgba(255, 255, 255, 0.72);
  color: var(--muted);
  border-radius: 999px;
  padding: 0.5rem 0.82rem;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
}

.tab-button.active {
  background: var(--accent-soft);
  border-color: rgba(16, 163, 127, 0.18);
  color: var(--accent-ink);
}

.browser-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(280px, 0.82fr);
  gap: 0.9rem;
  margin-top: 1rem;
}

.browser-item {
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.browser-item.active {
  border-color: rgba(16, 163, 127, 0.24);
  background: var(--accent-soft);
}

.detail-card {
  border-radius: 20px;
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.detail-block {
  display: grid;
  gap: 0.6rem;
}

.work-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: start;
  padding: 0.88rem 0.96rem;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.work-title {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.work-copy,
.work-sub {
  margin-top: 0.28rem;
  color: var(--muted);
  font-size: 0.88rem;
}

.work-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 5.5rem;
  min-height: 2rem;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid var(--line);
  background: var(--card-muted);
  color: var(--muted);
}

.work-status.in-progress {
  background: var(--accent-soft);
  border-color: rgba(16, 163, 127, 0.18);
  color: var(--accent-ink);
}

.work-status.blocked {
  background: var(--danger-soft);
  border-color: rgba(180, 35, 24, 0.16);
  color: var(--danger);
}

.work-status.planned {
  background: var(--warn-soft);
  border-color: rgba(181, 71, 8, 0.16);
  color: var(--warn);
}

.link-item strong {
  display: block;
  font-size: 0.92rem;
}

.link-button {
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.link-copy {
  color: var(--muted);
  font-size: 0.9rem;
}

.meta-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 20;
  box-shadow: var(--shadow-sm);
}

.meta-drawer {
  position: fixed;
  inset: 0;
  display: none;
  justify-content: end;
  align-items: start;
  padding: 1rem;
  z-index: 30;
  background: rgba(32, 33, 35, 0.12);
}

.meta-drawer.open {
  display: flex;
}

.meta-card {
  width: min(420px, 100%);
  border-radius: 24px;
  padding: 1.1rem;
}

.meta-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.meta-list div {
  padding: 0.78rem 0.88rem;
}

dt {
  margin-bottom: 0.38rem;
  color: var(--muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

dd {
  margin: 0;
  color: var(--ink);
}

.empty-state {
  border: 1px dashed var(--line-strong);
  border-radius: 16px;
  padding: 0.95rem;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.5);
}

@media (max-width: 1100px) {
  .content-grid,
  .browser-grid,
  .flow-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .control-bar {
    grid-template-columns: 1fr;
  }

  .control-toggle {
    padding-top: 0;
  }
}

@media (max-width: 760px) {
  .app-shell {
    padding: 1rem 0.75rem 2.5rem;
  }

  .hero-grid,
  .section-header {
    flex-direction: column;
  }
}`;
}

export function renderUiJs(): string {
  return `const state = {
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
    .replaceAll(\"'\", '&#39;');
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
      body: textOrFallback(item.progress_explanation, 'In progress without extra explanation yet.'),
      meta: summarizeText([
        item.progress_percentage != null ? item.progress_percentage + '%' : '',
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
    preview: textOrFallback(item.progress_explanation, 'No milestone explanation yet.'),
    meta: summarizeText([
      item.status || '',
      item.progress_percentage != null ? item.progress_percentage + '%' : '',
      item.confidence || '',
    ]),
    detailTitle: textOrFallback(item.name, 'Unnamed milestone'),
    detailBody: textOrFallback(item.progress_explanation, 'No milestone explanation yet.'),
    detailMeta: [
      item.status ? 'Status: ' + item.status : '',
      item.progress_percentage != null ? 'Progress: ' + item.progress_percentage + '%' : '',
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
  elements.metricProgress.textContent = dashboard.overview.overall_progress === null ? 'Unknown' : dashboard.overview.overall_progress + '%';
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
loadDashboard();`;
}
