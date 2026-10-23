/**
 * FlowForge Main Application Core
 * Manages global state, SVG icons, toasts, command palette, and UI helpers.
 */

// Global SVG Icons Directory for guaranteed offline rendering
const Icons = {
  overview: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
  projects: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  board: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path><path d="M15 3v18"></path></svg>`,
  tasks: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
  analytics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  archive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>`,
  moreVertical: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  alertTriangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
};

// Global App State
const AppState = {
  currentView: 'overview',
  projects: [],
  selectedProjectId: null,
  overviewData: null,
};

// ==========================================
// Toast Notification Engine
// ==========================================
function showToast(title, message = '', type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: Icons.check,
    error: Icons.alertTriangle,
    info: Icons.info,
  };

  toast.innerHTML = `
    <div style="color: ${type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-danger)' : 'var(--accent-violet)'};">
      ${iconMap[type] || Icons.info}
    </div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast-msg">${escapeHtml(message)}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      ${Icons.x}
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 300ms ease, transform 300ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// Modal Helpers
// ==========================================
function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.classList.add('active');
    const firstInput = el.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  }
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

// ==========================================
// Formatters & Utility Functions
// ==========================================
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFriendlyDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;

  const target = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;

  return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ==========================================
// Command Palette Engine (Ctrl+K)
// ==========================================
let commandResults = [];
let selectedCommandIndex = 0;

function setupCommandPalette() {
  const backdrop = document.getElementById('command-palette-backdrop');
  const input = document.getElementById('command-search-input');
  const resultsContainer = document.getElementById('command-results-list');
  const triggerBtn = document.getElementById('search-trigger-btn');

  function openPalette() {
    backdrop.classList.add('active');
    input.value = '';
    input.focus();
    fetchAndRenderCommands('');
  }

  function closePalette() {
    backdrop.classList.remove('active');
  }

  if (triggerBtn) triggerBtn.addEventListener('click', openPalette);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closePalette();
  });

  // Global Keyboard listener
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (backdrop.classList.contains('active')) {
        closePalette();
      } else {
        openPalette();
      }
    } else if (e.key === 'Escape') {
      if (backdrop.classList.contains('active')) {
        closePalette();
      }
      document.querySelectorAll('.modal-backdrop.active').forEach((m) => m.classList.remove('active'));
    }
  });

  // Search input typing
  input.addEventListener('input', (e) => {
    fetchAndRenderCommands(e.target.value.trim());
  });

  // Key navigation in palette
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandResults.length > 0) {
        selectedCommandIndex = (selectedCommandIndex + 1) % commandResults.length;
        updateSelectedCommand();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandResults.length > 0) {
        selectedCommandIndex = (selectedCommandIndex - 1 + commandResults.length) % commandResults.length;
        updateSelectedCommand();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (commandResults[selectedCommandIndex]) {
        executeCommand(commandResults[selectedCommandIndex]);
        closePalette();
      }
    }
  });

  async function fetchAndRenderCommands(query) {
    resultsContainer.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-tertiary); font-size: var(--text-sm);">Searching workspace...</div>`;
    try {
      const [projects, tasks] = await Promise.all([
        API.getProjects(null, query),
        API.getTasks({ search: query, limit: 12 }),
      ]);

      commandResults = [];
      let html = '';

      // Add navigation commands if query is short
      if (!query || 'overview'.includes(query.toLowerCase())) {
        commandResults.push({ type: 'nav', title: 'Go to Overview', target: 'overview' });
      }
      if (!query || 'board'.includes(query.toLowerCase())) {
        commandResults.push({ type: 'nav', title: 'Go to Kanban Board', target: 'board' });
      }
      if (!query || 'calendar'.includes(query.toLowerCase())) {
        commandResults.push({ type: 'nav', title: 'Go to Calendar', target: 'calendar' });
      }

      // Projects
      if (projects.length > 0) {
        html += `<div class="command-group-title">Projects</div>`;
        projects.slice(0, 4).forEach((p) => {
          const idx = commandResults.length;
          commandResults.push({ type: 'project', id: p.id, title: p.name });
          html += `
            <div class="command-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}" onclick="executeCommandByIndex(${idx})">
              <div class="command-item-left">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${p.color};"></span>
                <span>${escapeHtml(p.name)}</span>
              </div>
              <span class="badge badge-status">${escapeHtml(p.status)}</span>
            </div>
          `;
        });
      }

      // Tasks
      if (tasks.length > 0) {
        html += `<div class="command-group-title">Tasks</div>`;
        tasks.slice(0, 8).forEach((t) => {
          const idx = commandResults.length;
          commandResults.push({ type: 'task', id: t.id, title: t.title, task: t });
          html += `
            <div class="command-item ${idx === 0 && projects.length === 0 ? 'selected' : ''}" data-idx="${idx}" onclick="executeCommandByIndex(${idx})">
              <div class="command-item-left">
                ${Icons.tasks}
                <span>${escapeHtml(t.title)}</span>
              </div>
              <span class="badge badge-priority-${t.priority}">${t.priority.toUpperCase()}</span>
            </div>
          `;
        });
      }

      if (commandResults.length === 0) {
        html = `<div style="padding: 24px; text-align: center; color: var(--text-tertiary); font-size: var(--text-sm);">No matching projects or tasks found for "${escapeHtml(query)}"</div>`;
      }

      resultsContainer.innerHTML = html;
      selectedCommandIndex = 0;
    } catch (err) {
      resultsContainer.innerHTML = `<div style="padding: 16px; color: var(--color-danger); font-size: var(--text-sm);">Failed to search: ${escapeHtml(err.message)}</div>`;
    }
  }

  function updateSelectedCommand() {
    const items = resultsContainer.querySelectorAll('.command-item');
    items.forEach((item, idx) => {
      if (idx === selectedCommandIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }
}

function executeCommandByIndex(index) {
  if (commandResults[index]) {
    executeCommand(commandResults[index]);
    document.getElementById('command-palette-backdrop').classList.remove('active');
  }
}

function executeCommand(cmd) {
  if (cmd.type === 'nav') {
    window.location.hash = cmd.target;
  } else if (cmd.type === 'project') {
    AppState.selectedProjectId = cmd.id;
    window.location.hash = 'board';
    if (window.renderBoard) window.renderBoard();
  } else if (cmd.type === 'task') {
    if (window.openTaskDetail) {
      window.openTaskDetail(cmd.task || cmd.id);
    }
  }
}

// Global App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  setupCommandPalette();

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('app-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      if (sidebarBackdrop) sidebarBackdrop.classList.toggle('active');
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      sidebarBackdrop.classList.remove('active');
    });
  }

  // Load Projects into memory
  try {
    const projects = await API.getProjects();
    AppState.projects = projects;
  } catch (err) {
    console.error('Failed to load initial projects:', err);
  }

  // Check router
  if (window.initRouter) {
    window.initRouter();
  }
});
