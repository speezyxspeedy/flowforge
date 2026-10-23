/**
 * FlowForge Kanban Board (Signature Feature)
 * Implements native HTML5 Drag and Drop with optimistic updates, rollback,
 * accessible non-drag status switcher, column adders, and project filtering.
 */

let boardTasks = [];
let boardPriorityFilter = 'all';
let boardSearchQuery = '';

async function renderBoard() {
  const container = document.getElementById('page-view-container');
  if (!container) return;

  // Ensure projects are loaded
  if (!AppState.projects || AppState.projects.length === 0) {
    try {
      AppState.projects = await API.getProjects();
    } catch (_) {}
  }

  const selectedProjectId = AppState.selectedProjectId;
  const selectedProject = AppState.projects.find((p) => p.id === Number(selectedProjectId));

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-heading">
          ${selectedProject ? `${escapeHtml(selectedProject.name)} Board` : 'Kanban Board'}
        </h1>
        <p class="page-subheading">
          ${selectedProject ? escapeHtml(selectedProject.description || 'Sprint & task workflow') : 'Visual workflow tracking across all active projects.'}
        </p>
      </div>
      <div class="page-actions">
        <a class="btn btn-secondary" href="${API.getExportCsvUrl(selectedProjectId)}" download>
          ${Icons.download} Export CSV
        </a>
        <button class="btn btn-primary" onclick="openCreateTaskModal(null, '${selectedProjectId || ''}')">
          ${Icons.plus} Add Task
        </button>
      </div>
    </div>

    <!-- Board Filter Toolbar -->
    <div class="board-toolbar">
      <div class="board-filters">
        <select class="form-select" style="min-width: 200px;" onchange="handleBoardProjectChange(this.value)">
          <option value="">All Projects</option>
          ${AppState.projects.map((p) => `
            <option value="${p.id}" ${Number(selectedProjectId) === p.id ? 'selected' : ''}>
              ${escapeHtml(p.name)}
            </option>
          `).join('')}
        </select>

        <select class="form-select" style="width: auto;" onchange="handleBoardPriorityChange(this.value)">
          <option value="all" ${boardPriorityFilter === 'all' ? 'selected' : ''}>All Priorities</option>
          <option value="urgent" ${boardPriorityFilter === 'urgent' ? 'selected' : ''}>Urgent</option>
          <option value="high" ${boardPriorityFilter === 'high' ? 'selected' : ''}>High</option>
          <option value="medium" ${boardPriorityFilter === 'medium' ? 'selected' : ''}>Medium</option>
          <option value="low" ${boardPriorityFilter === 'low' ? 'selected' : ''}>Low</option>
        </select>

        <div class="search-input-wrap">
          ${Icons.search}
          <input type="text" placeholder="Search tasks..." value="${escapeHtml(boardSearchQuery)}" oninput="handleBoardSearch(this.value)" />
        </div>
      </div>
    </div>

    <!-- 3-Column Kanban Layout -->
    <div class="board-columns-container">
      <!-- TO DO Column -->
      <div class="board-column" id="column-todo" data-status="todo">
        <div class="column-header">
          <div class="column-title-wrap">
            <span class="column-status-dot todo"></span>
            <span class="column-title">To Do</span>
            <span class="column-count-badge" id="count-todo">0</span>
          </div>
          <button class="btn-icon-only" title="Add Task to To Do" onclick="openCreateTaskModal('todo', '${selectedProjectId || ''}')">
            ${Icons.plus}
          </button>
        </div>
        <div class="column-cards-list" id="cards-todo" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'todo')">
          <div style="padding: 20px; text-align: center; color: var(--text-tertiary);">Loading...</div>
        </div>
      </div>

      <!-- IN PROGRESS Column -->
      <div class="board-column" id="column-in_progress" data-status="in_progress">
        <div class="column-header">
          <div class="column-title-wrap">
            <span class="column-status-dot in_progress"></span>
            <span class="column-title">In Progress</span>
            <span class="column-count-badge" id="count-in_progress">0</span>
          </div>
          <button class="btn-icon-only" title="Add Task to In Progress" onclick="openCreateTaskModal('in_progress', '${selectedProjectId || ''}')">
            ${Icons.plus}
          </button>
        </div>
        <div class="column-cards-list" id="cards-in_progress" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'in_progress')">
          <div style="padding: 20px; text-align: center; color: var(--text-tertiary);">Loading...</div>
        </div>
      </div>

      <!-- DONE Column -->
      <div class="board-column" id="column-done" data-status="done">
        <div class="column-header">
          <div class="column-title-wrap">
            <span class="column-status-dot done"></span>
            <span class="column-title">Done</span>
            <span class="column-count-badge" id="count-done">0</span>
          </div>
          <button class="btn-icon-only" title="Add Task to Done" onclick="openCreateTaskModal('done', '${selectedProjectId || ''}')">
            ${Icons.plus}
          </button>
        </div>
        <div class="column-cards-list" id="cards-done" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'done')">
          <div style="padding: 20px; text-align: center; color: var(--text-tertiary);">Loading...</div>
        </div>
      </div>
    </div>
  `;

  await loadBoardTasks();
}

async function loadBoardTasks() {
  try {
    const filters = {};
    if (AppState.selectedProjectId) filters.projectId = AppState.selectedProjectId;
    if (boardPriorityFilter !== 'all') filters.priority = boardPriorityFilter;
    if (boardSearchQuery) filters.search = boardSearchQuery;
    filters.sortBy = 'position';

    boardTasks = await API.getTasks(filters);
    renderColumnCards();
  } catch (err) {
    showToast('Failed to load board tasks', err.message, 'error');
  }
}

function renderColumnCards() {
  const columns = {
    todo: document.getElementById('cards-todo'),
    in_progress: document.getElementById('cards-in_progress'),
    done: document.getElementById('cards-done'),
  };

  if (!columns.todo || !columns.in_progress || !columns.done) return;

  const counts = { todo: 0, in_progress: 0, done: 0 };
  const lists = { todo: '', in_progress: '', done: '' };

  boardTasks.forEach((task) => {
    const status = task.status in columns ? task.status : 'todo';
    counts[status]++;

    const friendlyDue = formatFriendlyDate(task.due_date);
    const isOverdue = task.is_overdue;

    lists[status] += `
      <div 
        class="task-card" 
        id="task-card-${task.id}" 
        draggable="true" 
        ondragstart="handleDragStart(event, ${task.id}, '${task.status}')" 
        ondragend="handleDragEnd(event)"
      >
        <div class="task-card-header">
          <span class="project-tag-pill" title="${escapeHtml(task.project_name || 'Project')}">
            <span class="project-tag-dot" style="background-color: ${task.project_color || 'var(--accent-violet)'};"></span>
            <span>${escapeHtml(task.project_name || 'Project')}</span>
          </span>
          <span class="badge badge-priority-${task.priority}">
            ${task.priority.toUpperCase()}
          </span>
        </div>

        <h4 class="task-card-title" onclick="openTaskDetailById(${task.id})">
          ${escapeHtml(task.title)}
        </h4>

        ${task.description ? `<p class="task-card-desc">${escapeHtml(task.description)}</p>` : ''}

        <div class="task-card-footer">
          <div class="task-card-meta-left">
            ${task.due_date ? `
              <span class="due-date-pill ${isOverdue ? 'overdue' : ''}" title="${formatDate(task.due_date)}">
                ${Icons.clock} ${friendlyDue}
              </span>
            ` : `<span style="font-size: var(--text-xs); color: var(--text-tertiary);">No date</span>`}
          </div>

          <div class="task-card-actions">
            <!-- Non-drag status changer (Accessibility) -->
            <select 
              class="form-select btn-sm" 
              style="padding: 2px 6px; font-size: 0.688rem; border-color: var(--border-subtle); height: 24px;" 
              aria-label="Change status"
              onchange="changeTaskStatusNonDrag(${task.id}, this.value)"
            >
              <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
              <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>Doing</option>
              <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
            </select>

            <button class="btn-icon-only" onclick="toggleTaskCardDropdown(event, ${task.id})" title="Task options">
              ${Icons.moreVertical}
            </button>
            <div id="task-dropdown-${task.id}" class="dropdown-menu">
              <div class="dropdown-item" onclick="openEditTaskModal(${task.id})">${Icons.edit} Edit Task</div>
              <div class="dropdown-item danger" onclick="openDeleteTaskModal(${task.id}, '${escapeHtml(task.title)}')">${Icons.trash} Delete Task</div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  // Populate columns and counts
  ['todo', 'in_progress', 'done'].forEach((st) => {
    const badge = document.getElementById(`count-${st}`);
    if (badge) badge.textContent = counts[st];

    if (counts[st] === 0) {
      columns[st].innerHTML = `
        <div style="padding: 30px 12px; text-align: center; color: var(--text-tertiary); font-size: var(--text-xs);">
          No tasks in ${st.replace('_', ' ')}
        </div>
      `;
    } else {
      columns[st].innerHTML = lists[st];
    }
  });
}

function handleBoardProjectChange(projectId) {
  AppState.selectedProjectId = projectId ? Number(projectId) : null;
  loadBoardTasks();
}

function handleBoardPriorityChange(priority) {
  boardPriorityFilter = priority;
  loadBoardTasks();
}

function handleBoardSearch(query) {
  boardSearchQuery = query.trim();
  loadBoardTasks();
}

// ==========================================
// Native HTML5 Drag and Drop Engine
// ==========================================
let draggedTaskId = null;
let draggedSourceStatus = null;

function handleDragStart(event, taskId, status) {
  draggedTaskId = taskId;
  draggedSourceStatus = status;
  event.dataTransfer.setData('text/plain', String(taskId));
  event.dataTransfer.effectAllowed = 'move';

  const card = document.getElementById(`task-card-${taskId}`);
  if (card) {
    setTimeout(() => card.classList.add('is-dragging'), 0);
  }
}

function handleDragEnd(event) {
  const card = document.getElementById(`task-card-${draggedTaskId}`);
  if (card) {
    card.classList.remove('is-dragging');
  }
  document.querySelectorAll('.column-cards-list').forEach((c) => c.classList.remove('drag-over'));
  draggedTaskId = null;
  draggedSourceStatus = null;
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const columnList = event.currentTarget;
  if (!columnList.classList.contains('drag-over')) {
    columnList.classList.add('drag-over');
  }
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

async function handleDrop(event, targetStatus) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');

  const taskId = Number(event.dataTransfer.getData('text/plain') || draggedTaskId);
  if (!taskId || !targetStatus) return;

  const task = boardTasks.find((t) => t.id === taskId);
  if (!task || task.status === targetStatus) return;

  const previousStatus = task.status;

  // 1. Optimistic Update in State & UI
  task.status = targetStatus;
  renderColumnCards();

  // 2. Persist to Backend API
  try {
    await API.updateTaskStatus(taskId, targetStatus);
    showToast('Task Moved', `"${task.title}" is now in ${targetStatus.replace('_', ' ').toUpperCase()}`, 'info');
  } catch (err) {
    // 3. Rollback on Failure
    task.status = previousStatus;
    renderColumnCards();
    showToast('Failed to update task status', `${err.message}. Reverting to original column.`, 'error');
  }
}

// Non-drag Status Alternative (Keyboard & Accessibility)
async function changeTaskStatusNonDrag(taskId, newStatus) {
  const task = boardTasks.find((t) => t.id === taskId);
  if (!task || task.status === newStatus) return;

  const oldStatus = task.status;
  task.status = newStatus;
  renderColumnCards();

  try {
    await API.updateTaskStatus(taskId, newStatus);
    showToast('Status Updated', `Moved to ${newStatus.replace('_', ' ').toUpperCase()}`, 'info');
  } catch (err) {
    task.status = oldStatus;
    renderColumnCards();
    showToast('Failed to update status', err.message, 'error');
  }
}

function toggleTaskCardDropdown(event, taskId) {
  event.stopPropagation();
  const dropdown = document.getElementById(`task-dropdown-${taskId}`);
  document.querySelectorAll('.dropdown-menu').forEach((d) => {
    if (d !== dropdown) d.classList.remove('active');
  });
  if (dropdown) dropdown.classList.toggle('active');
}

window.renderBoard = renderBoard;
window.handleBoardProjectChange = handleBoardProjectChange;
window.handleBoardPriorityChange = handleBoardPriorityChange;
window.handleBoardSearch = handleBoardSearch;
window.handleDragStart = handleDragStart;
window.handleDragEnd = handleDragEnd;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;
window.changeTaskStatusNonDrag = changeTaskStatusNonDrag;
window.toggleTaskCardDropdown = toggleTaskCardDropdown;
