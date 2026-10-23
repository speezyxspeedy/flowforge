/**
 * FlowForge Activity Timeline
 * Renders chronological activity audit feed with event type filtering and relative times.
 */

let currentActivityFilter = 'all';

async function renderActivity(filter = currentActivityFilter) {
  const container = document.getElementById('page-view-container');
  if (!container) return;

  currentActivityFilter = filter;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-heading">Activity Timeline</h1>
        <p class="page-subheading">Audit trail of workspace milestones, status updates, and deliveries.</p>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-toolbar">
      <div class="filter-tabs">
        <button class="filter-tab ${currentActivityFilter === 'all' ? 'active' : ''}" onclick="renderActivity('all')">All Events</button>
        <button class="filter-tab ${currentActivityFilter === 'project' ? 'active' : ''}" onclick="renderActivity('project')">Projects</button>
        <button class="filter-tab ${currentActivityFilter === 'task' ? 'active' : ''}" onclick="renderActivity('task')">Tasks</button>
        <button class="filter-tab ${currentActivityFilter === 'task_completed' ? 'active' : ''}" onclick="renderActivity('task_completed')">Completed</button>
      </div>
    </div>

    <div class="card" style="max-width: 800px; padding: var(--space-6);" id="activity-content-wrap">
      <div style="padding: 40px; text-align: center; color: var(--text-tertiary);">Loading activity timeline...</div>
    </div>
  `;

  try {
    const filters = { limit: 100 };
    if (currentActivityFilter === 'task_completed') {
      filters.eventType = 'task_completed';
    }

    let activities = await API.getActivity(filters);

    if (currentActivityFilter === 'project') {
      activities = activities.filter((a) => a.entity_type === 'project');
    } else if (currentActivityFilter === 'task') {
      activities = activities.filter((a) => a.entity_type === 'task');
    }

    const wrap = document.getElementById('activity-content-wrap');
    if (!wrap) return;

    if (activities.length === 0) {
      wrap.innerHTML = `
        <div class="empty-state" style="border: none;">
          <div class="empty-state-icon">${Icons.activity}</div>
          <h2 class="empty-state-title">No activity recorded</h2>
          <p class="empty-state-desc">Actions like creating projects, moving tasks, or completing deliverables will appear here.</p>
        </div>
      `;
      return;
    }

    const eventIconMap = {
      project_created: Icons.projects,
      project_updated: Icons.edit,
      project_archived: Icons.archive,
      project_deleted: Icons.trash,
      task_created: Icons.plus,
      task_updated: Icons.edit,
      task_status_changed: Icons.board,
      task_priority_changed: Icons.clock,
      task_completed: Icons.check,
      task_deleted: Icons.trash,
    };

    let html = `<div class="timeline-feed">`;
    activities.forEach((act) => {
      const icon = eventIconMap[act.event_type] || Icons.activity;
      const isCompleted = act.event_type === 'task_completed';

      html += `
        <div class="timeline-item">
          <div class="timeline-node-icon" style="${isCompleted ? 'border-color: var(--color-success); color: var(--color-success);' : ''}">
            ${icon}
          </div>
          <div class="timeline-desc">
            ${escapeHtml(act.description)}
          </div>
          <div class="timeline-time">
            ${formatRelativeTime(act.created_at)}
            ${act.project_name ? ` · <span style="color: var(--accent-violet); font-weight: 500;">${escapeHtml(act.project_name)}</span>` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;

    wrap.innerHTML = html;
  } catch (err) {
    const wrap = document.getElementById('activity-content-wrap');
    if (wrap) {
      wrap.innerHTML = `<div style="padding: 24px; color: var(--color-danger);">Failed to load activity: ${escapeHtml(err.message)}</div>`;
    }
  }
}

window.renderActivity = renderActivity;
