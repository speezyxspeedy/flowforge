/**
 * FlowForge Analytics & Progress View
 * Renders productivity breakdown, priority matrix, and project velocity.
 */

async function renderAnalytics() {
  const container = document.getElementById('page-view-container');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-heading">Analytics & Progress</h1>
        <p class="page-subheading">Velocity metrics, completion percentages, and workload distributions.</p>
      </div>
    </div>

    <div id="analytics-content-wrap">
      <div style="padding: 40px; text-align: center; color: var(--text-tertiary);">Calculating analytics...</div>
    </div>
  `;

  try {
    const data = await API.getAnalytics();
    const wrap = document.getElementById('analytics-content-wrap');
    if (!wrap) return;

    if (data.total_tasks === 0) {
      wrap.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.analytics}</div>
          <h2 class="empty-state-title">No task metrics available</h2>
          <p class="empty-state-desc">Create projects and tasks or seed the demo workspace to generate analytics.</p>
          <button class="btn btn-primary" onclick="seedSampleData()">${Icons.sparkles} Load Demo Workspace</button>
        </div>
      `;
      return;
    }

    const priorityMax = Math.max(
      data.by_priority.urgent || 0,
      data.by_priority.high || 0,
      data.by_priority.medium || 0,
      data.by_priority.low || 0,
      1
    );

    wrap.innerHTML = `
      <!-- Metric Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Total Tasks</span>
            <span class="stat-icon">${Icons.tasks}</span>
          </div>
          <div class="stat-value">${data.total_tasks}</div>
          <div class="stat-footer">${data.completed_tasks} completed to date</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Completion Rate</span>
            <span class="stat-icon" style="color: var(--accent-violet);">${Icons.sparkles}</span>
          </div>
          <div class="stat-value" style="color: var(--accent-violet);">${data.completion_rate}%</div>
          <div class="stat-footer">Target: 80%+ sprint rate</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">In Progress</span>
            <span class="stat-icon" style="color: #3B82F6;">${Icons.board}</span>
          </div>
          <div class="stat-value" style="color: #3B82F6;">${data.in_progress_tasks}</div>
          <div class="stat-footer">Active in flight</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Overdue</span>
            <span class="stat-icon" style="color: var(--color-danger);">${Icons.clock}</span>
          </div>
          <div class="stat-value" style="color: ${data.overdue_tasks > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">
            ${data.overdue_tasks}
          </div>
          <div class="stat-footer">${data.overdue_tasks === 0 ? 'All deadlines on schedule' : 'Requires immediate attention'}</div>
        </div>
      </div>

      <!-- Charts & Breakdown Grids -->
      <div class="analytics-grid">
        <!-- Priority Distribution -->
        <div class="analytics-card">
          <div class="section-title">
            ${Icons.analytics} Tasks by Priority
          </div>
          <div class="chart-bar-group">
            <div class="chart-bar-row">
              <div class="chart-bar-meta">
                <span style="color: var(--color-danger);">Urgent</span>
                <span>${data.by_priority.urgent}</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(data.by_priority.urgent / priorityMax) * 100}%; background-color: var(--color-danger);"></div>
              </div>
            </div>

            <div class="chart-bar-row">
              <div class="chart-bar-meta">
                <span style="color: #EA580C;">High</span>
                <span>${data.by_priority.high}</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(data.by_priority.high / priorityMax) * 100}%; background-color: #EA580C;"></div>
              </div>
            </div>

            <div class="chart-bar-row">
              <div class="chart-bar-meta">
                <span style="color: #CA8A04;">Medium</span>
                <span>${data.by_priority.medium}</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(data.by_priority.medium / priorityMax) * 100}%; background-color: #CA8A04;"></div>
              </div>
            </div>

            <div class="chart-bar-row">
              <div class="chart-bar-meta">
                <span style="color: #64748B;">Low</span>
                <span>${data.by_priority.low}</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(data.by_priority.low / priorityMax) * 100}%; background-color: #64748B;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Distribution -->
        <div class="analytics-card">
          <div class="section-title">
            ${Icons.board} Tasks by Status
          </div>
          <div class="chart-bar-group">
            <div class="chart-bar-row">
              <div class="chart-bar-meta">
                <span>To Do</span>
                <span>${data.by_status.todo} (${data.total_tasks > 0 ? Math.round((data.by_status.todo / data.total_tasks) * 100) : 0}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(data.by_status.todo / data.total_tasks) * 100}%; background-color: var(--border-hover);"></div>
              </div>
            </div>

            <div class="chart-bar-row">
              <div class="chart-bar-meta">
                <span style="color: #2563EB;">In Progress</span>
                <span>${data.by_status.in_progress} (${data.total_tasks > 0 ? Math.round((data.by_status.in_progress / data.total_tasks) * 100) : 0}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(data.by_status.in_progress / data.total_tasks) * 100}%; background-color: #2563EB;"></div>
              </div>
            </div>

            <div class="chart-bar-row">
              <div class="chart-bar-meta">
                <span style="color: var(--color-success);">Done</span>
                <span>${data.by_status.done} (${data.total_tasks > 0 ? Math.round((data.by_status.done / data.total_tasks) * 100) : 0}%)</span>
              </div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(data.by_status.done / data.total_tasks) * 100}%; background-color: var(--color-success);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Project Completion Matrix -->
      <div class="analytics-card" style="margin-top: var(--space-6);">
        <div class="section-title" style="margin-bottom: var(--space-4);">
          ${Icons.projects} Project Progress Comparison
        </div>
        <div style="display: flex; flex-direction: column; gap: var(--space-4);">
          ${data.by_project.map((p) => `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); font-weight: 600; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${p.color};"></span>
                  <span>${escapeHtml(p.name)}</span>
                </div>
                <span>${p.done} / ${p.total} tasks (${p.rate}%)</span>
              </div>
              <div class="progress-track" style="height: 8px;">
                <div class="progress-fill" style="width: ${p.rate}%; background-color: ${p.color};"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    const wrap = document.getElementById('analytics-content-wrap');
    if (wrap) {
      wrap.innerHTML = `<div style="padding: 24px; color: var(--color-danger);">Failed to calculate analytics: ${escapeHtml(err.message)}</div>`;
    }
  }
}

window.renderAnalytics = renderAnalytics;
