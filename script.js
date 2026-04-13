const STORAGE_KEY = "reminders-app-items";

const reminderForm = document.getElementById("reminder-form");
const titleInput = document.getElementById("title-input");
const dateInput = document.getElementById("date-input");
const priorityInput = document.getElementById("priority-input");
const notesInput = document.getElementById("notes-input");
const statusText = document.getElementById("status-text");
const reminderList = document.getElementById("reminder-list");
const searchInput = document.getElementById("search-input");
const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
const openCount = document.getElementById("open-count");
const todayCount = document.getElementById("today-count");
const doneCount = document.getElementById("done-count");
const emptyStateTemplate = document.getElementById("empty-state-template");

let reminders = loadReminders();
let activeFilter = "all";
let activeSearch = "";

function loadReminders() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveReminders() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isToday(dateString) {
  if (!dateString) {
    return false;
  }

  return normalizeDate(dateString) === getTodayString();
}

function isOverdue(dateString) {
  if (!dateString) {
    return false;
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return new Date(`${normalizeDate(dateString)}T00:00:00`) < todayStart;
}

function formatDate(dateString) {
  if (!dateString) {
    return "No due date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${normalizeDate(dateString)}T00:00:00`));
}

function sortReminders(items) {
  // Keep active and time-sensitive work near the top without hiding completed items.
  return [...items].sort((left, right) => {
    if (left.completed !== right.completed) {
      return Number(left.completed) - Number(right.completed);
    }

    if (!left.dueDate && right.dueDate) {
      return 1;
    }

    if (left.dueDate && !right.dueDate) {
      return -1;
    }

    if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }

    const priorityRank = { high: 0, medium: 1, low: 2 };
    return priorityRank[left.priority] - priorityRank[right.priority];
  });
}

function filterReminders(items) {
  return sortReminders(items).filter((reminder) => {
    const searchHaystack = `${reminder.title} ${reminder.notes}`.toLowerCase();
    const matchesSearch = searchHaystack.includes(activeSearch.toLowerCase());

    if (!matchesSearch) {
      return false;
    }

    if (activeFilter === "today") {
      return !reminder.completed && isToday(reminder.dueDate);
    }

    if (activeFilter === "upcoming") {
      return (
        !reminder.completed &&
        Boolean(reminder.dueDate) &&
        !isToday(reminder.dueDate) &&
        !isOverdue(reminder.dueDate)
      );
    }

    if (activeFilter === "done") {
      return reminder.completed;
    }

    return true;
  });
}

function updateSummary() {
  const openItems = reminders.filter((reminder) => !reminder.completed);
  openCount.textContent = String(openItems.length);
  todayCount.textContent = String(
    openItems.filter((reminder) => isToday(reminder.dueDate)).length
  );
  doneCount.textContent = String(
    reminders.filter((reminder) => reminder.completed).length
  );
}

function renderEmptyState() {
  reminderList.innerHTML = "";
  reminderList.append(emptyStateTemplate.content.cloneNode(true));
}

function renderReminders() {
  const visibleReminders = filterReminders(reminders);
  updateSummary();

  if (!visibleReminders.length) {
    renderEmptyState();
    return;
  }

  reminderList.innerHTML = "";

  visibleReminders.forEach((reminder) => {
    const item = document.createElement("li");
    item.className = "reminder-card";
    item.dataset.completed = String(reminder.completed);

    const dueDateClasses = [
      "date-badge",
      isToday(reminder.dueDate) ? "is-today" : "",
      !reminder.completed && isOverdue(reminder.dueDate) ? "is-overdue" : "",
    ]
      .filter(Boolean)
      .join(" ");

    item.innerHTML = `
      <div class="reminder-top">
        <div>
          <h3 class="reminder-title">${escapeHtml(reminder.title)}</h3>
          <div class="reminder-meta">
            <span class="priority-badge" data-priority="${escapeHtml(reminder.priority)}">
              ${escapeHtml(capitalize(reminder.priority))}
            </span>
            <span class="${dueDateClasses}">
              ${escapeHtml(getDueLabel(reminder))}
            </span>
          </div>
        </div>
        <div class="reminder-actions">
          <button class="action-button complete" type="button" data-action="toggle" data-id="${escapeHtml(reminder.id)}">
            ${reminder.completed ? "Mark open" : "Complete"}
          </button>
          <button class="action-button delete" type="button" data-action="delete" data-id="${escapeHtml(reminder.id)}">
            Delete
          </button>
        </div>
      </div>
      ${
        reminder.notes
          ? `<p class="reminder-notes">${escapeHtml(reminder.notes)}</p>`
          : ""
      }
    `;

    reminderList.append(item);
  });
}

function getDueLabel(reminder) {
  if (!reminder.dueDate) {
    return "No due date";
  }

  if (!reminder.completed && isToday(reminder.dueDate)) {
    return `Today • ${formatDate(reminder.dueDate)}`;
  }

  if (!reminder.completed && isOverdue(reminder.dueDate)) {
    return `Overdue • ${formatDate(reminder.dueDate)}`;
  }

  return formatDate(reminder.dueDate);
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resetForm() {
  reminderForm.reset();
  priorityInput.value = "medium";
  titleInput.focus();
}

function setStatus(message) {
  statusText.textContent = message;
}

function addReminder(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const notes = notesInput.value.trim();

  if (!title) {
    setStatus("Add a reminder title first.");
    return;
  }

  reminders.push({
    id: createId(),
    title,
    dueDate: dateInput.value ? normalizeDate(dateInput.value) : "",
    priority: priorityInput.value,
    notes,
    completed: false,
    createdAt: new Date().toISOString(),
  });

  saveReminders();
  renderReminders();
  setStatus(`Added "${title}".`);
  resetForm();
}

function toggleReminder(id) {
  let updatedReminder = null;
  reminders = reminders.map((reminder) =>
    reminder.id === id
      ? ((updatedReminder = {
          ...reminder,
          completed: !reminder.completed,
        }),
        updatedReminder)
      : reminder
  );
  saveReminders();
  renderReminders();
  if (updatedReminder) {
    setStatus(
      updatedReminder.completed
        ? `Completed "${updatedReminder.title}".`
        : `Reopened "${updatedReminder.title}".`
    );
  }
}

function deleteReminder(id) {
  const target = reminders.find((reminder) => reminder.id === id);
  reminders = reminders.filter((reminder) => reminder.id !== id);
  saveReminders();
  renderReminders();
  setStatus(target ? `Deleted "${target.title}".` : "Reminder removed.");
}

reminderForm.addEventListener("submit", addReminder);

searchInput.addEventListener("input", (event) => {
  activeSearch = event.target.value.trim();
  renderReminders();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderReminders();
  });
});

reminderList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "toggle") {
    toggleReminder(id);
  }

  if (action === "delete") {
    deleteReminder(id);
  }
});

renderReminders();
setStatus(
  reminders.length
    ? `${reminders.filter((reminder) => !reminder.completed).length} open reminder${
        reminders.filter((reminder) => !reminder.completed).length === 1 ? "" : "s"
      }.`
    : "Nothing waiting yet."
);
