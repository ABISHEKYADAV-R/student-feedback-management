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
      <div class="stat-value" style="display:flex; justify-content:space-between; align-items:flex-start;">
        ${totalFeedback}
        <span style="font-size:2rem; opacity:0.2;">📊</span>
      </div>
      <div class="stat-label">Total Feedback</div>
    </div>
    <div class="stat-card green">
      <div class="stat-value" style="display:flex; justify-content:space-between; align-items:flex-start;">
        ${avgAll}
        <span style="font-size:2rem; opacity:0.2;">⭐</span>
      </div>
      <div class="stat-label">Avg Rating</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-value" style="display:flex; justify-content: space-between; align-items:flex-start;">
        ${summary.length}
        <span style="font-size:2rem; opacity:0.2;">📚</span>
      </div>
      <div class="stat-label">Courses</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="display:flex; justify-content: space-between; align-items:flex-start;">
        ${comments.length}
        <span style="font-size:2rem; opacity:0.2;">💬</span>
      </div>
      <div class="stat-label">Comments</div>
    </div>
  `;

  // ── Render Chart.js ──
  renderChart(data.distribution || summary);

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

  // ── Comments (now show course name) ──
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
            <span>${new Date(c.feedback_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} &nbsp;|&nbsp; ${"★".repeat(c.rating)}${"☆".repeat(5 - c.rating)}</span>
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

let ratingChartInstance = null;
function renderChart(summaryData) {
  const ctx = document.getElementById('ratingChart');
  if(!ctx) return;
  
  // Calculate distribution (mocking from summary averages if real distribution isn't available)
  let distribution = [0, 0, 0, 0, 0];
  
  if (Array.isArray(summaryData)) {
    summaryData.forEach(c => {
      // Basic grouping based on average rating if detailed distribution isn't provided by backend
      const avg = Math.round(Number(c.average_rating || 0));
      if(avg > 0 && avg <= 5) distribution[avg - 1] += Number(c.total_feedback || 0);
    });
  }
  
  if (ratingChartInstance) ratingChartInstance.destroy();

  ratingChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      datasets: [{
        label: 'Feedback Count',
        data: distribution,
        backgroundColor: [
          '#ef4444', // 1 star red
          '#f97316', // 2 star orange
          '#eab308', // 3 star yellow
          '#84cc16', // 4 star lime
          '#22c55e'  // 5 star green
        ],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { 
          beginAtZero: true,
          ticks: { stepSize: 1, color: "var(--text-muted)" },
          grid: { color: "var(--border)" }
        },
        x: {
          ticks: { color: "var(--text-muted)" },
          grid: { display: false }
        }
      }
    }
  });
}

// ─── Init ─────────────────────────────────────────────────────
loadSummary();
