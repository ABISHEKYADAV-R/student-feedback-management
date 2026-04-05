// js/faculty.js - Faculty dashboard logic (enhanced UI)
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
const API = isLocalhost ? "http://localhost:5002" : window.location.origin;

// ─── Auth guard ───────────────────────────────────────────────
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user || user.role !== "faculty") {
  window.location.href = "index.html";
}

document.getElementById("navUser").textContent = `Hello, ${user.name}`;

// Populate mobile nav
const mobileAvatar = document.getElementById("mobileAvatar");
const mobileUserName = document.getElementById("mobileUserName");
if (mobileAvatar) mobileAvatar.textContent = (user.name || "F").charAt(0).toUpperCase();
if (mobileUserName) mobileUserName.textContent = user.name || "Faculty";

// Welcome title
const welcomeTitle = document.getElementById("welcomeTitle");
if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${user.name.split(" ")[0]}!`;

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

// ─── Init skeleton loaders ────────────────────────────────────
function showSkeletons() {
  const summaryEl = document.getElementById("summaryCards");
  if (summaryEl) summaryEl.innerHTML = skeletonStatCards(4);

  const quickSummaryEl = document.getElementById("quickSummary");
  if (quickSummaryEl) quickSummaryEl.innerHTML = `
    <div class="skeleton skeleton-text long"></div>
    <div class="skeleton skeleton-text medium"></div>
    <div class="skeleton skeleton-text short"></div>
    <div class="skeleton skeleton-text long" style="margin-top:12px"></div>
    <div class="skeleton skeleton-text medium"></div>
  `;

  const commentsEl = document.getElementById("commentsList");
  if (commentsEl) commentsEl.innerHTML = skeletonComments(3);
}

// ─── Rating Distribution Chart ────────────────────────────────
let ratingChartInstance = null;

function renderRatingChart(ratingDist) {
  if (!ratingDist || ratingDist.length === 0) {
    const wrapper = document.getElementById("ratingChartWrapper");
    if (wrapper) wrapper.innerHTML = emptyState("No Rating Data", "Ratings will appear once students submit feedback.");
    return;
  }

  const starCounts = [1, 2, 3, 4, 5].map((star) => {
    const found = ratingDist.find((r) => r.rating === star);
    return found ? Number(found.count) : 0;
  });

  const ctx = document.getElementById("ratingChart");
  if (!ctx) return;
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
      animation: {
        animateRotate: true,
        duration: 800,
        easing: "easeOutQuart",
      },
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

// ─── Quick Summary ────────────────────────────────────────────
async function loadQuickSummary() {
  const el = document.getElementById("quickSummary");
  const data = await api("GET", "/faculty/quick-summary");

  if (data.success && data.quickSummary) {
    const lines = data.quickSummary.split("\n").filter((l) => l.trim());
    el.innerHTML = lines
      .map((line) => `<p style="margin-bottom: 6px; font-size: 0.9rem; line-height: 1.6; color: var(--text);">${escHtml(line)}</p>`)
      .join("");
  } else {
    el.innerHTML = emptyState("No Summary", "Summary will appear once feedback data is available.");
  }
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

  // ── Summary stat cards (staggered) ──
  const totalFeedback = summary.reduce((s, c) => s + Number(c.total_feedback), 0);
  const avgAll = summary.length
    ? (summary.reduce((s, c) => s + Number(c.average_rating || 0), 0) / summary.length).toFixed(2)
    : "N/A";

  const summaryEl = document.getElementById("summaryCards");
  summaryEl.innerHTML = `
    <div class="stat-card blue animate-in" style="animation-delay:0s">
      <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
      <div class="stat-value">${totalFeedback}</div>
      <div class="stat-label">Total Feedback</div>
    </div>
    <div class="stat-card green animate-in" style="animation-delay:0.06s">
      <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      <div class="stat-value">${avgAll}</div>
      <div class="stat-label">Avg Rating</div>
    </div>
    <div class="stat-card orange animate-in" style="animation-delay:0.12s">
      <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg></div>
      <div class="stat-value">${summary.length}</div>
      <div class="stat-label">Courses</div>
    </div>
    <div class="stat-card animate-in" style="animation-delay:0.18s">
      <div class="stat-icon" style="background: var(--primary-light); color: var(--primary);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
      <div class="stat-value">${comments.length}</div>
      <div class="stat-label">Comments</div>
    </div>
  `;

  // ── Rating Distribution Chart ──
  renderRatingChart(data.ratingDistribution);

  // ── Per-course detail (staggered) ──
  const courseEl = document.getElementById("courseCards");
  if (summary.length === 0) {
    document.getElementById("noDataMsg").textContent = "No courses assigned yet.";
    courseEl.innerHTML = "";
  } else {
    document.getElementById("noDataMsg").style.display = "none";
    courseEl.innerHTML = summary
      .map(
        (c, i) => `
        <div class="course-stat animate-in" style="animation-delay:${i * 0.06}s">
          <div class="course-stat-name">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            ${escHtml(c.course_name)}
          </div>
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

  // ── Comments (staggered) ──
  const commentEl = document.getElementById("commentsList");
  if (comments.length === 0) {
    commentEl.innerHTML = emptyState("No Comments Yet", "Student comments will appear here once feedback is submitted.");
  } else {
    commentEl.innerHTML = comments
      .map(
        (c, i) => `
        <div class="comment-item animate-in" style="animation-delay:${i * 0.04}s">
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

// ─── Init ─────────────────────────────────────────────────────
showSkeletons();
loadSummary();
loadQuickSummary();
