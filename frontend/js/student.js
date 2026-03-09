// js/student.js - Student dashboard logic
const API = (window.location.protocol === "file:" || window.location.origin === "null") ? "http://localhost:5002" : window.location.origin;

// ─── Auth guard ───────────────────────────────────────────────
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user || user.role !== "student") {
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
    if (btn.dataset.tab === "improvements") loadImprovements();
  });
});

// ─── Load courses into dropdowns ──────────────────────────────
async function loadCourses() {
  const data = await api("GET", "/student/courses");
  const opts =
    data.courses && data.courses.length
      ? data.courses
          .map(
            (c) =>
              `<option value="${c.course_id}">${escHtml(c.course_name)}${c.faculty_name ? " — " + escHtml(c.faculty_name) : ""}</option>`,
          )
          .join("")
      : '<option value="" disabled>No courses available</option>';

  const prefix = '<option value="">-- Select a course --</option>';
  document.getElementById("fb_course").innerHTML = prefix + opts;
  document.getElementById("sg_course").innerHTML = prefix + opts;
}

// ─── Star rating ──────────────────────────────────────────────
let selectedRating = 0;
const starLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

document.querySelectorAll(".star").forEach((star) => {
  star.addEventListener("mouseenter", () => {
    highlightStars(star.dataset.val);
    document.getElementById("starHint").textContent =
      starLabels[star.dataset.val] || "";
  });
  star.addEventListener("mouseleave", () => {
    highlightStars(selectedRating);
    document.getElementById("starHint").textContent = selectedRating
      ? starLabels[selectedRating]
      : "Click a star to rate";
  });
  star.addEventListener("click", () => {
    selectedRating = parseInt(star.dataset.val);
    document.getElementById("fb_rating").value = selectedRating;
    highlightStars(selectedRating);
    document.getElementById("starHint").textContent =
      starLabels[selectedRating];
  });
});

function highlightStars(val) {
  document.querySelectorAll(".star").forEach((s) => {
    s.classList.toggle("active", parseInt(s.dataset.val) <= val);
  });
}

// ─── Submit Feedback ──────────────────────────────────────────
document
  .getElementById("feedbackForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const msgEl = document.getElementById("fbMsg");
    const btn = document.getElementById("fbBtn");
    const course_id = document.getElementById("fb_course").value;
    const rating = document.getElementById("fb_rating").value;
    const comment = document.getElementById("fb_comment").value.trim();

    if (!course_id)
      return showInline(msgEl, "Please select a course.", "error");
    if (!rating)
      return showInline(msgEl, "Please select a star rating.", "error");

    btn.disabled = true;
    btn.textContent = "Submitting...";

    const data = await api("POST", "/student/feedback", {
      course_id: parseInt(course_id),
      rating: parseInt(rating),
      comment,
    });

    btn.disabled = false;
    btn.innerHTML = "&#128274; Submit Anonymously";

    if (data.success) {
      showToast(data.message, "success");
      msgEl.classList.add("hidden");
      this.reset();
      selectedRating = 0;
      highlightStars(0);
      document.getElementById("starHint").textContent = "Click a star to rate";
    } else {
      showInline(msgEl, data.message, "error");
    }
  });

// ─── Submit Suggestion ────────────────────────────────────────
document
  .getElementById("suggestionForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const msgEl = document.getElementById("sgMsg");
    const btn = document.getElementById("sgBtn");
    const course_id = document.getElementById("sg_course").value;
    const suggestion = document.getElementById("sg_text").value.trim();

    if (!course_id)
      return showInline(msgEl, "Please select a course.", "error");
    if (!suggestion)
      return showInline(msgEl, "Please enter a suggestion.", "error");

    btn.disabled = true;
    btn.textContent = "Submitting...";

    const data = await api("POST", "/student/suggestion", {
      course_id: parseInt(course_id),
      suggestion,
    });

    btn.disabled = false;
    btn.innerHTML = "&#128274; Submit Anonymously";

    if (data.success) {
      showToast(data.message, "success");
      msgEl.classList.add("hidden");
      this.reset();
    } else {
      showInline(msgEl, data.message, "error");
    }
  });

// ─── Load Improvements ────────────────────────────────────────
async function loadImprovements() {
  const el = document.getElementById("improvementsList");
  el.innerHTML =
    '<p class="loading"><span class="spinner"></span> Loading...</p>';

  const data = await api("GET", "/student/improvements");

  if (!data.improvements || data.improvements.length === 0) {
    el.innerHTML = '<p class="empty-msg">No improvements recorded yet.</p>';
    return;
  }

  el.innerHTML = data.improvements
    .map(
      (imp) => `
      <div class="improvement-item">
        <h4>${escHtml(imp.course_name)}</h4>
        <p><strong>Issue:</strong> ${escHtml(imp.issue_description)}</p>
        <p><strong>Action taken:</strong> ${escHtml(imp.action_taken)}</p>
        <p class="improvement-meta">Resolved on ${new Date(imp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
      </div>
    `,
    )
    .join("");
}

// ─── Helpers ─────────────────────────────────────────────────
function showInline(el, msg, type) {
  el.textContent = msg;
  el.className = `alert alert-${type === "error" ? "error" : "success"}`;
  setTimeout(() => el.classList.add("hidden"), 4000);
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
loadCourses();
