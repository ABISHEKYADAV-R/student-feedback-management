// js/admin.js - Admin dashboard logic
const API = "http://localhost:5000";

// ─── Auth guard ───────────────────────────────────────────────
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user || user.role !== "admin") {
  window.location.href = "index.html";
}

document.getElementById("navUser").textContent = `Hello, ${user.name}`;

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ─── API helper ───────────────────────────────────────────────
async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── Tabs ─────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");

    const tab = btn.dataset.tab;
    if (tab === "actions") loadActions();
    if (tab === "suggestions") loadSuggestions();
  });
});

// ─── Load overview stats ──────────────────────────────────────
async function loadStats() {
  const data = await api("GET", "/admin/feedback-stats");
  if (!data.success) return;

  const t = data.stats.totals;
  const cs = data.stats.courseStats || [];

  // Stat cards
  document.getElementById("overviewStats").innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${t.total_feedback || 0}</div>
      <div class="stat-label">Total Feedback</div>
    </div>
    <div class="stat-card green">
      <div class="stat-value">${t.overall_avg_rating || "—"}</div>
      <div class="stat-label">Overall Avg Rating</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-value">${data.stats.totalSuggestions || 0}</div>
      <div class="stat-label">Suggestions</div>
    </div>
    <div class="stat-card red">
      <div class="stat-value">${data.stats.pendingActions || 0}</div>
      <div class="stat-label">Pending Actions</div>
    </div>
  `;

  // Rating breakdown bars
  const total = Number(t.total_feedback) || 1;
  const bars = [5, 4, 3, 2, 1]
    .map((star) => {
      const count = Number(t[`${numberToWord(star)}_star`] || 0);
      const pct = Math.round((count / total) * 100);
      return `
      <div class="rating-bar-row">
        <div class="rating-bar-label">${"★".repeat(star)} ${star}</div>
        <div class="rating-bar-track">
          <div class="rating-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="rating-bar-count">${count}</div>
      </div>`;
    })
    .join("");
  document.getElementById("ratingBars").innerHTML = bars;

  // Course table
  document.getElementById("courseTable").innerHTML = buildCourseTable(cs);
}

function numberToWord(n) {
  return ["zero", "one", "two", "three", "four", "five"][n] || n;
}

function buildCourseTable(courses) {
  if (!courses.length) return '<p class="empty-msg">No courses found.</p>';
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Course Name</th>
            <th>Faculty</th>
            <th>Total Feedback</th>
            <th>Avg Rating</th>
          </tr>
        </thead>
        <tbody>
          ${courses
            .map(
              (c, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escHtml(c.course_name)}</td>
              <td>${escHtml(c.faculty_name || "Unassigned")}</td>
              <td>${c.total_feedback}</td>
              <td>${c.avg_rating ? "★ " + c.avg_rating : "—"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

// ─── Load actions ─────────────────────────────────────────────
async function loadActions(status = "") {
  const el = document.getElementById("actionsList");
  el.innerHTML = '<p class="loading">Loading...</p>';

  const path = "/admin/actions" + (status ? `?status=${status}` : "");
  const data = await api("GET", path);

  if (!data.actions || data.actions.length === 0) {
    el.innerHTML = '<p class="empty-msg">No actions recorded yet.</p>';
    return;
  }

  el.innerHTML = `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr><th>#</th><th>Course</th><th>Issue</th><th>Action Taken</th><th>Status</th><th>Update</th></tr>
        </thead>
        <tbody>
          ${data.actions
            .map(
              (a, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escHtml(a.course_name)}</td>
              <td>${escHtml(a.issue_description)}</td>
              <td>${escHtml(a.action_taken)}</td>
              <td><span class="badge badge-${a.status}">${a.status}</span></td>
              <td>
                <select onchange="updateStatus(${a.action_id}, this.value)" style="padding:4px 8px;border:1px solid #dee2e6;border-radius:6px;font-size:.8rem;">
                  <option value="pending"     ${a.status === "pending" ? "selected" : ""}>Pending</option>
                  <option value="in-progress" ${a.status === "in-progress" ? "selected" : ""}>In Progress</option>
                  <option value="resolved"    ${a.status === "resolved" ? "selected" : ""}>Resolved</option>
                </select>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

async function updateStatus(id, status) {
  const data = await api("PUT", `/admin/action/${id}`, { status });
  if (data.success)
    loadActions(document.getElementById("actionStatusFilter").value);
}

window.filterActions = (status) => loadActions(status);

// ─── Load suggestions ─────────────────────────────────────────
async function loadSuggestions() {
  const el = document.getElementById("suggestionsList");
  el.innerHTML = '<p class="loading">Loading...</p>';

  const data = await api("GET", "/admin/suggestions");

  if (!data.suggestions || data.suggestions.length === 0) {
    el.innerHTML = '<p class="empty-msg">No suggestions yet.</p>';
    return;
  }

  el.innerHTML = `
    <div class="table-wrapper">
      <table class="data-table">
        <thead><tr><th>#</th><th>Course</th><th>Suggestion</th><th>Date</th></tr></thead>
        <tbody>
          ${data.suggestions
            .map(
              (s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escHtml(s.course_name)}</td>
              <td>${escHtml(s.suggestion)}</td>
              <td>${new Date(s.created_at).toLocaleDateString()}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

// ─── Add course form ──────────────────────────────────────────
async function loadFacultyDropdown() {
  const data = await api("GET", "/admin/faculty");
  if (!data.faculty) return;
  const opts = data.faculty
    .map((f) => `<option value="${f.user_id}">${escHtml(f.name)}</option>`)
    .join("");
  document.getElementById("ac_faculty").innerHTML += opts;
}

document
  .getElementById("addCourseForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const msgEl = document.getElementById("acMsg");
    const course_name = document.getElementById("ac_name").value.trim();
    const faculty_id = document.getElementById("ac_faculty").value || null;

    const data = await api("POST", "/admin/course", {
      course_name,
      faculty_id: faculty_id ? parseInt(faculty_id) : null,
    });

    if (data.success) {
      showMsg(msgEl, "Course added successfully!", "success");
      this.reset();
      loadStats(); // refresh
    } else {
      showMsg(msgEl, data.message, "error");
    }
  });

// ─── Load courses for Record Action dropdown ──────────────────
async function loadCoursesForAction() {
  const data = await api("GET", "/admin/courses");
  if (!data.courses) return;
  const opts = data.courses
    .map(
      (c) =>
        `<option value="${c.course_id}">${escHtml(c.course_name)}</option>`,
    )
    .join("");
  document.getElementById("ra_course").innerHTML =
    '<option value="">-- Select a course --</option>' + opts;
}

// ─── Record action form ───────────────────────────────────────
document
  .getElementById("recordActionForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const msgEl = document.getElementById("raMsg");
    const course_id = document.getElementById("ra_course").value;
    const issue_description = document.getElementById("ra_issue").value.trim();
    const action_taken = document.getElementById("ra_action").value.trim();
    const status = document.getElementById("ra_status").value;

    if (!course_id) return showMsg(msgEl, "Please select a course.", "error");

    const data = await api("POST", "/admin/action", {
      course_id: parseInt(course_id),
      issue_description,
      action_taken,
      status,
    });

    if (data.success) {
      showMsg(msgEl, "Action recorded successfully!", "success");
      this.reset();
    } else {
      showMsg(msgEl, data.message, "error");
    }
  });

// ─── Helpers ──────────────────────────────────────────────────
function showMsg(el, msg, type) {
  el.textContent = msg;
  el.className = `alert alert-${type === "error" ? "error" : "success"}`;
  setTimeout(() => el.classList.add("hidden"), 5000);
}

function escHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Init ─────────────────────────────────────────────────────
loadStats();
loadFacultyDropdown();
loadCoursesForAction();
