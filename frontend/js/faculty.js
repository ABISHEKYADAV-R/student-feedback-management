// js/faculty.js - Faculty dashboard logic
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
const API = isLocalhost ? "http://localhost:5002" : window.location.origin;

// ─── Auth guard ───────────────────────────────────────────────
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user || user.role !== "faculty") {
  window.location.href = "index.html";
}

document.getElementById("navUser").textContent = `Hello, ${user.name}`;
document.getElementById("welcomeTitle").textContent = `Welcome back, ${user.name}`;

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ─── API helper ───────────────────────────────────────────────
async function api(method, path) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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

// ─── SVG icon helpers ─────────────────────────────────────────
const statIcons = {
  feedback: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  star: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  book: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
  comment: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
};

// ─── Load feedback summary ────────────────────────────────────
let ratingChartInstance = null;

async function loadSummary() {
  const data = await api("GET", "/faculty/feedback-summary");

  if (!data.success) {
    document.getElementById("summaryCards").innerHTML =
      `<div class="stat-card loading-card">${data.message || "Error loading data."}</div>`;
    return;
  }

  const summary = data.summary || [];
  const comments = data.comments || [];

  // ── Summary stat cards ──
  const totalFeedback = summary.reduce(
    (s, c) => s + Number(c.total_feedback),
    0,
  );
  const avgAll = summary.length
    ? (
        summary.reduce((s, c) => s + Number(c.average_rating || 0), 0) /
        summary.length
      ).toFixed(2)
    : "N/A";

  document.getElementById("summaryCards").innerHTML = `
    <div class="stat-card blue animate-in" style="animation-delay: 0s;">
      <div class="stat-icon">${statIcons.feedback}</div>
      <div class="stat-value">${totalFeedback}</div>
      <div class="stat-label">Total Feedback</div>
    </div>
    <div class="stat-card green animate-in" style="animation-delay: 0.08s;">
      <div class="stat-icon">${statIcons.star}</div>
      <div class="stat-value">${avgAll}</div>
      <div class="stat-label">Avg Rating</div>
    </div>
    <div class="stat-card orange animate-in" style="animation-delay: 0.16s;">
      <div class="stat-icon">${statIcons.book}</div>
      <div class="stat-value">${summary.length}</div>
      <div class="stat-label">Courses</div>
    </div>
    <div class="stat-card red animate-in" style="animation-delay: 0.24s;">
      <div class="stat-icon">${statIcons.comment}</div>
      <div class="stat-value">${comments.length}</div>
      <div class="stat-label">Comments</div>
    </div>
  `;

  // ── Render Chart.js ──
  renderChart(data.distribution || summary);

  // ── Quick Summary panel ──
  renderQuickSummary(summary, totalFeedback, avgAll, comments.length);

  // ── Per-course detail ──
  const courseEl = document.getElementById("courseCards");
  if (summary.length === 0) {
    document.getElementById("noDataMsg").textContent =
      "No courses assigned yet.";
    courseEl.innerHTML = "";
  } else {
    document.getElementById("noDataMsg").style.display = "none";
    courseEl.innerHTML = summary
      .map(
        (c) => `
        <div class="course-stat animate-in">
          <div class="course-stat-name">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            ${escHtml(c.course_name)}
          </div>
          <div class="course-stat-info">
            <div class="mini-stat">
              <div class="val">${c.total_feedback || 0}</div>
              <div class="lbl">Responses</div>
            </div>
            <div class="mini-stat">
              <div class="val">${c.average_rating ? '<span style="color: var(--warning);">★</span> ' + c.average_rating : "—"}</div>
              <div class="lbl">Avg Rating</div>
            </div>
            <div class="mini-stat">
              <div class="val">${c.lowest_rating || "—"}</div>
              <div class="lbl">Lowest</div>
            </div>
            <div class="mini-stat">
              <div class="val">${c.highest_rating || "—"}</div>
              <div class="lbl">Highest</div>
            </div>
          </div>
        </div>
      `,
      )
      .join("");
  }

  // ── Comments ──
  const commentEl = document.getElementById("commentsList");
  if (comments.length === 0) {
    commentEl.innerHTML = '<p class="empty-msg">No comments yet.</p>';
  } else {
    commentEl.innerHTML = comments
      .map(
        (c) => `
        <div class="comment-item">
          <div class="comment-meta">
            <span><strong>${escHtml(c.course_name)}</strong></span>
            <span>${new Date(c.feedback_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} &nbsp;|&nbsp; <span class="comment-stars">${"★".repeat(c.rating)}${"☆".repeat(5 - c.rating)}</span></span>
          </div>
          <div class="comment-text">${escHtml(c.comment)}</div>
        </div>
      `,
      )
      .join("");
  }
}

// ─── Quick Summary Panel ──────────────────────────────────────
function renderQuickSummary(summary, totalFeedback, avgAll, commentCount) {
  const el = document.getElementById("quickSummary");
  if (!el) return;

  if (summary.length === 0) {
    el.innerHTML = '<p class="empty-msg">No data yet. Feedback will appear here once students submit reviews.</p>';
    return;
  }

  // Find best & worst course
  const sorted = [...summary].filter(c => c.average_rating).sort((a, b) => b.average_rating - a.average_rating);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  el.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="mini-stat" style="text-align: left; padding: 16px;">
        <div class="lbl" style="margin-bottom: 4px;">Best Performing Course</div>
        <div style="font-size: 1rem; font-weight: 600; color: var(--success);">
          ${best ? escHtml(best.course_name) + ' — ★ ' + best.average_rating : 'N/A'}
        </div>
      </div>
      ${sorted.length > 1 ? `
      <div class="mini-stat" style="text-align: left; padding: 16px;">
        <div class="lbl" style="margin-bottom: 4px;">Needs Attention</div>
        <div style="font-size: 1rem; font-weight: 600; color: var(--warning);">
          ${escHtml(worst.course_name)} — ★ ${worst.average_rating}
        </div>
      </div>` : ''}
      <div class="mini-stat" style="text-align: left; padding: 16px;">
        <div class="lbl" style="margin-bottom: 4px;">Feedback Overview</div>
        <div style="font-size: 0.9rem; color: var(--text);">
          <strong>${totalFeedback}</strong> total responses across <strong>${summary.length}</strong> course${summary.length > 1 ? 's' : ''} with <strong>${commentCount}</strong> comment${commentCount !== 1 ? 's' : ''}.
        </div>
      </div>
    </div>
  `;
}

// ─── Chart ────────────────────────────────────────────────────
function renderChart(summaryData) {
  const ctx = document.getElementById("ratingChart");
  if (!ctx) return;

  const isDark = document.documentElement.classList.contains("dark-theme");
  const textColor = isDark ? "#f3f4f6" : "#1f2937";
  const gridColor = isDark ? "#374151" : "#e5e7eb";

  // Calculate distribution
  let distribution = [0, 0, 0, 0, 0];

  if (Array.isArray(summaryData)) {
    summaryData.forEach((c) => {
      const avg = Math.round(Number(c.average_rating || 0));
      if (avg > 0 && avg <= 5)
        distribution[avg - 1] += Number(c.total_feedback || 0);
    });
  }

  if (ratingChartInstance) ratingChartInstance.destroy();

  ratingChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
      datasets: [
        {
          label: "Feedback Count",
          data: distribution,
          backgroundColor: [
            "#ef4444",
            "#f97316",
            "#eab308",
            "#84cc16",
            "#22c55e",
          ],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? "#374151" : "#1f2937",
          titleFont: { family: "Poppins" },
          bodyFont: { family: "Poppins" },
          cornerRadius: 8,
          padding: 12,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: textColor, font: { family: "Poppins" } },
          grid: { color: gridColor },
        },
        x: {
          ticks: { color: textColor, font: { family: "Poppins" } },
          grid: { display: false },
        },
      },
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────
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
  setTimeout(() => {
    if (ratingChartInstance) {
      const isDark = document.documentElement.classList.contains("dark-theme");
      const textColor = isDark ? "#f3f4f6" : "#1f2937";
      const gridColor = isDark ? "#374151" : "#e5e7eb";
      ratingChartInstance.options.scales.y.ticks.color = textColor;
      ratingChartInstance.options.scales.x.ticks.color = textColor;
      ratingChartInstance.options.scales.y.grid.color = gridColor;
      ratingChartInstance.options.plugins.tooltip.backgroundColor = isDark ? "#374151" : "#1f2937";
      ratingChartInstance.update();
    }
  }, 50);
};

// ─── Init ─────────────────────────────────────────────────────
loadSummary();
