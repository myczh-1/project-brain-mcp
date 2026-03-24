const RESOURCE_URI = 'ui://project-brain/dashboard';
const RESOURCE_MIME_TYPE = 'text/html;profile=mcp-app';

export function getDashboardResourceDefinition() {
  return {
    uri: RESOURCE_URI,
    name: 'project-brain-dashboard',
    title: 'Project Brain Dashboard',
    description: 'Read-only dashboard for project status and memory summaries.',
    mimeType: RESOURCE_MIME_TYPE,
    annotations: {
      audience: ['user'],
      priority: 1,
    },
  };
}

export function getDashboardResourceContents() {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Project Brain Dashboard</title>
    <style>
      :root { color-scheme: light dark; --bg: #f6f1e8; --panel: rgba(255,252,247,.86); --panel-strong: rgba(255,248,238,.95); --text: #2b1f18; --muted: #6d5b51; --accent: #c55d2c; --accent-soft: rgba(197,93,44,.12); --line: rgba(43,31,24,.11); --ok: #1d7a52; --warn: #9a6200; --danger: #a33b2b; font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif; }
      @media (prefers-color-scheme: dark) { :root { --bg: #171310; --panel: rgba(35,26,20,.86); --panel-strong: rgba(44,31,24,.95); --text: #f2e6db; --muted: #b8a59a; --accent: #ff9d5c; --accent-soft: rgba(255,157,92,.16); --line: rgba(242,230,219,.12); --ok: #71d3a3; --warn: #ffcb70; --danger: #ff9a8d; } }
      * { box-sizing: border-box; } body { margin: 0; background: radial-gradient(circle at top left, rgba(197,93,44,.16), transparent 35%), radial-gradient(circle at top right, rgba(62,126,95,.12), transparent 30%), linear-gradient(180deg, var(--bg), color-mix(in srgb, var(--bg) 86%, black)); color: var(--text); }
      .shell { max-width: 1240px; margin: 0 auto; padding: 24px; } .hero { display: grid; gap: 16px; grid-template-columns: 1.8fr 1fr; margin-bottom: 18px; } .panel { background: var(--panel); backdrop-filter: blur(18px); border: 1px solid var(--line); border-radius: 20px; padding: 18px; box-shadow: 0 20px 60px rgba(0,0,0,.08); } .eyebrow { color: var(--accent); text-transform: uppercase; letter-spacing: .12em; font-size: 12px; margin-bottom: 10px; } h1,h2,p { margin: 0; } h1 { font-size: clamp(28px,4vw,44px); line-height: 1; margin-bottom: 10px; } h2 { font-size: 18px; margin-bottom: 12px; } .subtle { color: var(--muted); } .chips,.stat-grid,.memory-grid,.list { display: grid; gap: 10px; } .chips { grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); margin-top: 14px; } .chip { border: 1px solid var(--line); border-radius: 14px; padding: 10px 12px; background: var(--accent-soft); } .chip small { display: block; color: var(--muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .06em; } .layout { display: grid; gap: 18px; grid-template-columns: 1.2fr .8fr; } .stack { display: grid; gap: 18px; } .stat-grid { grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); } .stat,.memory-card,.action-card,.commit,.hot-path { border-radius: 16px; background: var(--panel-strong); border: 1px solid var(--line); padding: 14px; } .stat .value { font-size: 24px; font-weight: 700; margin-top: 6px; } .memory-grid { grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); } .list { margin-top: 12px; } ul { margin: 0; padding-left: 18px; } li+li { margin-top: 8px; } .label { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; border-radius: 999px; padding: 5px 9px; background: var(--accent-soft); color: var(--accent); } .label.ok { color: var(--ok); background: color-mix(in srgb, var(--ok) 14%, transparent); } .label.warn { color: var(--warn); background: color-mix(in srgb, var(--warn) 14%, transparent); } .label.danger { color: var(--danger); background: color-mix(in srgb, var(--danger) 14%, transparent); } .empty { border: 1px dashed var(--line); border-radius: 16px; padding: 20px; color: var(--muted); background: color-mix(in srgb, var(--panel) 80%, transparent); } .footer { margin-top: 18px; font-size: 13px; color: var(--muted); }
      @media (max-width: 900px) { .hero,.layout { grid-template-columns: 1fr; } .shell { padding: 16px; } }
    </style>
  </head>
  <body>
    <main class="shell"><section id="app"></section></main>
    <script>
      const appRoot = document.getElementById('app');
      function escapeHtml(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
      function labelClass(value) { const normalized = String(value || '').toLowerCase(); if (normalized.includes('high') || normalized.includes('completed') || normalized.includes('done')) return 'ok'; if (normalized.includes('mid') || normalized.includes('in_progress')) return 'warn'; if (normalized.includes('low') || normalized.includes('unknown') || normalized.includes('not_started') || normalized.includes('blocked')) return 'danger'; return ''; }
      function renderList(items, renderItem, emptyMessage) { if (!items || items.length === 0) return '<div class="empty">' + escapeHtml(emptyMessage || 'No items yet.') + '</div>'; return '<div class="list">' + items.map(renderItem).join('') + '</div>'; }
      function normalizePayload(payload) { if (!payload) return null; if (payload.structuredContent) return payload.structuredContent; if (payload.params && payload.params.structuredContent) return payload.params.structuredContent; if (payload.toolOutput) return payload.toolOutput; return null; }
      function renderDashboard(data) {
        const longTerm = data.memory.long_term.manifest;
        const spec = data.memory.long_term.project_spec;
        const goals = data.overview.goals.length ? '<ul>' + data.overview.goals.map((goal) => '<li>' + escapeHtml(goal) + '</li>').join('') + '</ul>' : '<div class="empty">No long-term goals available yet.</div>';
        const stack = longTerm && longTerm.primary_stack && longTerm.primary_stack.length ? '<ul>' + longTerm.primary_stack.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>' : '<div class="empty">No primary stack recorded.</div>';
        const rules = spec && spec.architecture_rules && spec.architecture_rules.length ? '<ul>' + spec.architecture_rules.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>' : '<div class="empty">No architecture rules recorded.</div>';
        appRoot.innerHTML = \`
          <div class="hero">
            <article class="panel"><div class="eyebrow">Project Brain Dashboard</div><h1>\${escapeHtml(data.overview.project_name)}</h1><p class="subtle">\${escapeHtml(data.overview.summary)}</p><div class="chips"><div class="chip"><small>Focus</small><strong>\${escapeHtml(data.overview.current_focus.area)}</strong></div><div class="chip"><small>Progress</small><strong>\${data.overview.overall_progress === null ? 'Unknown' : escapeHtml(String(data.overview.overall_progress) + '%')}</strong></div><div class="chip"><small>Confidence</small><span class="label \${labelClass(data.overview.confidence)}">\${escapeHtml(data.overview.confidence)}</span></div><div class="chip"><small>Updated</small><strong>\${escapeHtml(new Date(data.meta.generated_at).toLocaleString())}</strong></div></div></article>
            <article class="panel"><div class="eyebrow">Long-term Memory</div><h2>Goals</h2>\${goals}</article>
          </div>
          <div class="layout">
            <div class="stack">
              <article class="panel"><div class="eyebrow">Activity</div><p class="subtle">\${escapeHtml(data.activity.summary)}</p><div class="stat-grid" style="margin-top:14px;"><div class="stat"><small class="subtle">Last Active</small><div class="value">\${data.activity.last_active_at ? escapeHtml(new Date(data.activity.last_active_at).toLocaleDateString()) : 'Unknown'}</div></div><div class="stat"><small class="subtle">Staleness Risk</small><div class="value"><span class="label \${labelClass(data.activity.staleness_risk)}">\${escapeHtml(data.activity.staleness_risk)}</span></div></div><div class="stat"><small class="subtle">Hot Paths</small><div class="value">\${escapeHtml(String(data.activity.hot_paths.length))}</div></div></div>\${renderList(data.activity.recent_commits, (commit) => '<div class="commit"><strong>' + escapeHtml(commit.message) + '</strong><div class="subtle">' + escapeHtml(commit.author) + ' • ' + escapeHtml(new Date(commit.time).toLocaleString()) + '</div></div>', 'No recent commits available.')}</article>
              <article class="panel"><div class="eyebrow">Memory Lens</div><div class="memory-grid"><section class="memory-card"><h2>Primary Stack</h2>\${stack}</section><section class="memory-card"><h2>Architecture Rules</h2>\${rules}</section><section class="memory-card"><h2>\${escapeHtml(data.memory.progress_memory.title)}</h2><p class="subtle">\${escapeHtml(data.memory.progress_memory.summary)}</p>\${renderList(data.memory.progress_memory.items, (entry) => '<div class="commit"><strong>' + escapeHtml(entry.summary) + '</strong><div class="subtle">' + escapeHtml(entry.date) + ' • ' + escapeHtml(entry.status || entry.confidence) + '</div></div>', data.memory.progress_memory.empty_message)}</section><section class="memory-card"><h2>\${escapeHtml(data.memory.decision_memory.title)}</h2><p class="subtle">\${escapeHtml(data.memory.decision_memory.summary)}</p>\${renderList(data.memory.decision_memory.items, (entry) => '<div class="commit"><strong>' + escapeHtml(entry.title || entry.decision) + '</strong><div class="subtle">' + escapeHtml(entry.rationale || '') + ' • ' + escapeHtml(entry.created_at || '') + '</div></div>', data.memory.decision_memory.empty_message)}</section><section class="memory-card"><h2>\${escapeHtml(data.memory.milestone_memory.title)}</h2><p class="subtle">\${escapeHtml(data.memory.milestone_memory.summary)}</p>\${renderList(data.memory.milestone_memory.items, (entry) => '<div class="commit"><strong>' + escapeHtml(entry.name) + '</strong><div class="subtle">' + escapeHtml(entry.status) + (entry.progress_percentage == null ? '' : ' • ' + escapeHtml(String(entry.progress_percentage) + '%')) + '</div></div>', data.memory.milestone_memory.empty_message)}</section><section class="memory-card"><h2>\${escapeHtml(data.memory.note_memory.title)}</h2><p class="subtle">\${escapeHtml(data.memory.note_memory.summary)}</p>\${renderList(data.memory.note_memory.items, (entry) => '<div class="commit"><strong>' + escapeHtml(entry.note) + '</strong><div class="subtle">' + escapeHtml((entry.tags || []).join(', ') || 'untagged') + ' • ' + escapeHtml(entry.time) + '</div></div>', data.memory.note_memory.empty_message)}</section></div></article>
            </div>
            <div class="stack">
              <article class="panel"><div class="eyebrow">Next Actions</div>\${renderList(data.next_actions, (action) => '<div class="action-card"><strong>' + escapeHtml(action.title) + '</strong><p class="subtle" style="margin-top:8px;">' + escapeHtml(action.description) + '</p><div style="margin-top:10px;"><span class="label">' + escapeHtml('score ' + action.priority_score) + '</span> <span class="label ' + labelClass(action.confidence) + '">' + escapeHtml(action.confidence) + '</span></div></div>', 'No next actions suggested yet.')}</article>
              <article class="panel"><div class="eyebrow">Hot Paths</div>\${renderList(data.activity.hot_paths, (item) => '<div class="hot-path"><strong>' + escapeHtml(item.path) + '</strong><div class="subtle">' + escapeHtml(String(item.change_count)) + ' recent changes</div></div>', 'No hot paths available.')}</article>
            </div>
          </div>
          <div class="footer">\${escapeHtml(data.meta.degradation_notice)} • Repo: \${escapeHtml(data.meta.repo_path)}</div>\`;
      }
      function showLoading(message) { appRoot.innerHTML = '<div class="panel"><div class="eyebrow">Project Brain Dashboard</div><div class="empty">' + escapeHtml(message) + '</div></div>'; }
      window.addEventListener('message', (event) => { const data = event.data; if (!data || typeof data !== 'object') return; if (data.method === 'ui/notifications/tool-result' || data.method === 'tool/result') { const payload = normalizePayload(data); if (payload) renderDashboard(payload); } });
      async function boot() { const globalBridge = window.openai; const initial = normalizePayload(globalBridge ? { toolOutput: globalBridge.toolOutput } : null); if (initial) { renderDashboard(initial); return; } showLoading('Waiting for dashboard data from the host...'); }
      boot();
    </script>
  </body>
</html>`;

  return {
    contents: [
      {
        uri: RESOURCE_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: html,
        _meta: {
          ui: {
            prefersBorder: true,
            csp: {
              resourceDomains: [],
              connectDomains: [],
              frameDomains: [],
            },
          },
        },
      },
    ],
  };
}

export function getDashboardResourceUri(): string {
  return RESOURCE_URI;
}

export function getDashboardResourceMimeType(): string {
  return RESOURCE_MIME_TYPE;
}

