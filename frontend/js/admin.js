// js/admin.js - Admin dashboard logic (enhanced UI)
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
const API = isLocalhost ? "http://localhost:5002" : window.location.origin;

// ─── Auth guard ───────────────────────────────────────────────
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user || user.role !== "admin") {
  window.location.href = "index.html";
}

document.getElementById("navUser").textContent = `Hello, ${user.name}`;

// Populate mobile nav
const mobileAvatar = document.getElementById("mobileAvatar");
const mobileUserName = document.getElementById("mobileUserName");
if (mobileAvatar) mobileAvatar.textContent = (user.name || "A").charAt(0).toUpperCase();
if (mobileUserName) mobileUserName.textContent = user.name || "Admin";

// Welcome title
const welcomeTitle = document.getElementById("welcomeTitle");
if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${user.name.split(" ")[0]}!`;

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

// ─── Show skeleton loaders on init ────────────────────────────
function showSkeletons() {
  const statsEl = document.getElementById("overviewStats");
  if (statsEl) statsEl.innerHTML = skeletonStatCards(4);

  const barsEl = document.getElementById("ratingBars");
  if (barsEl) barsEl.innerHTML = `
    <div class="skeleton skeleton-text long" style="height:18px; margin-bottom:14px;"></div>
    <div class="skeleton skeleton-text long" style="height:18px; margin-bottom:14px;"></div>
    <div class="skeleton skeleton-text medium" style="height:18px; margin-bottom:14px;"></div>
    <div class="skeleton skeleton-text short" style="height:18px; margin-bottom:14px;"></div>
    <div class="skeleton skeleton-text short" style="height:18px;"></div>
  `;

  const courseEl = document.getElementById("courseTable");
  if (courseEl) courseEl.innerHTML = skeletonTableRows(4, 5);

  const catEl = document.getElementById("categoryStats");
  if (catEl) catEl.innerHTML = `
    <div class="skeleton skeleton-text long" style="height:16px; margin-bottom:12px;"></div>
    <div class="skeleton skeleton-text medium" style="height:16px; margin-bottom:12px;"></div>
    <div class="skeleton skeleton-text short" style="height:16px;"></div>
  `;
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
let ratingChartInstance = null;

async function loadStats() {
  const data = await api("GET", "/admin/feedback-stats");
  if (!data.success) return;

  const t = data.stats.totals;
  const cs = data.stats.courseStats || [];

  // Stat cards (staggered)
  document.getElementById("overviewStats").innerHTML = `
    <div class="stat-card blue animate-in" style="animation-delay:0s">
      <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
      <div class="stat-value">${t.total_feedback || 0}</div>
      <div class="stat-label">Total Feedback</div>
    </div>
    <div class="stat-card green animate-in" style="animation-delay:0.06s">
      <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      <div class="stat-value">${t.overall_avg_rating || "—"}</div>
      <div class="stat-label">Overall Avg Rating</div>
    </div>
    <div class="stat-card orange animate-in" style="animation-delay:0.12s">
      <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      <div class="stat-value">${data.stats.totalSuggestions || 0}</div>
      <div class="stat-label">Suggestions</div>
    </div>
    <div class="stat-card red animate-in" style="animation-delay:0.18s">
      <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>
      <div class="stat-value">${data.stats.pendingActions || 0}</div>
      <div class="stat-label">Pending Actions</div>
    </div>
  `;

  // Rating breakdown bars (animated)
  const total = Number(t.total_feedback) || 1;
  const bars = [5, 4, 3, 2, 1]
    .map((star, i) => {
      const count = Number(t[`${numberToWord(star)}_star`] || 0);
      const pct = Math.round((count / total) * 100);
      return `
      <div class="rating-bar-row animate-in" style="animation-delay:${i * 0.06}s">
        <div class="rating-bar-label">${"★".repeat(star)} ${star}</div>
        <div class="rating-bar-track">
          <div class="rating-bar-fill" style="width:0%" data-target="${pct}"></div>
        </div>
        <div class="rating-bar-count">${count}</div>
      </div>`;
    })
    .join("");
  document.getElementById("ratingBars").innerHTML = bars;

  // Animate bars after render
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.querySelectorAll(".rating-bar-fill").forEach((bar) => {
        bar.style.width = bar.dataset.target + "%";
      });
    }, 100);
  });

  // ── Rating Distribution chart ──
  const starCounts = [1, 2, 3, 4, 5].map(
    (star) => Number(t[`${numberToWord(star)}_star`] || 0)
  );

  const ctx = document.getElementById("ratingChart");
  if (ctx) {
    if (ratingChartInstance) ratingChartInstance.destroy();
    ratingChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
        datasets: [{
          data: starCounts,
          backgroundColor: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#6366f1"],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { animateRotate: true, duration: 800, easing: "easeOutQuart" },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: getComputedStyle(document.body).getPropertyValue("--text") || "#333",
              padding: 12,
              usePointStyle: true,
              font: { family: "'Poppins', sans-serif", size: 12 },
            },
          },
        },
      },
    });
  }

  // ── Category breakdown ──
  const catStats = data.stats.categoryStats || [];
  const catEl = document.getElementById("categoryStats");
  if (catEl) {
    if (catStats.length === 0) {
      catEl.innerHTML = emptyState("No Category Data", "Category breakdown will appear once categorized feedback is submitted.");
    } else {
      catEl.innerHTML = catStats
        .map(
          (c, i) => `
        <div class="category-row animate-in" style="animation-delay:${i * 0.04}s">
          <span class="category-name">${escHtml(c.category)}</span>
          <span class="category-count">${c.count} feedback${c.count > 1 ? "s" : ""}</span>
          <span class="category-rating">★ ${c.avg_rating || "—"}</span>
        </div>
      `,
        )
        .join("");
    }
  }

  // Course table
  document.getElementById("courseTable").innerHTML = buildCourseTable(cs);
}

function numberToWord(n) {
  return ["zero", "one", "two", "three", "four", "five"][n] || n;
}

function buildCourseTable(courses) {
  if (!courses.length) return emptyState("No Courses", "Add courses using the 'Add Course' tab.");
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
            <tr class="animate-in" style="animation-delay:${i * 0.03}s">
              <td>${i + 1}</td>
              <td><strong>${escHtml(c.course_name)}</strong></td>
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

// ─── Feedback Trends Chart ────────────────────────────────────
let trendsChartInstance = null;

async function loadTrends() {
  const data = await api("GET", "/admin/feedback-trends");
  if (!data.success || !data.trends || data.trends.length === 0) {
    const el = document.getElementById("trendsChart");
    if (el) el.parentElement.innerHTML = emptyState("No Trend Data", "Trends will appear once feedback is submitted over multiple dates.");
    return;
  }

  const labels = data.trends.map((t) => {
    const d = new Date(t.week_start);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  });
  const counts = data.trends.map((t) => t.count);
  const ratings = data.trends.map((t) => Number(t.avg_rating));

  const ctx = document.getElementById("trendsChart");
  if (!ctx) return;
  if (trendsChartInstance) trendsChartInstance.destroy();

  const textColor = getComputedStyle(document.body).getPropertyValue("--text") || "#333";

  trendsChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Avg Rating",
          data: ratings,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y",
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: "#6366f1",
        },
        {
          label: "Feedback Count",
          data: counts,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y1",
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: "#22c55e",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: "easeOutQuart" },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            color: textColor,
            usePointStyle: true,
            font: { family: "'Poppins', sans-serif", size: 12 },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          titleFont: { family: "'Poppins', sans-serif" },
          bodyFont: { family: "'Poppins', sans-serif" },
          cornerRadius: 8,
          padding: 12,
        },
      },
      scales: {
        y: {
          type: "linear",
          position: "left",
          title: { display: true, text: "Avg Rating", color: textColor, font: { family: "'Poppins', sans-serif" } },
          min: 0,
          max: 5,
          ticks: { color: textColor },
          grid: { color: "rgba(128,128,128,0.1)" },
        },
        y1: {
          type: "linear",
          position: "right",
          title: { display: true, text: "Count", color: textColor, font: { family: "'Poppins', sans-serif" } },
          min: 0,
          ticks: { color: textColor },
          grid: { drawOnChartArea: false },
        },
        x: {
          ticks: { color: textColor },
          grid: { color: "rgba(128,128,128,0.1)" },
        },
      },
    },
  });
}

// ─── Load actions ─────────────────────────────────────────────
async function loadActions(status = "") {
  const el = document.getElementById("actionsList");
  el.innerHTML = skeletonTableRows(4, 6);

  const path = "/admin/actions" + (status ? `?status=${status}` : "");
  const data = await api("GET", path);

  if (!data.actions || data.actions.length === 0) {
    el.innerHTML = emptyState("No Actions Yet", "Record actions to track improvements.");
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
            <tr class="animate-in" style="animation-delay:${i * 0.03}s">
              <td>${i + 1}</td>
              <td><strong>${escHtml(a.course_name)}</strong></td>
              <td>${escHtml(a.issue_description)}</td>
              <td>${escHtml(a.action_taken)}</td>
              <td><span class="badge badge-${a.status}">${a.status}</span></td>
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
  el.innerHTML = skeletonTableRows(4, 4);

  const data = await api("GET", "/admin/suggestions");

  if (!data.suggestions || data.suggestions.length === 0) {
    el.innerHTML = emptyState("No Suggestions Yet", "Student suggestions will appear here.");
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
            <tr class="animate-in" style="animation-delay:${i * 0.03}s">
              <td>${i + 1}</td>
              <td><strong>${escHtml(s.course_name)}</strong></td>
              <td>${escHtml(s.suggestion)}</td>
              <td>${new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
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
    const btn = document.getElementById("addCourseBtn");
    const course_name = document.getElementById("ac_name").value.trim();
    const faculty_id = document.getElementById("ac_faculty").value || null;

    btn.disabled = true;
    btn.classList.add("btn-loading");

    const data = await api("POST", "/admin/course", {
      course_name,
      faculty_id: faculty_id ? parseInt(faculty_id) : null,
    });

    btn.disabled = false;
    btn.classList.remove("btn-loading");

    if (data.success) {
      showToast("Course added successfully!", "success");
      showMsg(msgEl, "Course added successfully!", "success");
      this.reset();
      loadStats(); // refresh
    } else {
      showToast(data.message, "error");
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
    const btn = document.getElementById("recordActionBtn");
    const course_id = document.getElementById("ra_course").value;
    const issue_description = document.getElementById("ra_issue").value.trim();
    const action_taken = document.getElementById("ra_action").value.trim();
    const status = document.getElementById("ra_status").value;

    if (!course_id) {
      showToast("Please select a course.", "warning");
      return showMsg(msgEl, "Please select a course.", "error");
    }

    btn.disabled = true;
    btn.classList.add("btn-loading");

    const data = await api("POST", "/admin/action", {
      course_id: parseInt(course_id),
      issue_description,
      action_taken,
      status,
    });

    btn.disabled = false;
    btn.classList.remove("btn-loading");

    if (data.success) {
      showToast("Action recorded successfully!", "success");
      showMsg(msgEl, "Action recorded successfully!", "success");
      this.reset();
    } else {
      showToast(data.message, "error");
      showMsg(msgEl, data.message, "error");
    }
  });

// ─── Helpers ──────────────────────────────────────────────────
function showMsg(el, msg, type) {
  el.textContent = msg;
  el.className = `alert alert-${type === "error" ? "error" : "success"}`;
  setTimeout(() => el.classList.add("hidden"), 5000);
}

// ─── Init ─────────────────────────────────────────────────────
showSkeletons();
loadStats();
loadTrends();
loadFacultyDropdown();
loadCoursesForAction();
