// js/admin.js - Admin dashboard logic
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
const API = isLocalhost ? "http://localhost:5002" : window.location.origin;

// ─── Auth guard ───────────────────────────────────────────────
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user || user.role !== "admin") {
  window.location.href = "index.html";
}

document.getElementById("navUser").textContent = `Hello, ${user.name}`;
document.getElementById("welcomeTitle").textContent = `Welcome back, ${user.name}`;

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

// ─── Toast notifications ──────────────────────────────────────
function showToast(msg, type = "success") {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
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

// ─── SVG icon helpers ─────────────────────────────────────────
const statIcons = {
  feedback: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  star: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  lightbulb: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>`,
  alert: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
};

// ─── Load overview stats ──────────────────────────────────────
let ratingChart = null;

async function loadStats() {
  const data = await api("GET", "/admin/feedback-stats");
  if (!data.success) return;

  const t = data.stats.totals;
  const cs = data.stats.courseStats || [];

  // Stat cards with icons
  document.getElementById("overviewStats").innerHTML = `
    <div class="stat-card blue animate-in" style="animation-delay: 0s;">
      <div class="stat-icon">${statIcons.feedback}</div>
      <div class="stat-value">${t.total_feedback || 0}</div>
      <div class="stat-label">Total Feedback</div>
    </div>
    <div class="stat-card green animate-in" style="animation-delay: 0.08s;">
      <div class="stat-icon">${statIcons.star}</div>
      <div class="stat-value">${t.overall_avg_rating || "—"}</div>
      <div class="stat-label">Overall Avg Rating</div>
    </div>
    <div class="stat-card orange animate-in" style="animation-delay: 0.16s;">
      <div class="stat-icon">${statIcons.lightbulb}</div>
      <div class="stat-value">${data.stats.totalSuggestions || 0}</div>
      <div class="stat-label">Suggestions</div>
    </div>
    <div class="stat-card red animate-in" style="animation-delay: 0.24s;">
      <div class="stat-icon">${statIcons.alert}</div>
      <div class="stat-value">${data.stats.pendingActions || 0}</div>
      <div class="stat-label">Pending Actions</div>
    </div>
  `;

  // Rating breakdown bars
  const total = Number(t.total_feedback) || 1;
  const starCounts = [5, 4, 3, 2, 1].map((star) => Number(t[`${numberToWord(star)}_star`] || 0));

  const bars = [5, 4, 3, 2, 1]
    .map((star, idx) => {
      const count = starCounts[idx];
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

  // Chart.js Doughnut
  renderRatingChart(starCounts);

  // Course table
  document.getElementById("courseTable").innerHTML = buildCourseTable(cs);
}

function renderRatingChart(starCounts) {
  const ctx = document.getElementById("ratingChart");
  if (!ctx) return;

  const isDark = document.documentElement.classList.contains("dark-theme");
  const textColor = isDark ? "#f3f4f6" : "#1f2937";

  if (ratingChart) ratingChart.destroy();

  ratingChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["5 Star", "4 Star", "3 Star", "2 Star", "1 Star"],
      datasets: [
        {
          data: starCounts,
          backgroundColor: [
            "#10b981",
            "#3b82f6",
            "#f59e0b",
            "#f97316",
            "#ef4444",
          ],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "60%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: textColor,
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 12,
            font: { family: "Poppins", size: 12 },
          },
        },
        tooltip: {
          backgroundColor: isDark ? "#374151" : "#1f2937",
          titleFont: { family: "Poppins" },
          bodyFont: { family: "Poppins" },
          cornerRadius: 8,
          padding: 12,
        },
      },
    },
  });
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
              <td><strong>${escHtml(c.course_name)}</strong></td>
              <td>${escHtml(c.faculty_name || "Unassigned")}</td>
              <td>${c.total_feedback}</td>
              <td>${c.avg_rating ? '<span style="color: var(--warning);">★</span> ' + c.avg_rating : "—"}</td>
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
  el.innerHTML = '<p class="loading"><span class="spinner"></span> Loading...</p>';

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
              <td><strong>${escHtml(a.course_name)}</strong></td>
              <td>${escHtml(a.issue_description)}</td>
              <td>${escHtml(a.action_taken)}</td>
              <td><span class="badge ${getBadgeClass(a.status)}" style="text-transform: capitalize;">${a.status}</span></td>
              <td>
                <select class="status-select" onchange="updateStatus(${a.action_id}, this.value)">
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
  if (data.success) {
    showToast("Status updated successfully!", "success");
    loadActions(document.getElementById("actionStatusFilter").value);
  } else {
    showToast("Failed to update status.", "error");
  }
}

window.filterActions = (status) => loadActions(status);

// ─── Load suggestions ─────────────────────────────────────────
async function loadSuggestions() {
  const el = document.getElementById("suggestionsList");
  el.innerHTML = '<p class="loading"><span class="spinner"></span> Loading...</p>';

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
              <td><strong>${escHtml(s.course_name)}</strong></td>
              <td>${escHtml(s.suggestion)}</td>
              <td style="white-space: nowrap;">${new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
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
      showToast("Course added!", "success");
      this.reset();
      loadStats(); // refresh
    } else {
      showMsg(msgEl, data.message, "error");
      showToast(data.message || "Failed to add course.", "error");
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

    if (!course_id) {
      showToast("Please select a course.", "error");
      return showMsg(msgEl, "Please select a course.", "error");
    }

    const data = await api("POST", "/admin/action", {
      course_id: parseInt(course_id),
      issue_description,
      action_taken,
      status,
    });

    if (data.success) {
      showMsg(msgEl, "Action recorded successfully!", "success");
      showToast("Action recorded!", "success");
      this.reset();
    } else {
      showMsg(msgEl, data.message, "error");
      showToast(data.message || "Failed to record action.", "error");
    }
  });

// ─── Helpers ──────────────────────────────────────────────────
function showMsg(el, msg, type) {
  el.textContent = msg;
  el.className = `alert alert-${type === "error" ? "error" : "success"}`;
  setTimeout(() => el.classList.add("hidden"), 5000);
}

function getBadgeClass(status) {
  if (status === "resolved") return "badge-green";
  if (status === "in-progress") return "badge-yellow";
  return "badge-red";
}

function escHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Re-render chart on theme toggle ──────────────────────────
const origToggle = window.toggleTheme;
window.toggleTheme = function () {
  origToggle();
  // Re-render chart with updated colors after theme switch
  setTimeout(() => {
    if (ratingChart) {
      const isDark = document.documentElement.classList.contains("dark-theme");
      const textColor = isDark ? "#f3f4f6" : "#1f2937";
      ratingChart.options.plugins.legend.labels.color = textColor;
      ratingChart.options.plugins.tooltip.backgroundColor = isDark ? "#374151" : "#1f2937";
      ratingChart.update();
    }
  }, 50);
};

// ─── Init ─────────────────────────────────────────────────────
loadStats();
loadFacultyDropdown();
loadCoursesForAction();
