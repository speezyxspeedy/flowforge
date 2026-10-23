/**
 * FlowForge Navigation Router
 * Manages hash-based SPA view transitions and top-bar breadcrumbs.
 */

const VIEWS = {
  overview: { title: 'Overview', breadcrumb: 'Overview' },
  projects: { title: 'Projects', breadcrumb: 'Projects' },
  board: { title: 'Kanban Board', breadcrumb: 'Board' },
  mytasks: { title: 'My Tasks', breadcrumb: 'My Tasks' },
  calendar: { title: 'Calendar', breadcrumb: 'Calendar' },
  activity: { title: 'Activity Timeline', breadcrumb: 'Activity' },
  analytics: { title: 'Analytics & Progress', breadcrumb: 'Analytics' },
  settings: { title: 'Workspace Settings', breadcrumb: 'Settings' },
};

function navigateTo(viewName) {
  if (!VIEWS[viewName]) {
    viewName = 'overview';
  }

  AppState.currentView = viewName;
  window.location.hash = viewName;

  // Update sidebar active classes
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((item) => {
    const target = item.getAttribute('data-view');
    if (target === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update top bar breadcrumbs
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = VIEWS[viewName].breadcrumb;
  }

  // Close mobile sidebar if open
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar && sidebar.classList.contains('mobile-open')) {
    sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }

  // Render the selected view
  switch (viewName) {
    case 'overview':
      if (window.renderOverview) window.renderOverview();
      break;
    case 'projects':
      if (window.renderProjects) window.renderProjects();
      break;
    case 'board':
      if (window.renderBoard) window.renderBoard();
      break;
    case 'mytasks':
      if (window.renderMyTasks) window.renderMyTasks();
      break;
    case 'calendar':
      if (window.renderCalendar) window.renderCalendar();
      break;
    case 'activity':
      if (window.renderActivity) window.renderActivity();
      break;
    case 'analytics':
      if (window.renderAnalytics) window.renderAnalytics();
      break;
    case 'settings':
      if (window.renderSettings) window.renderSettings();
      break;
    default:
      if (window.renderOverview) window.renderOverview();
  }
}

function initRouter() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'overview';
    navigateTo(hash);
  });

  // Initial load
  const initialHash = window.location.hash.replace('#', '') || 'overview';
  navigateTo(initialHash);
}

window.navigateTo = navigateTo;
window.initRouter = initRouter;
