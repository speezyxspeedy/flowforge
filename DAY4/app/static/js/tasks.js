/**
 * FlowForge Tasks Management & My Tasks View
 * Handles personal task list, smart date filtering, quick completion,
 * task creation/editing modals, and task detail inspection.
 */

let myTasksTab = 'all'; // all, today, upcoming, overdue, completed
let myTasksProject = '';
let myTasksPriority = '';
let myTasksSort = 'due_date';
let myTasksSearch = '';

async function renderMyTasks() {
  const container = document.getElementById('page-view-container');
  if (!container) return;

  // Ensure projects are available for filtering
  if (!AppState.projects || AppState.projects.length === 0) {
    try {
      AppState.projects = await API.getProjects();
    } catch (_) {}
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-heading">My Tasks</h1>
        <p class="page-subheading">Personal focus view across active projects, deadlines, and priorities.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openCreateTaskModal()">
          ${Icons.plus} Add Task
        </button>
      </div>
    </div>

    <!-- Filter & Smart Tabs Toolbar -->
    <div class="filter-toolbar">
      <div class="filter-tabs">
        <button class="filter-tab ${myTasksTab === 'all' ? 'active' : ''}" onclick="setMyTasksTab('all')">All Tasks</button>
        <button class="filter-tab ${myTasksTab === 'today' ? 'active' : ''}" onclick="setMyTasksTab('today')">Today</button>
        <button class="filter-tab ${myTasksTab === 'upcoming' ? 'active' : ''}" onclick="setMyTasksTab('upcoming')">Upcoming</button>
        <button class="filter-tab ${myTasksTab === 'overdue' ? 'active' : ''}" onclick="setMyTasksTab('overdue')">Overdue</button>
        <button class="filter-tab ${myTasksTab === 'completed' ? 'active' : ''}" onclick="setMyTasksTab('completed')">Completed</button>
      </div>

      <div class="filter-controls">
        <div class="search-input-wrap">
          ${Icons.search}
          <input type="text" placeholder="Filter tasks..." value="${escapeHtml(myTasksSearch)}" oninput="handleMyTasksSearch(this.value)" />
        </div>

        <select class="form-select" style="width: auto;" onchange="handleMyTasksProjectChange(this.value)">
          <option value="">All Projects</option>
          ${AppState.projects.map((p) => `
            <option value="${p.id}" ${myTasksProject === String(p.id) ? 'selected' : ''}>
              ${escapeHtml(p.name)}
            </option>
          `).join('')}
        </select>

        <select class="form-select" style="width: auto;" onchange="handleMyTasksPriorityChange(this.value)">
          <option value="">All Priorities</option>
          <option value="urgent" ${myTasksPriority === 'urgent' ? 'selected' : ''}>Urgent</option>
          <option value="high" ${myTasksPriority === 'high' ? 'selected' : ''}>High</option>
          <option value="medium" ${myTasksPriority === 'medium' ? 'selected' : ''}>Medium</option>
          <option value="low" ${myTasksPriority === 'low' ? 'selected' : ''}>Low</option>
        </select>

        <select class="form-select" style="width: auto;" onchange="handleMyTasksSortChange(this.value)">
          <option value="due_date" ${myTasksSort === 'due_date' ? 'selected' : ''}>Sort: Due Date</option>
          <option value="priority" ${myTasksSort === 'priority' ? 'selected' : ''}>Sort: Priority</option>
          <option value="created" ${myTasksSort === 'created' ? 'selected' : ''}>Sort: Recently Created</option>
        </select>
      </div>
    </div>

    <!-- Task List Container -->
    <div class="tasks-list-container" id="my-tasks-list-wrap">
      <div style="padding: 40px; text-align: center; color: var(--text-tertiary);">Loading your tasks...</div>
    </div>
  `;

  await loadMyTasksList();
}

async function loadMyTasksList() {
  const wrap = document.getElementById('my-tasks-list-wrap');
  if (!wrap) return;

  try {
    const filters = {};
    if (myTasksTab !== 'all') filters.dueFilter = myTasksTab;
    if (myTasksProject) filters.projectId = myTasksProject;
    if (myTasksPriority) filters.priority = myTasksPriority;
    if (myTasksSearch) filters.search = myTasksSearch;
    filters.sortBy = myTasksSort;

    const tasks = await API.getTasks(filters);

    if (tasks.length === 0) {
      wrap.innerHTML = `
        <div class="empty-state" style="border: none; border-radius: 0;">
          <div class="empty-state-icon">${Icons.check}</div>
          <h2 class="empty-state-title">No tasks found</h2>
          <p class="empty-state-desc">
            ${myTasksTab === 'overdue' ? 'Terrific! You have no overdue tasks.' : myTasksTab === 'today' ? 'No tasks scheduled for today.' : 'Everything is clear in this view.'}
          </p>
          <button class="btn btn-primary" onclick="openCreateTaskModal()">${Icons.plus} Add New Task</button>
        </div>
      `;
      return;
    }

    let html = `
      <div class="tasks-list-row header">
        <span></span>
        <span>Title</span>
        <span class="task-col-hide-mobile">Project</span>
        <span>Priority</span>
        <span class="task-col-hide-mobile">Due Date</span>
        <span style="text-align: right;">Actions</span>
      </div>
    `;

    tasks.forEach((task) => {
      const isDone = task.status === 'done';
      const isOverdue = task.is_overdue;
      const friendlyDue = formatFriendlyDate(task.due_date);

      html += `
        <div class="tasks-list-row ${isDone ? 'is-done' : ''}" id="task-row-${task.id}">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            ${isDone ? 'checked' : ''} 
            title="${isDone ? 'Mark as incomplete' : 'Mark as complete'}"
            onchange="toggleTaskCompletion(${task.id}, this.checked)"
          />
          <div class="task-row-title" onclick="openTaskDetailById(${task.id})">
            ${escapeHtml(task.title)}
            ${task.label ? `<span class="badge" style="background: var(--bg-surface-subtle); color: var(--text-tertiary); margin-left: 6px;">${escapeHtml(task.label)}</span>` : ''}
          </div>
          <div class="task-col-hide-mobile">
            <span class="project-tag-pill" title="${escapeHtml(task.project_name || '')}">
              <span class="project-tag-dot" style="background-color: ${task.project_color || 'var(--accent-violet)'};"></span>
              <span>${escapeHtml(task.project_name || 'Project')}</span>
            </span>
          </div>
          <div>
            <span class="badge badge-priority-${task.priority}">${task.priority.toUpperCase()}</span>
          </div>
          <div class="task-col-hide-mobile">
            ${task.due_date ? `
              <span class="due-date-pill ${isOverdue ? 'overdue' : ''}">
                ${Icons.clock} ${friendlyDue}
              </span>
            ` : `<span style="font-size: var(--text-xs); color: var(--text-tertiary);">No due date</span>`}
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 4px;">
            <button class="btn-icon-only" onclick="openEditTaskModal(${task.id})" title="Edit Task">${Icons.edit}</button>
            <button class="btn-icon-only" onclick="openDeleteTaskModal(${task.id}, '${escapeHtml(task.title)}')" title="Delete Task">${Icons.trash}</button>
          </div>
        </div>
      `;
    });

    wrap.innerHTML = html;
  } catch (err) {
    wrap.innerHTML = `<div style="padding: 24px; color: var(--color-danger);">Failed to load tasks: ${escapeHtml(err.message)}</div>`;
  }
}

function setMyTasksTab(tab) {
  myTasksTab = tab;
  renderMyTasks();
}

function handleMyTasksProjectChange(projectId) {
  myTasksProject = projectId;
  loadMyTasksList();
}

function handleMyTasksPriorityChange(priority) {
  myTasksPriority = priority;
  loadMyTasksList();
}

function handleMyTasksSortChange(sort) {
  myTasksSort = sort;
  loadMyTasksList();
}

function handleMyTasksSearch(query) {
  myTasksSearch = query.trim();
  loadMyTasksList();
}

// Quick complete / un-complete toggle
async function toggleTaskCompletion(taskId, isChecked) {
  const newStatus = isChecked ? 'done' : 'todo';
  try {
    await API.updateTaskStatus(taskId, newStatus);
    showToast(isChecked ? 'Task Completed' : 'Task Reopened', '', 'success');
    // Refresh current view
    if (AppState.currentView === 'mytasks') {
      loadMyTasksList();
    } else if (AppState.currentView === 'board') {
      if (window.renderBoard) window.renderBoard();
    } else if (AppState.currentView === 'overview') {
      if (window.renderOverview) window.renderOverview();
    }
  } catch (err) {
    showToast('Failed to update task', err.message, 'error');
    if (AppState.currentView === 'mytasks') loadMyTasksList();
  }
}

// ==========================================
// Task Modals (Create, Edit, Detail, Delete)
// ==========================================
let editingTaskId = null;

async function populateProjectSelectOptions(selectedId = null) {
  const select = document.getElementById('task-form-project');
  if (!select) return;

  if (!AppState.projects || AppState.projects.length === 0) {
    AppState.projects = await API.getProjects();
  }

  select.innerHTML = AppState.projects.map((p) => `
    <option value="${p.id}" ${Number(selectedId) === p.id ? 'selected' : ''}>
      ${escapeHtml(p.name)}
    </option>
  `).join('');
}

async function openCreateTaskModal(defaultStatus = 'todo', defaultProjectId = null) {
  editingTaskId = null;
  document.getElementById('task-modal-title').textContent = 'Create New Task';
  document.getElementById('task-form-title').value = '';
  document.getElementById('task-form-desc').value = '';
  document.getElementById('task-form-status').value = defaultStatus || 'todo';
  document.getElementById('task-form-priority').value = 'medium';
  document.getElementById('task-form-due').value = '';
  document.getElementById('task-form-label').value = '';

  await populateProjectSelectOptions(defaultProjectId || AppState.selectedProjectId);

  openModal('task-modal');
}

async function openEditTaskModal(taskId) {
  editingTaskId = taskId;
  try {
    const task = await API.getTask(taskId);
    document.getElementById('task-modal-title').textContent = 'Edit Task';
    document.getElementById('task-form-title').value = task.title;
    document.getElementById('task-form-desc').value = task.description || '';
    document.getElementById('task-form-status').value = task.status;
    document.getElementById('task-form-priority').value = task.priority;
    document.getElementById('task-form-due').value = task.due_date || '';
    document.getElementById('task-form-label').value = task.label || '';

    await populateProjectSelectOptions(task.project_id);

    openModal('task-modal');
  } catch (err) {
    showToast('Failed to load task', err.message, 'error');
  }
}

async function saveTaskForm(e) {
  e.preventDefault();
  const title = document.getElementById('task-form-title').value.trim();
  const description = document.getElementById('task-form-desc').value.trim();
  const project_id = Number(document.getElementById('task-form-project').value);
  const status = document.getElementById('task-form-status').value;
  const priority = document.getElementById('task-form-priority').value;
  const due_date = document.getElementById('task-form-due').value || null;
  const label = document.getElementById('task-form-label').value.trim() || null;

  if (!title) {
    showToast('Validation Error', 'Task title cannot be empty', 'error');
    return;
  }
  if (!project_id) {
    showToast('Validation Error', 'Please select a project for this task', 'error');
    return;
  }

  const payload = {
    title,
    description: description || null,
    project_id,
    status,
    priority,
    due_date,
    label,
  };

  try {
    if (editingTaskId) {
      await API.updateTask(editingTaskId, payload);
      showToast('Task Updated', `"${title}" has been saved`, 'success');
    } else {
      await API.createTask(payload);
      showToast('Task Created', `"${title}" added to project`, 'success');
    }
    closeModal('task-modal');

    // Refresh whichever view is currently active
    if (AppState.currentView === 'board' && window.renderBoard) {
      window.renderBoard();
    } else if (AppState.currentView === 'mytasks') {
      renderMyTasks();
    } else if (AppState.currentView === 'overview' && window.renderOverview) {
      window.renderOverview();
    } else if (AppState.currentView === 'calendar' && window.renderCalendar) {
      window.renderCalendar();
    }
  } catch (err) {
    showToast('Error saving task', err.message, 'error');
  }
}

// Task Detail Inspection Modal
async function openTaskDetailById(taskId) {
  try {
    const task = await API.getTask(taskId);
    openTaskDetail(task);
  } catch (err) {
    showToast('Failed to open task details', err.message, 'error');
  }
}

function openTaskDetail(task) {
  const modal = document.getElementById('task-detail-modal');
  if (!modal) return;

  document.getElementById('task-detail-title').textContent = task.title;
  document.getElementById('task-detail-project').innerHTML = `
    <span class="project-tag-pill">
      <span class="project-tag-dot" style="background-color: ${task.project_color || 'var(--accent-violet)'};"></span>
      <span>${escapeHtml(task.project_name || 'Project')}</span>
    </span>
  `;
  document.getElementById('task-detail-priority').innerHTML = `
    <span class="badge badge-priority-${task.priority}">${task.priority.toUpperCase()}</span>
  `;
  document.getElementById('task-detail-status').innerHTML = `
    <span class="badge badge-status badge-status-${task.status}">${task.status.toUpperCase()}</span>
  `;
  document.getElementById('task-detail-due').textContent = task.due_date ? formatDate(task.due_date) : 'No due date';
  document.getElementById('task-detail-desc').textContent = task.description || 'No additional details provided.';
  document.getElementById('task-detail-created').textContent = formatRelativeTime(task.created_at);

  // Bind actions
  const editBtn = document.getElementById('task-detail-btn-edit');
  const deleteBtn = document.getElementById('task-detail-btn-delete');
  const toggleDoneBtn = document.getElementById('task-detail-btn-toggle');

  if (editBtn) {
    editBtn.onclick = () => {
      closeModal('task-detail-modal');
      openEditTaskModal(task.id);
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = () => {
      closeModal('task-detail-modal');
      openDeleteTaskModal(task.id, task.title);
    };
  }

  if (toggleDoneBtn) {
    const isDone = task.status === 'done';
    toggleDoneBtn.textContent = isDone ? 'Mark Incomplete' : 'Mark as Done';
    toggleDoneBtn.onclick = async () => {
      closeModal('task-detail-modal');
      await toggleTaskCompletion(task.id, !isDone);
    };
  }

  openModal('task-detail-modal');
}

// Delete Task Modal
let taskToDeleteId = null;

function openDeleteTaskModal(taskId, title) {
  taskToDeleteId = taskId;
  document.getElementById('delete-task-title').textContent = title;
  openModal('delete-task-modal');
}

async function confirmDeleteTask() {
  if (!taskToDeleteId) return;
  try {
    await API.deleteTask(taskToDeleteId);
    showToast('Task Deleted', 'Task removed from project', 'info');
    closeModal('delete-task-modal');
    taskToDeleteId = null;

    if (AppState.currentView === 'board' && window.renderBoard) {
      window.renderBoard();
    } else if (AppState.currentView === 'mytasks') {
      renderMyTasks();
    } else if (AppState.currentView === 'overview' && window.renderOverview) {
      window.renderOverview();
    } else if (AppState.currentView === 'calendar' && window.renderCalendar) {
      window.renderCalendar();
    }
  } catch (err) {
    showToast('Failed to delete task', err.message, 'error');
  }
}

window.renderMyTasks = renderMyTasks;
window.setMyTasksTab = setMyTasksTab;
window.handleMyTasksProjectChange = handleMyTasksProjectChange;
window.handleMyTasksPriorityChange = handleMyTasksPriorityChange;
window.handleMyTasksSortChange = handleMyTasksSortChange;
window.handleMyTasksSearch = handleMyTasksSearch;
window.toggleTaskCompletion = toggleTaskCompletion;
window.openCreateTaskModal = openCreateTaskModal;
window.openEditTaskModal = openEditTaskModal;
window.saveTaskForm = saveTaskForm;
window.openTaskDetailById = openTaskDetailById;
window.openTaskDetail = openTaskDetail;
window.openDeleteTaskModal = openDeleteTaskModal;
window.confirmDeleteTask = confirmDeleteTask;
