/**
 * FlowForge Projects View & Management
 * Handles project CRUD, filtering, archiving, and deletion confirmation.
 */

let currentProjectFilter = 'all';
let currentProjectSearch = '';
let currentProjectSort = 'recent';

async function renderProjects(filter = currentProjectFilter, search = currentProjectSearch, sort = currentProjectSort) {
  const container = document.getElementById('page-view-container');
  if (!container) return;

  currentProjectFilter = filter;
  currentProjectSearch = search;
  currentProjectSort = sort;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-heading">Projects</h1>
        <p class="page-subheading">Organize initiatives, track completion rates, and manage deadlines.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openCreateProjectModal()">
          ${Icons.plus} New Project
        </button>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="filter-toolbar">
      <div class="filter-tabs">
        <button class="filter-tab ${currentProjectFilter === 'all' ? 'active' : ''}" onclick="renderProjects('all')">All</button>
        <button class="filter-tab ${currentProjectFilter === 'active' ? 'active' : ''}" onclick="renderProjects('active')">Active</button>
        <button class="filter-tab ${currentProjectFilter === 'paused' ? 'active' : ''}" onclick="renderProjects('paused')">Paused</button>
        <button class="filter-tab ${currentProjectFilter === 'completed' ? 'active' : ''}" onclick="renderProjects('completed')">Completed</button>
        <button class="filter-tab ${currentProjectFilter === 'archived' ? 'active' : ''}" onclick="renderProjects('archived')">Archived</button>
      </div>

      <div class="filter-controls">
        <div class="search-input-wrap">
          ${Icons.search}
          <input type="text" placeholder="Search projects..." value="${escapeHtml(currentProjectSearch)}" oninput="renderProjects(currentProjectFilter, this.value, currentProjectSort)" />
        </div>
        <select class="form-select" style="width: auto; padding: 6px 10px;" onchange="renderProjects(currentProjectFilter, currentProjectSearch, this.value)">
          <option value="recent" ${currentProjectSort === 'recent' ? 'selected' : ''}>Recently Updated</option>
          <option value="name" ${currentProjectSort === 'name' ? 'selected' : ''}>Name (A-Z)</option>
          <option value="due_date" ${currentProjectSort === 'due_date' ? 'selected' : ''}>Target Due Date</option>
        </select>
      </div>
    </div>

    <div id="projects-list-content">
      <div style="padding: 40px; text-align: center; color: var(--text-tertiary);">Loading projects...</div>
    </div>
  `;

  try {
    const statusParam = currentProjectFilter === 'all' ? null : currentProjectFilter;
    const projects = await API.getProjects(statusParam, currentProjectSearch, currentProjectSort);
    AppState.projects = projects;

    const listContent = document.getElementById('projects-list-content');
    if (!listContent) return;

    if (projects.length === 0) {
      listContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.projects}</div>
          <h2 class="empty-state-title">No projects found</h2>
          <p class="empty-state-desc">
            ${currentProjectSearch ? `No projects matching "${escapeHtml(currentProjectSearch)}". Try refining your search query.` : 'Get started by creating your first project or loading sample demo initiatives.'}
          </p>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="openCreateProjectModal()">${Icons.plus} Create Project</button>
            <button class="btn btn-secondary" onclick="seedSampleData()">${Icons.sparkles} Load Demo Workspace</button>
          </div>
        </div>
      `;
      return;
    }

    let gridHtml = `<div class="projects-grid">`;
    projects.forEach((p) => {
      const counts = p.task_counts || { total: 0, todo: 0, in_progress: 0, done: 0 };
      const rate = p.completion_rate || 0;
      const isArchived = p.status === 'archived';

      gridHtml += `
        <div class="project-card">
          <div class="project-card-accent-bar" style="background-color: ${p.color};"></div>
          
          <div class="project-card-header">
            <span class="badge badge-status badge-status-${p.status}">${p.status.toUpperCase()}</span>
            <div style="position: relative;">
              <button class="btn-icon-only" onclick="toggleProjectDropdown(event, ${p.id})">
                ${Icons.moreVertical}
              </button>
              <div id="project-dropdown-${p.id}" class="dropdown-menu">
                <div class="dropdown-item" onclick="openEditProjectModal(${p.id})">${Icons.edit} Edit Project</div>
                <div class="dropdown-item" onclick="toggleArchiveProject(${p.id}, ${!isArchived})">${Icons.archive} ${isArchived ? 'Restore Active' : 'Archive Project'}</div>
                <a class="dropdown-item" href="${API.getExportCsvUrl(p.id)}" download>${Icons.download} Export Tasks CSV</a>
                <div class="dropdown-item danger" onclick="openDeleteProjectModal(${p.id}, '${escapeHtml(p.name)}', ${counts.total})">${Icons.trash} Delete Project</div>
              </div>
            </div>
          </div>

          <h3 class="project-card-title" onclick="openProjectBoard(${p.id})">${escapeHtml(p.name)}</h3>
          <p class="project-card-desc">${escapeHtml(p.description || 'No description provided.')}</p>

          <div class="project-card-metrics">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: var(--text-xs); color: var(--text-tertiary);">Progress</span>
              <span style="font-size: var(--text-xs); font-weight: 700; color: var(--text-primary);">${rate}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${rate}%; background-color: ${p.color};"></div>
            </div>

            <div class="project-card-counts">
              <span>${counts.total} task${counts.total === 1 ? '' : 's'}</span>
              <div style="display: flex; gap: 6px;">
                <span class="badge" style="background: var(--bg-surface-subtle); color: var(--text-secondary);">${counts.todo} todo</span>
                <span class="badge" style="background: #EFF6FF; color: #1D4ED8;">${counts.in_progress} doing</span>
                <span class="badge" style="background: #ECFDF5; color: #047857;">${counts.done} done</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    gridHtml += `</div>`;
    listContent.innerHTML = gridHtml;
  } catch (err) {
    const listContent = document.getElementById('projects-list-content');
    if (listContent) {
      listContent.innerHTML = `<div style="padding: 24px; color: var(--color-danger);">Failed to load projects: ${escapeHtml(err.message)}</div>`;
    }
  }
}

function openProjectBoard(projectId) {
  AppState.selectedProjectId = projectId;
  navigateTo('board');
}

function toggleProjectDropdown(event, projectId) {
  event.stopPropagation();
  const dropdown = document.getElementById(`project-dropdown-${projectId}`);
  const allDropdowns = document.querySelectorAll('.dropdown-menu');
  allDropdowns.forEach((d) => {
    if (d !== dropdown) d.classList.remove('active');
  });
  if (dropdown) dropdown.classList.toggle('active');
}

// Global click to close dropdowns
window.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach((d) => d.classList.remove('active'));
});

// ==========================================
// Project Modals (Create, Edit, Delete)
// ==========================================
let editingProjectId = null;
let projectSelectedColor = '#7257E8';

function selectColorSwatch(hex) {
  projectSelectedColor = hex;
  document.querySelectorAll('.color-swatch-btn').forEach((btn) => {
    if (btn.getAttribute('data-color') === hex) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  const input = document.getElementById('project-form-color');
  if (input) input.value = hex;
}

function openCreateProjectModal() {
  editingProjectId = null;
  document.getElementById('project-modal-title').textContent = 'Create New Project';
  document.getElementById('project-form-name').value = '';
  document.getElementById('project-form-desc').value = '';
  document.getElementById('project-form-status').value = 'active';
  document.getElementById('project-form-start').value = '';
  document.getElementById('project-form-due').value = '';
  selectColorSwatch('#7257E8');
  openModal('project-modal');
}

async function openEditProjectModal(projectId) {
  editingProjectId = projectId;
  try {
    const p = await API.getProject(projectId);
    document.getElementById('project-modal-title').textContent = 'Edit Project';
    document.getElementById('project-form-name').value = p.name;
    document.getElementById('project-form-desc').value = p.description || '';
    document.getElementById('project-form-status').value = p.status;
    document.getElementById('project-form-start').value = p.start_date || '';
    document.getElementById('project-form-due').value = p.due_date || '';
    selectColorSwatch(p.color || '#7257E8');
    openModal('project-modal');
  } catch (err) {
    showToast('Failed to load project details', err.message, 'error');
  }
}

async function saveProjectForm(e) {
  e.preventDefault();
  const name = document.getElementById('project-form-name').value.trim();
  const description = document.getElementById('project-form-desc').value.trim();
  const status = document.getElementById('project-form-status').value;
  const start_date = document.getElementById('project-form-start').value || null;
  const due_date = document.getElementById('project-form-due').value || null;
  const color = projectSelectedColor || '#7257E8';

  if (!name) {
    showToast('Validation Error', 'Project name cannot be empty', 'error');
    return;
  }

  const payload = {
    name,
    description: description || null,
    status,
    start_date,
    due_date,
    color,
  };

  try {
    if (editingProjectId) {
      await API.updateProject(editingProjectId, payload);
      showToast('Project updated', `"${name}" saved successfully`, 'success');
    } else {
      await API.createProject(payload);
      showToast('Project created', `"${name}" added to workspace`, 'success');
    }
    closeModal('project-modal');
    renderProjects();
    // Update memory
    const projects = await API.getProjects();
    AppState.projects = projects;
  } catch (err) {
    showToast('Error saving project', err.message, 'error');
  }
}

async function toggleArchiveProject(projectId, archive) {
  try {
    const p = await API.toggleArchiveProject(projectId, archive);
    showToast(
      archive ? 'Project Archived' : 'Project Restored',
      `"${p.name}" status updated to ${p.status}`,
      'info'
    );
    renderProjects();
  } catch (err) {
    showToast('Archive operation failed', err.message, 'error');
  }
}

let projectToDeleteId = null;

function openDeleteProjectModal(projectId, projectName, taskCount) {
  projectToDeleteId = projectId;
  document.getElementById('delete-project-name').textContent = projectName;
  document.getElementById('delete-project-task-count').textContent = taskCount;
  openModal('delete-project-modal');
}

async function confirmDeleteProject() {
  if (!projectToDeleteId) return;
  try {
    await API.deleteProject(projectToDeleteId);
    showToast('Project Deleted', 'Project and all associated tasks removed', 'info');
    closeModal('delete-project-modal');
    projectToDeleteId = null;
    renderProjects();
    // Refresh memory
    const projects = await API.getProjects();
    AppState.projects = projects;
  } catch (err) {
    showToast('Failed to delete project', err.message, 'error');
  }
}

window.renderProjects = renderProjects;
window.openProjectBoard = openProjectBoard;
window.toggleProjectDropdown = toggleProjectDropdown;
window.selectColorSwatch = selectColorSwatch;
window.openCreateProjectModal = openCreateProjectModal;
window.openEditProjectModal = openEditProjectModal;
window.saveProjectForm = saveProjectForm;
window.toggleArchiveProject = toggleArchiveProject;
window.openDeleteProjectModal = openDeleteProjectModal;
window.confirmDeleteProject = confirmDeleteProject;
