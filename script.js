const STORAGE_KEY = "orbit-things-inspired-state-v1";

const elements = {
  navButtons: Array.from(document.querySelectorAll(".nav-item")),
  areaContainer: document.getElementById("areas-list"),
  projectContainer: document.getElementById("projects-list"),
  tagsContainer: document.getElementById("tags-list"),
  viewEyebrow: document.getElementById("view-eyebrow"),
  viewTitle: document.getElementById("view-title"),
  listContent: document.getElementById("list-content"),
  statusText: document.getElementById("status-text"),
  quickAddForm: document.getElementById("quick-add-form"),
  quickAddInput: document.getElementById("quick-add-input"),
  listSearchInput: document.getElementById("list-search-input"),
  filterButtons: Array.from(document.querySelectorAll(".filter-chip")),
  countInbox: document.getElementById("count-inbox"),
  countToday: document.getElementById("count-today"),
  countUpcoming: document.getElementById("count-upcoming"),
  countAnytime: document.getElementById("count-anytime"),
  countSomeday: document.getElementById("count-someday"),
  countLogbook: document.getElementById("count-logbook"),
  emptyDetail: document.getElementById("empty-detail"),
  detailForm: document.getElementById("detail-form"),
  detailKind: document.getElementById("detail-kind"),
  detailTitle: document.getElementById("detail-title"),
  detailNotes: document.getElementById("detail-notes"),
  detailList: document.getElementById("detail-list"),
  detailArea: document.getElementById("detail-area"),
  detailProject: document.getElementById("detail-project"),
  detailHeading: document.getElementById("detail-heading"),
  detailWhen: document.getElementById("detail-when"),
  detailDeadline: document.getElementById("detail-deadline"),
  detailReminder: document.getElementById("detail-reminder"),
  detailRepeat: document.getElementById("detail-repeat"),
  detailTags: document.getElementById("detail-tags"),
  detailEvening: document.getElementById("detail-evening"),
  detailComplete: document.getElementById("detail-complete"),
  checklistEditor: document.getElementById("checklist-editor"),
  addChecklistItemButton: document.getElementById("add-checklist-item-button"),
  deleteItemButton: document.getElementById("delete-item-button"),
  quickFindButton: document.getElementById("quick-find-button"),
  quickFindDialog: document.getElementById("quick-find-dialog"),
  quickFindInput: document.getElementById("quick-find-input"),
  quickFindResults: document.getElementById("quick-find-results"),
  newAreaButton: document.getElementById("new-area-button"),
  newProjectButton: document.getElementById("new-project-button"),
  seedButton: document.getElementById("seed-button"),
  calendarPanel: document.getElementById("calendar-panel"),
  calendarEvents: document.getElementById("calendar-events"),
  emptyStateTemplate: document.getElementById("empty-state-template"),
};

let state = loadState();
let selectedEntity = null;

function createSeedState() {
  return {
    view: { type: "today", id: null },
    listFilter: "all",
    listSearch: "",
    areas: [],
    projects: [],
    tasks: [],
    calendarEvents: [],
  };
}

function loadState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return createSeedState();
    }

    const parsed = JSON.parse(saved);
    return {
      ...createSeedState(),
      ...parsed,
      areas: parsed.areas || [],
      projects: parsed.projects || [],
      tasks: parsed.tasks || [],
      calendarEvents: parsed.calendarEvents || [],
    };
  } catch (error) {
    return createSeedState();
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString, amount) {
  const base = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  base.setDate(base.getDate() + amount);
  return formatDateValue(base);
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) {
    return "No date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) {
    return "No reminder";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateTimeString));
}

function isCompleted(task) {
  return Boolean(task.completedAt);
}

function isToday(dateString) {
  return Boolean(dateString) && dateString === getTodayString();
}

function isUpcoming(dateString) {
  return Boolean(dateString) && dateString > getTodayString();
}

function isPast(dateString) {
  return Boolean(dateString) && dateString < getTodayString();
}

function getAreaById(id) {
  return state.areas.find((area) => area.id === id) || null;
}

function getProjectById(id) {
  return state.projects.find((project) => project.id === id) || null;
}

function getTaskById(id) {
  return state.tasks.find((task) => task.id === id) || null;
}

function getHeadingOptions(projectId) {
  return getProjectById(projectId)?.headings || [];
}

function setStatus(message) {
  elements.statusText.textContent = message;
}

function selectEntity(kind, id) {
  selectedEntity = kind && id ? { kind, id } : null;
  render();
}

function getSelectedEntity() {
  if (!selectedEntity) {
    return null;
  }

  if (selectedEntity.kind === "task") {
    return getTaskById(selectedEntity.id);
  }

  if (selectedEntity.kind === "project") {
    return getProjectById(selectedEntity.id);
  }

  if (selectedEntity.kind === "area") {
    return getAreaById(selectedEntity.id);
  }

  return null;
}

function getAllTags() {
  const tags = new Set();
  state.tasks.forEach((task) => task.tags.forEach((tag) => tags.add(tag)));
  state.projects.forEach((project) => project.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}

function countTasksForView(viewType) {
  return getVisibleTasksForView({ type: viewType, id: null }).length;
}

function deriveCounts() {
  elements.countInbox.textContent = String(countTasksForView("inbox"));
  elements.countToday.textContent = String(countTasksForView("today"));
  elements.countUpcoming.textContent = String(countTasksForView("upcoming"));
  elements.countAnytime.textContent = String(countTasksForView("anytime"));
  elements.countSomeday.textContent = String(countTasksForView("someday"));
  elements.countLogbook.textContent = String(countTasksForView("logbook"));
}

function parseQuickEntry(input) {
  const data = {
    title: input,
    tags: [],
    list: "inbox",
    when: "",
    reminderAt: "",
    deadline: "",
    repeat: "none",
    evening: false,
    priority: "",
  };

  const tags = input.match(/#[\w-]+/g) || [];
  data.tags = tags.map((tag) => tag.slice(1));
  data.title = data.title.replace(/#[\w-]+/g, "").trim();

  const listMatch = data.title.match(/@(?:today|inbox|anytime|someday|upcoming)\b/i);
  if (listMatch) {
    data.list = listMatch[0].slice(1).toLowerCase();
    data.title = data.title.replace(listMatch[0], "").trim();
  }

  if (/\btomorrow\b/i.test(data.title)) {
    data.when = addDays(getTodayString(), 1);
    data.list = data.list === "inbox" ? "upcoming" : data.list;
    data.title = data.title.replace(/\btomorrow\b/i, "").trim();
  } else if (/\btoday\b/i.test(data.title)) {
    data.when = getTodayString();
    data.list = "today";
    data.title = data.title.replace(/\btoday\b/i, "").trim();
  } else if (/\bnext week\b/i.test(data.title)) {
    data.when = addDays(getTodayString(), 7);
    data.list = "upcoming";
    data.title = data.title.replace(/\bnext week\b/i, "").trim();
  }

  const timeMatch = data.title.match(/\b(\d{1,2})(?::(\d{2}))?\s?(am|pm)\b/i);
  if (timeMatch && data.when) {
    const hourBase = Number(timeMatch[1]) % 12;
    const hour = timeMatch[3].toLowerCase() === "pm" ? hourBase + 12 : hourBase;
    const minute = timeMatch[2] || "00";
    data.reminderAt = `${data.when}T${String(hour).padStart(2, "0")}:${minute}`;
    data.title = data.title.replace(timeMatch[0], "").trim();
  }

  if (/\bevening\b/i.test(data.title)) {
    data.evening = true;
    data.title = data.title.replace(/\bevening\b/i, "").trim();
  }

  const repeatMatch = data.title.match(/\bevery (day|week|month|year)\b/i);
  if (repeatMatch) {
    const map = { day: "daily", week: "weekly", month: "monthly", year: "yearly" };
    data.repeat = map[repeatMatch[1].toLowerCase()];
    data.title = data.title.replace(repeatMatch[0], "").trim();
  }

  data.title = data.title.replace(/\s+/g, " ").trim();
  return data;
}

function addTaskFromQuickEntry(input) {
  const parsed = parseQuickEntry(input.trim());
  if (!parsed.title) {
    setStatus("Give the to-do a title first.");
    return;
  }

  const newTask = {
    id: makeId("task"),
    title: parsed.title,
    notes: "",
    list: parsed.list,
    areaId: "",
    projectId: "",
    headingId: "",
    when: parsed.when,
    deadline: parsed.deadline,
    reminderAt: parsed.reminderAt,
    repeat: parsed.repeat,
    tags: parsed.tags,
    evening: parsed.evening,
    completedAt: "",
    checklist: [],
  };

  state.tasks.unshift(newTask);
  maybeRequestReminderPermission(newTask);
  saveAndRender(`Added "${newTask.title}".`);
  selectEntity("task", newTask.id);
}

function maybeRequestReminderPermission(task) {
  if (!task.reminderAt || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

function saveAndRender(message) {
  saveState();
  render();
  if (message) {
    setStatus(message);
  }
}

function getVisibleTasksForView(view = state.view) {
  if (view.type === "area") {
    return state.tasks.filter((task) => task.areaId === view.id && !isCompleted(task));
  }

  if (view.type === "project") {
    return state.tasks.filter((task) => task.projectId === view.id && !isCompleted(task));
  }

  if (view.type === "inbox") {
    return state.tasks.filter((task) => task.list === "inbox" && !isCompleted(task));
  }

  if (view.type === "today") {
    return state.tasks.filter(
      (task) =>
        !isCompleted(task) &&
        (task.list === "today" || isToday(task.when) || isPast(task.deadline))
    );
  }

  if (view.type === "upcoming") {
    return state.tasks.filter(
      (task) => !isCompleted(task) && (task.list === "upcoming" || isUpcoming(task.when))
    );
  }

  if (view.type === "anytime") {
    return state.tasks.filter((task) => task.list === "anytime" && !isCompleted(task));
  }

  if (view.type === "someday") {
    return state.tasks.filter((task) => task.list === "someday" && !isCompleted(task));
  }

  if (view.type === "logbook") {
    return state.tasks.filter((task) => isCompleted(task));
  }

  return [];
}

function applyListFilter(tasks) {
  return tasks
    .filter((task) => {
      if (state.listFilter === "open") {
        return !isCompleted(task);
      }
      if (state.listFilter === "scheduled") {
        return Boolean(task.when || task.deadline || task.reminderAt);
      }
      if (state.listFilter === "flagged") {
        return task.evening;
      }
      return true;
    })
    .filter((task) => {
      if (!state.listSearch.trim()) {
        return true;
      }
      const haystack = `${task.title} ${task.notes} ${task.tags.join(" ")}`.toLowerCase();
      return haystack.includes(state.listSearch.toLowerCase());
    });
}

function sortTasks(tasks) {
  return [...tasks].sort((left, right) => {
    if (isCompleted(left) !== isCompleted(right)) {
      return Number(isCompleted(left)) - Number(isCompleted(right));
    }

    const leftDate = left.when || left.deadline || "9999-12-31";
    const rightDate = right.when || right.deadline || "9999-12-31";
    if (leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }

    return left.title.localeCompare(right.title);
  });
}

function groupTasks(tasks) {
  if (state.view.type === "today") {
    const daytime = tasks.filter((task) => !task.evening);
    const evening = tasks.filter((task) => task.evening);
    return [
      { key: "today", title: "Today", tasks: daytime },
      { key: "evening", title: "This Evening", tasks: evening },
    ].filter((group) => group.tasks.length);
  }

  if (state.view.type === "project") {
    const project = getProjectById(state.view.id);
    const headings = project?.headings || [];
    const groups = headings.map((heading) => ({
      key: heading.id,
      title: heading.title,
      tasks: tasks.filter((task) => task.headingId === heading.id),
    }));
    const ungrouped = tasks.filter((task) => !task.headingId);
    if (ungrouped.length) {
      groups.unshift({ key: "ungrouped", title: "To-Dos", tasks: ungrouped });
    }
    return groups.filter((group) => group.tasks.length);
  }

  if (state.view.type === "upcoming") {
    const grouped = new Map();
    tasks.forEach((task) => {
      const key = task.when || "No date";
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(task);
    });
    return Array.from(grouped.entries()).map(([key, value]) => ({
      key,
      title: key === "No date" ? "No date" : formatDate(key),
      tasks: value,
    }));
  }

  return [{ key: "all", title: "", tasks }];
}

function renderSidebarCollections() {
  elements.areaContainer.innerHTML = "";
  elements.projectContainer.innerHTML = "";

  state.areas.forEach((area) => {
    const count = state.tasks.filter(
      (task) => task.areaId === area.id && !isCompleted(task)
    ).length;
    const button = document.createElement("button");
    button.className = `stack-button${
      state.view.type === "area" && state.view.id === area.id ? " active" : ""
    }`;
    button.type = "button";
    button.dataset.kind = "area";
    button.dataset.id = area.id;
    button.innerHTML = `<span>${escapeHtml(area.title)}</span><strong>${count}</strong>`;
    elements.areaContainer.append(button);
  });

  state.projects.forEach((project) => {
    const count = state.tasks.filter(
      (task) => task.projectId === project.id && !isCompleted(task)
    ).length;
    const button = document.createElement("button");
    button.className = `stack-button${
      state.view.type === "project" && state.view.id === project.id ? " active" : ""
    }`;
    button.type = "button";
    button.dataset.kind = "project";
    button.dataset.id = project.id;
    button.innerHTML = `<span>${escapeHtml(project.title)}</span><strong>${count}</strong>`;
    elements.projectContainer.append(button);
  });

  elements.tagsContainer.innerHTML = "";
  getAllTags().forEach((tag) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "tag-pill";
    pill.textContent = `#${tag}`;
    pill.addEventListener("click", () => {
      state.listSearch = tag;
      elements.listSearchInput.value = tag;
      render();
    });
    elements.tagsContainer.append(pill);
  });
}

function renderCalendarPanel(tasks) {
  const shouldShow = state.view.type === "today" || state.view.type === "upcoming";
  elements.calendarPanel.hidden = !shouldShow;
  if (!shouldShow) {
    return;
  }

  const dates = [...new Set(tasks.map((task) => task.when).filter(Boolean))];
  const allDates = [...new Set([...dates, ...state.calendarEvents.map((event) => event.date)])]
    .sort()
    .slice(0, 5);

  elements.calendarEvents.innerHTML = "";
  allDates.forEach((date) => {
    const day = document.createElement("section");
    day.className = "calendar-day";
    const events = state.calendarEvents.filter((event) => event.date === date);
    day.innerHTML = `<h4>${escapeHtml(formatDate(date))}</h4>`;

    events.forEach((event) => {
      const row = document.createElement("div");
      row.className = "calendar-event";
      row.innerHTML = `<span>${escapeHtml(event.title)}</span><strong>${escapeHtml(
        event.time
      )}</strong>`;
      day.append(row);
    });

    elements.calendarEvents.append(day);
  });
}

function renderTaskList() {
  const tasks = sortTasks(applyListFilter(getVisibleTasksForView()));
  const groups = groupTasks(tasks);
  elements.listContent.innerHTML = "";

  renderCalendarPanel(tasks);

  if (!tasks.length) {
    elements.listContent.append(elements.emptyStateTemplate.content.cloneNode(true));
    return;
  }

  groups.forEach((group) => {
    const wrapper = document.createElement("section");
    wrapper.className = "group-block";

    if (group.title) {
      const heading = document.createElement("h3");
      heading.className = "group-title";
      heading.textContent = group.title;
      wrapper.append(heading);
    }

    const list = document.createElement("div");
    list.className = "task-list";
    group.tasks.forEach((task) => list.append(renderTaskCard(task)));
    wrapper.append(list);
    elements.listContent.append(wrapper);
  });
}

function renderTaskCard(task) {
  const card = document.createElement("article");
  const isSelected = selectedEntity?.kind === "task" && selectedEntity.id === task.id;
  card.className = `task-card${isSelected ? " selected" : ""}${
    isCompleted(task) ? " completed" : ""
  }`;
  card.tabIndex = 0;
  card.dataset.id = task.id;

  const project = getProjectById(task.projectId);
  const area = getAreaById(task.areaId);
  const secondaryBits = [
    project?.title || "",
    area?.title || "",
    task.evening ? "This Evening" : "",
    task.repeat !== "none" ? `Repeats ${task.repeat}` : "",
  ].filter(Boolean);
  const timingLabel =
    (state.view.type === "today" && isPast(task.deadline) && task.deadline
      ? `Overdue ${formatDate(task.deadline)}`
      : task.when
        ? formatDate(task.when)
        : task.deadline
          ? `Deadline ${formatDate(task.deadline)}`
          : task.reminderAt
            ? formatDateTime(task.reminderAt)
            : "") || "";

  card.innerHTML = `
    <div class="task-header">
      <div class="task-main">
        <div class="task-title-row">
          <input class="complete-toggle" data-action="toggle-complete" data-id="${escapeHtml(
            task.id
          )}" type="checkbox" ${isCompleted(task) ? "checked" : ""} />
          <div>
            <h4 class="task-title">${escapeHtml(task.title)}</h4>
            ${
              secondaryBits.length
                ? `<div class="meta-row">${secondaryBits
                    .map((bit) => `<span class="meta-chip">${escapeHtml(bit)}</span>`)
                    .join("")}</div>`
                : ""
            }
          </div>
        </div>
      </div>
      <div class="task-side">
        ${timingLabel ? `<span class="task-when">${escapeHtml(timingLabel)}</span>` : ""}
      </div>
    </div>
    ${
      isSelected && task.notes
        ? `<p class="task-notes">${escapeHtml(task.notes.slice(0, 220))}</p>`
        : ""
    }
    ${
      isSelected && task.tags.length
        ? `<div class="tag-row">${task.tags
            .map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`)
            .join("")}</div>`
        : ""
    }
    ${
      isSelected && task.checklist.length
        ? `<div class="checklist-preview"><span class="check-chip">${
            task.checklist.filter((item) => item.completed).length
          }/${task.checklist.length} checklist items</span></div>`
        : ""
    }
  `;

  return card;
}

function renderDetail() {
  const entity = getSelectedEntity();
  if (!entity || !selectedEntity) {
    elements.emptyDetail.hidden = false;
    elements.detailForm.hidden = true;
    return;
  }

  elements.emptyDetail.hidden = true;
  elements.detailForm.hidden = false;
  elements.detailKind.textContent = selectedEntity.kind.charAt(0).toUpperCase() + selectedEntity.kind.slice(1);

  populateAreaSelect();
  populateProjectSelect();

  if (selectedEntity.kind === "task") {
    populateHeadingSelect(entity.projectId);
    elements.detailTitle.value = entity.title;
    elements.detailNotes.value = entity.notes;
    elements.detailList.value = entity.list;
    elements.detailArea.value = entity.areaId || "";
    elements.detailProject.value = entity.projectId || "";
    elements.detailHeading.value = entity.headingId || "";
    elements.detailWhen.value = entity.when || "";
    elements.detailDeadline.value = entity.deadline || "";
    elements.detailReminder.value = entity.reminderAt || "";
    elements.detailRepeat.value = entity.repeat || "none";
    elements.detailTags.value = entity.tags.join(", ");
    elements.detailEvening.checked = entity.evening;
    elements.detailComplete.checked = isCompleted(entity);
    renderChecklistEditor(entity);
    setTaskSpecificFieldsDisabled(false);
    return;
  }

  if (selectedEntity.kind === "project") {
    elements.detailTitle.value = entity.title;
    elements.detailNotes.value = entity.notes;
    elements.detailList.value = "anytime";
    elements.detailArea.value = entity.areaId || "";
    elements.detailProject.value = "";
    populateHeadingSelect(entity.id);
    elements.detailHeading.value = "";
    elements.detailWhen.value = entity.when || "";
    elements.detailDeadline.value = entity.deadline || "";
    elements.detailReminder.value = "";
    elements.detailRepeat.value = "none";
    elements.detailTags.value = entity.tags.join(", ");
    elements.detailEvening.checked = false;
    elements.detailComplete.checked = entity.status === "completed";
    renderProjectHeadingEditor(entity);
    setTaskSpecificFieldsDisabled(true);
    return;
  }

  elements.detailTitle.value = entity.title;
  elements.detailNotes.value = entity.notes || "";
  elements.detailList.value = "anytime";
  elements.detailArea.value = entity.id;
  elements.detailProject.value = "";
  populateHeadingSelect("");
  elements.detailHeading.value = "";
  elements.detailWhen.value = "";
  elements.detailDeadline.value = "";
  elements.detailReminder.value = "";
  elements.detailRepeat.value = "none";
  elements.detailTags.value = "";
  elements.detailEvening.checked = false;
  elements.detailComplete.checked = false;
  renderAreaSummary(entity);
  setTaskSpecificFieldsDisabled(true);
}

function setTaskSpecificFieldsDisabled(disabled) {
  [
    elements.detailList,
    elements.detailProject,
    elements.detailHeading,
    elements.detailReminder,
    elements.detailRepeat,
    elements.detailEvening,
  ].forEach((field) => {
    field.disabled = disabled;
  });
}

function populateAreaSelect() {
  elements.detailArea.innerHTML = `<option value="">None</option>${state.areas
    .map((area) => `<option value="${escapeHtml(area.id)}">${escapeHtml(area.title)}</option>`)
    .join("")}`;
}

function populateProjectSelect() {
  elements.detailProject.innerHTML = `<option value="">None</option>${state.projects
    .map(
      (project) =>
        `<option value="${escapeHtml(project.id)}">${escapeHtml(project.title)}</option>`
    )
    .join("")}`;
}

function populateHeadingSelect(projectId) {
  const headings = getHeadingOptions(projectId);
  elements.detailHeading.innerHTML = `<option value="">None</option>${headings
    .map(
      (heading) =>
        `<option value="${escapeHtml(heading.id)}">${escapeHtml(heading.title)}</option>`
    )
    .join("")}`;
}

function renderChecklistEditor(task) {
  elements.checklistEditor.innerHTML = "";
  if (!task.checklist.length) {
    const empty = document.createElement("p");
    empty.className = "item-meta";
    empty.textContent = "No checklist items yet.";
    elements.checklistEditor.append(empty);
    return;
  }

  task.checklist.forEach((item) => {
    const line = document.createElement("label");
    line.className = "checklist-line";
    line.innerHTML = `
      <input data-check-id="${escapeHtml(item.id)}" type="checkbox" ${
        item.completed ? "checked" : ""
      } />
      <input
        class="checklist-input"
        data-check-title="${escapeHtml(item.id)}"
        type="text"
        value="${escapeHtml(item.title)}"
      />
      <button class="mini-button" data-check-delete="${escapeHtml(item.id)}" type="button">
        Remove
      </button>
    `;
    elements.checklistEditor.append(line);
  });
}

function renderProjectHeadingEditor(project) {
  elements.checklistEditor.innerHTML = "";
  project.headings.forEach((heading) => {
    const line = document.createElement("div");
    line.className = "checklist-line";
    line.innerHTML = `
      <span></span>
      <input
        class="checklist-input"
        data-heading-title="${escapeHtml(heading.id)}"
        type="text"
        value="${escapeHtml(heading.title)}"
      />
      <button class="mini-button" data-heading-delete="${escapeHtml(heading.id)}" type="button">
        Remove
      </button>
    `;
    elements.checklistEditor.append(line);
  });

  if (!project.headings.length) {
    const empty = document.createElement("p");
    empty.className = "item-meta";
    empty.textContent = "No headings yet. Use Add item to create one.";
    elements.checklistEditor.append(empty);
  }
}

function renderAreaSummary(area) {
  const openTasks = state.tasks.filter((task) => task.areaId === area.id && !isCompleted(task));
  const projects = state.projects.filter((project) => project.areaId === area.id);
  elements.checklistEditor.innerHTML = `
    <p class="item-meta">${openTasks.length} open to-dos</p>
    <p class="item-meta">${projects.length} projects</p>
  `;
}

function getTaskQuickMeta(task) {
  if (isCompleted(task)) {
    return "Logbook";
  }

  if (task.deadline && isPast(task.deadline)) {
    return "Overdue";
  }

  if (task.when) {
    return formatDate(task.when);
  }

  return task.list.charAt(0).toUpperCase() + task.list.slice(1);
}

function renderQuickFindResults(query = "") {
  const normalized = query.trim().toLowerCase();
  const corpus = [
    ...state.tasks.map((task) => ({
      kind: "task",
      id: task.id,
      title: task.title,
      text: `${task.title} ${task.notes} ${task.tags.join(" ")}`,
      meta: [getTaskQuickMeta(task), ...(task.tags || []).map((tag) => `#${tag}`)],
    })),
    ...state.projects.map((project) => ({
      kind: "project",
      id: project.id,
      title: project.title,
      text: `${project.title} ${project.notes} ${project.tags.join(" ")}`,
      meta: ["Project", ...(project.tags || []).map((tag) => `#${tag}`)],
    })),
    ...state.areas.map((area) => ({
      kind: "area",
      id: area.id,
      title: area.title,
      text: `${area.title} ${area.notes}`,
      meta: ["Area"],
    })),
  ].filter((item) => !normalized || item.text.toLowerCase().includes(normalized));

  elements.quickFindResults.innerHTML = "";
  corpus.slice(0, 30).forEach((item) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "quick-result";
    row.innerHTML = `
      <strong>${escapeHtml(item.title)}</strong>
      <div class="quick-result-meta">
        ${item.meta.map((meta) => `<span class="tag-chip">${escapeHtml(meta)}</span>`).join("")}
      </div>
    `;
    row.addEventListener("click", () => {
      if (item.kind === "area") {
        state.view = { type: "area", id: item.id };
      } else if (item.kind === "project") {
        state.view = { type: "project", id: item.id };
      } else {
        state.view = inferViewForTask(getTaskById(item.id));
      }
      selectEntity(item.kind, item.id);
      elements.quickFindDialog.close();
    });
    elements.quickFindResults.append(row);
  });

  if (!corpus.length) {
    const empty = document.createElement("p");
    empty.className = "item-meta";
    empty.textContent = "No matches.";
    elements.quickFindResults.append(empty);
  }
}

function inferViewForTask(task) {
  if (!task) {
    return { type: "today", id: null };
  }
  if (isCompleted(task)) {
    return { type: "logbook", id: null };
  }
  if (task.projectId) {
    return { type: "project", id: task.projectId };
  }
  if (task.list === "inbox") {
    return { type: "inbox", id: null };
  }
  if (task.list === "someday") {
    return { type: "someday", id: null };
  }
  if (task.list === "anytime") {
    return { type: "anytime", id: null };
  }
  if (task.list === "upcoming" || isUpcoming(task.when)) {
    return { type: "upcoming", id: null };
  }
  return { type: "today", id: null };
}

function updateViewHeadings() {
  const labels = {
    inbox: ["Capture", "Inbox"],
    today: ["Focus", "Today"],
    upcoming: ["Planning", "Upcoming"],
    anytime: ["Available", "Anytime"],
    someday: ["Later", "Someday"],
    logbook: ["Finished", "Logbook"],
  };

  if (state.view.type === "area") {
    const area = getAreaById(state.view.id);
    elements.viewEyebrow.textContent = "Area";
    elements.viewTitle.textContent = area?.title || "Area";
    return;
  }

  if (state.view.type === "project") {
    const project = getProjectById(state.view.id);
    elements.viewEyebrow.textContent = "Project";
    elements.viewTitle.textContent = project?.title || "Project";
    return;
  }

  const [eyebrow, title] = labels[state.view.type] || ["List", "Today"];
  elements.viewEyebrow.textContent = eyebrow;
  elements.viewTitle.textContent = title;
}

function renderNavSelection() {
  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view.type);
  });
}

function renderFilterSelection() {
  elements.filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.listFilter === state.listFilter);
  });
  elements.listSearchInput.value = state.listSearch;
}

function render() {
  deriveCounts();
  renderNavSelection();
  renderFilterSelection();
  renderSidebarCollections();
  updateViewHeadings();
  renderTaskList();
  renderDetail();
  checkReminders();
}

function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const now = Date.now();
  state.tasks.forEach((task) => {
    if (!task.reminderAt || isCompleted(task)) {
      return;
    }

    const reminderTime = new Date(task.reminderAt).getTime();
    if (
      reminderTime <= now &&
      reminderTime > now - 60 * 1000 &&
      !task.reminderDeliveredAt
    ) {
      new Notification(task.title, {
        body: task.notes || "Reminder",
      });
      task.reminderDeliveredAt = new Date().toISOString();
      saveState();
    }
  });
}

function completeTask(id, completed) {
  const task = getTaskById(id);
  if (!task) {
    return;
  }

  task.completedAt = completed ? new Date().toISOString() : "";

  if (completed && task.repeat !== "none") {
    createNextRepeat(task);
  }

  saveAndRender(
    completed ? `Completed "${task.title}".` : `Reopened "${task.title}".`
  );
}

function createNextRepeat(task) {
  const baseDate = task.when || getTodayString();
  const increment = { daily: 1, weekly: 7, monthly: 30, yearly: 365 }[task.repeat];
  const nextTask = {
    ...structuredClone(task),
    id: makeId("task"),
    completedAt: "",
    reminderDeliveredAt: "",
    when: addDays(baseDate, increment),
  };

  if (task.deadline) {
    nextTask.deadline = addDays(task.deadline, increment);
  }
  if (task.reminderAt) {
    const [, time] = task.reminderAt.split("T");
    nextTask.reminderAt = `${nextTask.when}T${time}`;
  }

  nextTask.checklist = nextTask.checklist.map((item) => ({
    ...item,
    id: makeId("check"),
    completed: false,
  }));

  state.tasks.push(nextTask);
}

function addArea() {
  const title = window.prompt("Name the new area:");
  if (!title) {
    return;
  }

  const area = { id: makeId("area"), title: title.trim(), notes: "" };
  state.areas.push(area);
  saveAndRender(`Added area "${area.title}".`);
  state.view = { type: "area", id: area.id };
  selectEntity("area", area.id);
}

function addProject() {
  const title = window.prompt("Name the new project:");
  if (!title) {
    return;
  }

  const project = {
    id: makeId("project"),
    title: title.trim(),
    areaId: "",
    notes: "",
    status: "active",
    when: "",
    deadline: "",
    tags: [],
    headings: [],
  };
  state.projects.push(project);
  saveAndRender(`Added project "${project.title}".`);
  state.view = { type: "project", id: project.id };
  selectEntity("project", project.id);
}

function deleteSelectedEntity() {
  if (!selectedEntity) {
    return;
  }

  if (selectedEntity.kind === "task") {
    const task = getTaskById(selectedEntity.id);
    state.tasks = state.tasks.filter((item) => item.id !== selectedEntity.id);
    selectEntity(null, null);
    saveAndRender(task ? `Deleted "${task.title}".` : "Deleted to-do.");
    return;
  }

  if (selectedEntity.kind === "project") {
    const project = getProjectById(selectedEntity.id);
    state.projects = state.projects.filter((item) => item.id !== selectedEntity.id);
    state.tasks = state.tasks.map((task) =>
      task.projectId === selectedEntity.id
        ? { ...task, projectId: "", headingId: "" }
        : task
    );
    state.view = { type: "today", id: null };
    selectEntity(null, null);
    saveAndRender(project ? `Deleted "${project.title}".` : "Deleted project.");
    return;
  }

  const area = getAreaById(selectedEntity.id);
  state.areas = state.areas.filter((item) => item.id !== selectedEntity.id);
  state.projects = state.projects.map((project) =>
    project.areaId === selectedEntity.id ? { ...project, areaId: "" } : project
  );
  state.tasks = state.tasks.map((task) =>
    task.areaId === selectedEntity.id ? { ...task, areaId: "" } : task
  );
  state.view = { type: "today", id: null };
  selectEntity(null, null);
  saveAndRender(area ? `Deleted "${area.title}".` : "Deleted area.");
}

function handleDetailSave(event) {
  event.preventDefault();
  if (!selectedEntity) {
    return;
  }

  if (selectedEntity.kind === "task") {
    const task = getTaskById(selectedEntity.id);
    if (!task) {
      return;
    }

    task.title = elements.detailTitle.value.trim() || task.title;
    task.notes = elements.detailNotes.value.trim();
    task.list = elements.detailList.value;
    task.areaId = elements.detailArea.value;
    task.projectId = elements.detailProject.value;
    task.headingId = elements.detailHeading.value;
    task.when = elements.detailWhen.value;
    task.deadline = elements.detailDeadline.value;
    task.reminderAt = elements.detailReminder.value;
    task.repeat = elements.detailRepeat.value;
    task.tags = elements.detailTags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    task.evening = elements.detailEvening.checked;
    task.completedAt = elements.detailComplete.checked ? task.completedAt || new Date().toISOString() : "";
    syncChecklistFromEditor(task);
    maybeRequestReminderPermission(task);
    saveAndRender(`Saved "${task.title}".`);
    return;
  }

  if (selectedEntity.kind === "project") {
    const project = getProjectById(selectedEntity.id);
    if (!project) {
      return;
    }

    project.title = elements.detailTitle.value.trim() || project.title;
    project.notes = elements.detailNotes.value.trim();
    project.areaId = elements.detailArea.value;
    project.when = elements.detailWhen.value;
    project.deadline = elements.detailDeadline.value;
    project.status = elements.detailComplete.checked ? "completed" : "active";
    project.tags = elements.detailTags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    syncHeadingsFromEditor(project);
    saveAndRender(`Saved "${project.title}".`);
    return;
  }

  const area = getAreaById(selectedEntity.id);
  if (!area) {
    return;
  }

  area.title = elements.detailTitle.value.trim() || area.title;
  area.notes = elements.detailNotes.value.trim();
  saveAndRender(`Saved "${area.title}".`);
}

function syncChecklistFromEditor(task) {
  task.checklist = Array.from(elements.checklistEditor.querySelectorAll("[data-check-title]"))
    .map((input) => {
      const id = input.dataset.checkTitle;
      const toggle = elements.checklistEditor.querySelector(`[data-check-id="${id}"]`);
      return {
        id,
        title: input.value.trim(),
        completed: Boolean(toggle?.checked),
      };
    })
    .filter((item) => item.title);
}

function syncHeadingsFromEditor(project) {
  project.headings = Array.from(
    elements.checklistEditor.querySelectorAll("[data-heading-title]")
  )
    .map((input) => ({
      id: input.dataset.headingTitle,
      title: input.value.trim(),
    }))
    .filter((heading) => heading.title);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

elements.quickAddForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTaskFromQuickEntry(elements.quickAddInput.value);
  elements.quickAddForm.reset();
});

elements.navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.view = { type: button.dataset.view, id: null };
    if (selectedEntity?.kind === "task" && getSelectedEntity()) {
      const task = getSelectedEntity();
      if (task && inferViewForTask(task).type !== state.view.type) {
        selectEntity(null, null);
      } else {
        render();
      }
    } else {
      render();
    }
  });
});

elements.areaContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-kind='area']");
  if (!button) {
    return;
  }
  state.view = { type: "area", id: button.dataset.id };
  selectEntity("area", button.dataset.id);
});

elements.projectContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-kind='project']");
  if (!button) {
    return;
  }
  state.view = { type: "project", id: button.dataset.id };
  selectEntity("project", button.dataset.id);
});

elements.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.listFilter = button.dataset.listFilter;
    render();
  });
});

elements.listSearchInput.addEventListener("input", (event) => {
  state.listSearch = event.target.value.trim();
  render();
});

elements.listContent.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-action='toggle-complete']");
  if (toggle) {
    completeTask(toggle.dataset.id, toggle.checked);
    return;
  }

  const card = event.target.closest(".task-card");
  if (card) {
    selectEntity("task", card.dataset.id);
  }
});

elements.detailArea.addEventListener("change", () => {
  if (selectedEntity?.kind === "task" && !elements.detailProject.value) {
    return;
  }
  const project = getProjectById(elements.detailProject.value);
  if (project && project.areaId && project.areaId !== elements.detailArea.value) {
    project.areaId = elements.detailArea.value;
  }
});

elements.detailProject.addEventListener("change", () => {
  populateHeadingSelect(elements.detailProject.value);
});

elements.addChecklistItemButton.addEventListener("click", () => {
  if (!selectedEntity) {
    return;
  }

  if (selectedEntity.kind === "task") {
    const task = getTaskById(selectedEntity.id);
    task.checklist.push({ id: makeId("check"), title: "New checklist item", completed: false });
    renderDetail();
    return;
  }

  if (selectedEntity.kind === "project") {
    const project = getProjectById(selectedEntity.id);
    project.headings.push({ id: makeId("heading"), title: "New heading" });
    renderDetail();
  }
});

elements.checklistEditor.addEventListener("click", (event) => {
  const checkDelete = event.target.closest("[data-check-delete]");
  if (checkDelete && selectedEntity?.kind === "task") {
    const task = getTaskById(selectedEntity.id);
    task.checklist = task.checklist.filter((item) => item.id !== checkDelete.dataset.checkDelete);
    renderDetail();
    return;
  }

  const headingDelete = event.target.closest("[data-heading-delete]");
  if (headingDelete && selectedEntity?.kind === "project") {
    const project = getProjectById(selectedEntity.id);
    project.headings = project.headings.filter(
      (heading) => heading.id !== headingDelete.dataset.headingDelete
    );
    state.tasks = state.tasks.map((task) =>
      task.headingId === headingDelete.dataset.headingDelete ? { ...task, headingId: "" } : task
    );
    renderDetail();
  }
});

elements.detailForm.addEventListener("submit", handleDetailSave);
elements.deleteItemButton.addEventListener("click", deleteSelectedEntity);
elements.quickFindButton.addEventListener("click", () => {
  renderQuickFindResults(elements.quickFindInput.value);
  elements.quickFindDialog.showModal();
  window.setTimeout(() => elements.quickFindInput.focus(), 0);
});
elements.quickFindInput.addEventListener("input", (event) => {
  renderQuickFindResults(event.target.value);
});
elements.newAreaButton.addEventListener("click", addArea);
elements.newProjectButton.addEventListener("click", addProject);
elements.seedButton.addEventListener("click", () => {
  state = createSeedState();
  selectedEntity = null;
  saveAndRender("Cleared the workspace.");
});

window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    renderQuickFindResults(elements.quickFindInput.value);
    elements.quickFindDialog.showModal();
    window.setTimeout(() => elements.quickFindInput.focus(), 0);
  }
});

window.setInterval(checkReminders, 30 * 1000);

render();
setStatus("");
