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

// ─── Load feedback summary ────────────────────────────────────
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
    <div class="stat-card">
      <div class="stat-value">${totalFeedback}</div>
      <div class="stat-label">Total Feedback</div>
    </div>
    <div class="stat-card green">
      <div class="stat-value">${avgAll}</div>
      <div class="stat-label">Avg Rating</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-value">${summary.length}</div>
      <div class="stat-label">Courses</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${comments.length}</div>
      <div class="stat-label">Comments</div>
    </div>
  `;

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
        <div class="fb-row">
          <div class="fb-row-title">${escHtml(c.course_name)}</div>
          <div style="display: flex; gap: 32px;">
            <div class="fb-row-stats">
              <div style="font-size: 0.75rem; text-transform: uppercase;">Responses</div>
              <div style="font-size: 1.1rem; font-weight: 600; color: var(--text);">${c.total_feedback || 0}</div>
            </div>
            <div class="fb-row-stats">
              <div style="font-size: 0.75rem; text-transform: uppercase;">Range</div>
              <div style="font-size: 1.1rem; font-weight: 600; color: var(--text);">${c.lowest_rating || "—"} - ${c.highest_rating || "—"}</div>
            </div>
            <div class="fb-row-stats">
              <div style="font-size: 0.75rem; text-transform: uppercase;">Average</div>
              <div class="fb-row-rating" style="margin-top: -2px;">${c.average_rating ? Number(c.average_rating).toFixed(1) : "—"}</div>
            </div>
          </div>
        </div>
      `,
      )
      .join("");
  }

  // ── Comments (now show course name) ──
  const commentEl = document.getElementById("commentsList");
  if (comments.length === 0) {
    commentEl.innerHTML = '<p class="empty-msg">No comments yet.</p>';
  } else {
    commentEl.innerHTML = comments
      .map(
        (c) => `
        <div class="review-card">
          <div class="review-header">
            <span class="review-course">${escHtml(c.course_name)}</span>
            <span class="review-date">${new Date(c.feedback_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <div class="review-stars">${"★".repeat(c.rating)}${"☆".repeat(5 - c.rating)}</div>
          <div class="review-comment">${escHtml(c.comment)}</div>
        </div>
      `,
      )
      .join("");
  }
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
loadSummary();
