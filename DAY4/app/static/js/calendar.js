/**
 * FlowForge Calendar View
 * Monthly grid calendar with local date handling, priority badges,
 * unscheduled task drawer, day click task adder, and overflow inspector.
 */

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-indexed (0 = Jan, 9 = Oct)

async function renderCalendar() {
  const container = document.getElementById('page-view-container');
  if (!container) return;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-heading">Calendar</h1>
        <p class="page-subheading">Track task deadlines, milestones, and deliverable schedules.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" onclick="calendarGoToday()">
          Today
        </button>
        <div style="display: flex; gap: 4px;">
          <button class="btn btn-secondary btn-icon-only" onclick="calendarPrevMonth()" title="Previous Month">
            ${Icons.chevronLeft}
          </button>
          <button class="btn btn-secondary btn-icon-only" onclick="calendarNextMonth()" title="Next Month">
            ${Icons.chevronRight}
          </button>
        </div>
        <button class="btn btn-primary" onclick="openCreateTaskModal()">
          ${Icons.plus} Add Task
        </button>
      </div>
    </div>

    <div class="calendar-layout">
      <!-- Calendar Main Grid Card -->
      <div class="calendar-main">
        <div class="calendar-nav-bar">
          <h2 class="calendar-month-title" id="calendar-title-display">
            ${monthNames[calMonth]} ${calYear}
          </h2>
          <span style="font-size: var(--text-xs); color: var(--text-tertiary);">
            Click any day to schedule a task
          </span>
        </div>

        <div class="calendar-grid-header">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div class="calendar-grid-days" id="calendar-days-grid">
          <div style="padding: 40px; text-align: center; color: var(--text-tertiary);">Loading calendar...</div>
        </div>
      </div>

      <!-- Unscheduled Tasks Sidebar -->
      <div class="calendar-unscheduled-panel">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
          <span style="font-size: var(--text-sm); font-weight: 700; color: var(--text-primary);">Unscheduled</span>
          <span class="badge" id="unscheduled-count">0</span>
        </div>
        <p style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: 12px;">
          Tasks requiring a target deadline date:
        </p>
        <div id="unscheduled-tasks-list" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 6px;">
          <!-- Items injected here -->
        </div>
      </div>
    </div>
  `;

  await loadCalendarData();
}

async function loadCalendarData() {
  try {
    // Fetch all tasks for the calendar view
    const allTasks = await API.getTasks({ limit: 500 });

    // Group tasks by local date string YYYY-MM-DD
    const tasksByDate = {};
    const unscheduledTasks = [];

    allTasks.forEach((t) => {
      if (t.due_date) {
        if (!tasksByDate[t.due_date]) tasksByDate[t.due_date] = [];
        tasksByDate[t.due_date].push(t);
      } else {
        unscheduledTasks.push(t);
      }
    });

    renderCalendarGrid(tasksByDate);
    renderUnscheduledTasks(unscheduledTasks);
  } catch (err) {
    showToast('Failed to load calendar data', err.message, 'error');
  }
}

function renderCalendarGrid(tasksByDate) {
  const grid = document.getElementById('calendar-days-grid');
  if (!grid) return;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  // Total days in month
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  // Previous month total days
  const prevMonthTotalDays = new Date(calYear, calMonth, 0).getDate();

  let daysHtml = '';

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    daysHtml += `
      <div class="calendar-day-cell other-month">
        <div class="day-cell-top">
          <span class="day-num">${dayNum}</span>
        </div>
      </div>
    `;
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const dayTasks = tasksByDate[dateStr] || [];

    const visibleTasks = dayTasks.slice(0, 3);
    const overflowCount = dayTasks.length - 3;

    daysHtml += `
      <div class="calendar-day-cell ${isToday ? 'is-today' : ''}" onclick="handleDayClick(event, '${dateStr}')">
        <div class="day-cell-top">
          <span class="day-num">${day}</span>
          ${dayTasks.length > 0 ? `<span style="font-size: 0.65rem; color: var(--text-tertiary); font-weight: 600;">${dayTasks.length}</span>` : ''}
        </div>
        <div class="day-tasks-list">
          ${visibleTasks.map((t) => `
            <div 
              class="cal-task-pill ${t.priority} ${t.status === 'done' ? 'done' : ''}" 
              onclick="handleCalendarTaskClick(event, ${t.id})"
              title="${escapeHtml(t.title)}"
            >
              <span>${escapeHtml(t.title)}</span>
            </div>
          `).join('')}
          ${overflowCount > 0 ? `
            <div class="cal-overflow-badge" onclick="showDayOverflowModal(event, '${dateStr}', ${day})">
              +${overflowCount} more
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Next month leading days to complete the 7-column row
  const totalCells = firstDayOfMonth + totalDays;
  const nextMonthLeading = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= nextMonthLeading; d++) {
    daysHtml += `
      <div class="calendar-day-cell other-month">
        <div class="day-cell-top">
          <span class="day-num">${d}</span>
        </div>
      </div>
    `;
  }

  grid.innerHTML = daysHtml;
}

function renderUnscheduledTasks(tasks) {
  const container = document.getElementById('unscheduled-tasks-list');
  const countBadge = document.getElementById('unscheduled-count');
  if (!container) return;

  if (countBadge) countBadge.textContent = tasks.length;

  if (tasks.length === 0) {
    container.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-tertiary); font-size: var(--text-xs);">All tasks have scheduled deadlines!</div>`;
    return;
  }

  container.innerHTML = tasks.map((t) => `
    <div class="due-task-item" style="padding: 8px 10px; cursor: pointer;" onclick="openTaskDetailById(${t.id})">
      <div style="display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0;">
        <span style="font-size: var(--text-xs); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHtml(t.title)}
        </span>
        <span style="font-size: 0.688rem; color: var(--text-tertiary);">
          ${escapeHtml(t.project_name || 'Project')}
        </span>
      </div>
      <span class="badge badge-priority-${t.priority}" style="font-size: 0.65rem;">
        ${t.priority.toUpperCase()}
      </span>
    </div>
  `).join('');
}

function calendarPrevMonth() {
  calMonth--;
  if (calMonth < 0) {
    calMonth = 11;
    calYear--;
  }
  renderCalendar();
}

function calendarNextMonth() {
  calMonth++;
  if (calMonth > 11) {
    calMonth = 0;
    calYear++;
  }
  renderCalendar();
}

function calendarGoToday() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();
}

function handleDayClick(event, dateStr) {
  // If clicked inside a task pill, let the task click handler take precedence
  if (event.target.closest('.cal-task-pill') || event.target.closest('.cal-overflow-badge')) {
    return;
  }
  openCreateTaskModal('todo', null);
  const dueInput = document.getElementById('task-form-due');
  if (dueInput) dueInput.value = dateStr;
}

function handleCalendarTaskClick(event, taskId) {
  event.stopPropagation();
  openTaskDetailById(taskId);
}

async function showDayOverflowModal(event, dateStr, dayNum) {
  event.stopPropagation();
  try {
    const tasks = await API.getTasks({ limit: 100 });
    const dayTasks = tasks.filter((t) => t.due_date === dateStr);

    let content = `
      <div style="display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto;">
        ${dayTasks.map((t) => `
          <div class="due-task-item" style="padding: 10px; cursor: pointer;" onclick="closeModal('day-overflow-modal'); openTaskDetailById(${t.id});">
            <div style="flex: 1;">
              <div style="font-size: var(--text-sm); font-weight: 600; color: var(--text-primary);">${escapeHtml(t.title)}</div>
              <div style="font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 2px;">${escapeHtml(t.project_name || '')}</div>
            </div>
            <span class="badge badge-priority-${t.priority}">${t.priority.toUpperCase()}</span>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('day-overflow-title').textContent = `Tasks for ${formatDate(dateStr)}`;
    document.getElementById('day-overflow-body').innerHTML = content;
    openModal('day-overflow-modal');
  } catch (err) {
    showToast('Failed to load day tasks', err.message, 'error');
  }
}

window.renderCalendar = renderCalendar;
window.calendarPrevMonth = calendarPrevMonth;
window.calendarNextMonth = calendarNextMonth;
window.calendarGoToday = calendarGoToday;
window.handleDayClick = handleDayClick;
window.handleCalendarTaskClick = handleCalendarTaskClick;
window.showDayOverflowModal = showDayOverflowModal;
