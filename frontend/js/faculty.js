// js/faculty.js - Faculty dashboard logic
const API = "http://localhost:5000";

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
      <div class="stat-label">Total Feedback Received</div>
    </div>
    <div class="stat-card green">
      <div class="stat-value">${avgAll}</div>
      <div class="stat-label">Overall Avg Rating</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-value">${summary.length}</div>
      <div class="stat-label">Courses</div>
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
      <div class="course-stat">
        <div class="course-stat-name">${escHtml(c.course_name)}</div>
        <div class="course-stat-info">
          <div class="mini-stat">
            <div class="val">${c.total_feedback || 0}</div>
            <div class="lbl">Responses</div>
          </div>
          <div class="mini-stat">
            <div class="val">${c.average_rating || "—"}</div>
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
          <span>Course ID: ${c.course_id}</span>
          <span>${new Date(c.feedback_date).toLocaleDateString()} &nbsp;|&nbsp; Rating: ${"★".repeat(c.rating)}${"☆".repeat(5 - c.rating)}</span>
        </div>
        <div class="comment-text">${escHtml(c.comment)}</div>
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
