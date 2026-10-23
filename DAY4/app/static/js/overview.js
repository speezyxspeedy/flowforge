/**
 * FlowForge Overview Dashboard & Settings
 * Renders editorial productivity dashboard, progress ring, active projects,
 * upcoming tasks, recent activity timeline, and workspace settings.
 */

async function renderOverview() {
  const container = document.getElementById('page-view-container');
  if (!container) return;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Dynamic greeting based on time of day
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  container.innerHTML = `
    <!-- Welcoming Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-heading">${greeting}, Builder</h1>
        <p class="page-subheading">${dateFormatted} · Focus on high-impact deliverables today.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="seedSampleData()">
          ${Icons.sparkles} Sample Workspace
        </button>
        <button class="btn btn-primary" onclick="openCreateTaskModal()">
          ${Icons.plus} Add Task
        </button>
      </div>
    </div>

    <div id="overview-content-wrap">
      <div style="padding: 40px; text-align: center; color: var(--text-tertiary);">Loading your workspace...</div>
    </div>
  `;

  try {
    const data = await API.getOverview();
    AppState.overviewData = data;

    const wrap = document.getElementById('overview-content-wrap');
    if (!wrap) return;

    if (data.total_projects === 0 && data.total_tasks === 0) {
      wrap.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.sparkles}</div>
          <h2 class="empty-state-title">Welcome to FlowForge</h2>
          <p class="empty-state-desc">
            Your workspace is fresh and ready. Create your first project or populate sample demo initiatives to explore the interactive Kanban board, calendar, and analytics.
          </p>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="openCreateProjectModal()">${Icons.plus} Create First Project</button>
            <button class="btn btn-secondary" onclick="seedSampleData()">${Icons.sparkles} Load Demo Workspace</button>
          </div>
        </div>
      `;
      return;
    }

    // Circumference calculation for progress ring
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (data.overall_completion_rate / 100) * circumference;

    wrap.innerHTML = `
      <!-- Editorial Spotlight Banner -->
      <div class="overview-spotlight">
        <div class="spotlight-text">
          <h2>“Turn ambitious plans into meaningful progress.”</h2>
          <p>
            You have <strong>${data.in_progress_tasks} task${data.in_progress_tasks === 1 ? '' : 's'}</strong> in flight and <strong>${data.due_soon_tasks}</strong> due this week across ${data.active_projects} active project${data.active_projects === 1 ? '' : 's'}.
          </p>
        </div>
        <div class="spotlight-metric">
          <div class="progress-circle-wrap">
            <svg class="progress-circle-svg" viewBox="0 0 72 72">
              <circle class="progress-circle-bg" cx="36" cy="36" r="${radius}"></circle>
              <circle 
                class="progress-circle-bar" 
                cx="36" 
                cy="36" 
                r="${radius}" 
                stroke-dasharray="${circumference}" 
                stroke-dashoffset="${strokeDashoffset}"
              ></circle>
            </svg>
            <div class="progress-circle-text">${Math.round(data.overall_completion_rate)}%</div>
          </div>
          <div class="spotlight-metric-info">
            <span class="spotlight-metric-label">Completion Velocity</span>
            <span class="spotlight-metric-val">${data.done_tasks} / ${data.total_tasks} Tasks</span>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Row -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Active Projects</span>
            <span class="stat-icon">${Icons.projects}</span>
          </div>
          <div class="stat-value">${data.active_projects}</div>
          <div class="stat-footer">${data.total_projects} total initiatives</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">In Progress</span>
            <span class="stat-icon" style="color: #3B82F6;">${Icons.board}</span>
          </div>
          <div class="stat-value" style="color: #3B82F6;">${data.in_progress_tasks}</div>
          <div class="stat-footer">${data.todo_tasks} waiting in queue</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Due Soon</span>
            <span class="stat-icon" style="color: var(--color-warning);">${Icons.clock}</span>
          </div>
          <div class="stat-value" style="color: var(--color-warning);">${data.due_soon_tasks}</div>
          <div class="stat-footer">Next 7 calendar days</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Overdue</span>
            <span class="stat-icon" style="color: var(--color-danger);">${Icons.alertTriangle}</span>
          </div>
          <div class="stat-value" style="color: ${data.overdue_tasks > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">
            ${data.overdue_tasks}
          </div>
          <div class="stat-footer">${data.overdue_tasks === 0 ? 'All deadlines clear' : 'Requires immediate attention'}</div>
        </div>
      </div>

      <!-- Split Sections: Projects in Progress & Tasks Due Soon -->
      <div class="overview-split">
        <!-- Left: Projects in Progress -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              ${Icons.projects} Active Initiatives
            </div>
            <button class="btn btn-subtle btn-sm" onclick="navigateTo('projects')">
              View All ${Icons.chevronRight}
            </button>
          </div>

          <div class="overview-projects-list">
            ${data.projects_in_progress.length === 0 ? `
              <div style="padding: 24px; text-align: center; color: var(--text-tertiary); font-size: var(--text-sm);">
                No active projects.
              </div>
            ` : data.projects_in_progress.map((p) => `
              <div class="overview-project-item" onclick="openProjectBoard(${p.id})">
                <div class="overview-project-info">
                  <span class="project-dot" style="background-color: ${p.color};"></span>
                  <div>
                    <div class="overview-project-name">${escapeHtml(p.name)}</div>
                    <div class="overview-project-counts">
                      ${p.task_counts.total} task${p.task_counts.total === 1 ? '' : 's'} · ${p.task_counts.done} done
                    </div>
                  </div>
                </div>

                <div class="overview-project-progress-wrap">
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${p.completion_rate}%; background-color: ${p.color};"></div>
                  </div>
                  <span class="progress-text">${p.completion_rate}%</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Tasks Due Soon & Recent Activity -->
        <div style="display: flex; flex-direction: column; gap: var(--space-6);">
          <!-- Tasks Due Soon -->
          <div class="section-card">
            <div class="section-header">
              <div class="section-title">
                ${Icons.clock} Deadlines Soon
              </div>
              <button class="btn btn-subtle btn-sm" onclick="navigateTo('mytasks')">
                My Tasks ${Icons.chevronRight}
              </button>
            </div>

            <div class="due-tasks-list">
              ${data.tasks_due_soon.length === 0 ? `
                <div style="padding: 20px; text-align: center; color: var(--text-tertiary); font-size: var(--text-sm);">
                  No urgent deadlines in the next 7 days.
                </div>
              ` : data.tasks_due_soon.map((t) => `
                <div class="due-task-item">
                  <div class="due-task-left">
                    <input 
                      type="checkbox" 
                      class="task-checkbox" 
                      ${t.status === 'done' ? 'checked' : ''} 
                      onchange="toggleTaskCompletion(${t.id}, this.checked)"
                    />
                    <span class="due-task-title" onclick="openTaskDetailById(${t.id})">
                      ${escapeHtml(t.title)}
                    </span>
                  </div>
                  <div class="due-task-meta">
                    <span class="badge badge-priority-${t.priority}" style="font-size: 0.65rem;">
                      ${t.priority.toUpperCase()}
                    </span>
                    <span class="due-date-pill ${t.is_overdue ? 'overdue' : ''}">
                      ${formatFriendlyDate(t.due_date)}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Activity Snippet -->
          <div class="section-card">
            <div class="section-header">
              <div class="section-title">
                ${Icons.activity} Recent Activity
              </div>
              <button class="btn btn-subtle btn-sm" onclick="navigateTo('activity')">
                History ${Icons.chevronRight}
              </button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${data.recent_activities.length === 0 ? `
                <div style="padding: 16px; text-align: center; color: var(--text-tertiary); font-size: var(--text-xs);">
                  No recent activities recorded yet.
                </div>
              ` : data.recent_activities.slice(0, 4).map((a) => `
                <div style="display: flex; align-items: flex-start; gap: 8px; font-size: var(--text-xs); color: var(--text-secondary); padding: 4px 0;">
                  <span style="color: var(--accent-violet); margin-top: 2px;">•</span>
                  <div style="flex: 1;">
                    <span style="color: var(--text-primary); font-weight: 500;">${escapeHtml(a.description)}</span>
                    <span style="color: var(--text-tertiary); margin-left: 4px;">(${formatRelativeTime(a.created_at)})</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    const wrap = document.getElementById('overview-content-wrap');
    if (wrap) {
      wrap.innerHTML = `<div style="padding: 24px; color: var(--color-danger);">Failed to load overview: ${escapeHtml(err.message)}</div>`;
    }
  }
}

// Seed Demo Workspace Action
async function seedSampleData() {
  try {
    showToast('Seeding Workspace', 'Creating sample projects and tasks...', 'info');
    const res = await API.seedDemoWorkspace();
    showToast('Sample Data Loaded', res.message || 'Workspace populated with demo initiatives', 'success');

    // Reload projects memory
    AppState.projects = await API.getProjects();

    // Reload active view
    if (AppState.currentView === 'overview') renderOverview();
    else if (AppState.currentView === 'projects' && window.renderProjects) window.renderProjects();
    else if (AppState.currentView === 'board' && window.renderBoard) window.renderBoard();
  } catch (err) {
    showToast('Failed to seed sample data', err.message, 'error');
  }
}

// Settings View
function renderSettings() {
  const container = document.getElementById('page-view-container');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-heading">Workspace Settings</h1>
        <p class="page-subheading">Manage environment preferences, data export, and demo configurations.</p>
      </div>
    </div>

    <div style="max-width: 720px; display: flex; flex-direction: column; gap: var(--space-6);">
      <!-- Workspace Profile Card -->
      <div class="card">
        <div class="section-title" style="margin-bottom: var(--space-4);">
          ${Icons.settings} Workspace Info
        </div>
        <div class="form-group">
          <label class="form-label">Workspace Name</label>
          <input type="text" class="form-input" value="FlowForge Studio" readonly />
          <span style="font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 4px;">
            Single-user local environment running on SQLite and FastAPI.
          </span>
        </div>
        <div class="form-group">
          <label class="form-label">Database Storage</label>
          <input type="text" class="form-input" value="SQLite (flowforge.db)" readonly />
        </div>
      </div>

      <!-- Export & Backup Card -->
      <div class="card">
        <div class="section-title" style="margin-bottom: var(--space-4);">
          ${Icons.download} Data Export
        </div>
        <p style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-4);">
          Download an RFC-compliant CSV containing all workspace tasks, status history, priorities, and deadlines with formula injection protection.
        </p>
        <a class="btn btn-secondary" href="${API.getExportCsvUrl()}" download>
          ${Icons.download} Download Full Workspace CSV
        </a>
      </div>

      <!-- Demo Workspace Seeder Card -->
      <div class="card">
        <div class="section-title" style="margin-bottom: var(--space-4);">
          ${Icons.sparkles} Demo Workspace Seeder
        </div>
        <p style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-4);">
          Quickly inject 3 realistic initiatives with Kanban cards, active sprints, and activity timelines for evaluation and testing.
        </p>
        <button class="btn btn-primary" onclick="seedSampleData()">
          ${Icons.sparkles} Seed Demo Workspace
        </button>
      </div>
    </div>
  `;
}

window.renderOverview = renderOverview;
window.seedSampleData = seedSampleData;
window.renderSettings = renderSettings;
