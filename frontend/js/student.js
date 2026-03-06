// js/student.js - Student dashboard logic
const API = "http://localhost:5000";

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
  const opts = data.courses
    ? data.courses
        .map(
          (c) =>
            `<option value="${c.course_id}">${c.course_name} (${c.faculty_name || "No faculty"})</option>`,
        )
        .join("")
    : '<option value="">No courses available</option>';

  document.getElementById("fb_course").innerHTML =
    '<option value="">-- Select a course --</option>' + opts;
  document.getElementById("sg_course").innerHTML =
    '<option value="">-- Select a course --</option>' + opts;
}

// ─── Star rating ──────────────────────────────────────────────
let selectedRating = 0;

document.querySelectorAll(".star").forEach((star) => {
  star.addEventListener("mouseenter", () => highlightStars(star.dataset.val));
  star.addEventListener("mouseleave", () => highlightStars(selectedRating));
  star.addEventListener("click", () => {
    selectedRating = parseInt(star.dataset.val);
    document.getElementById("fb_rating").value = selectedRating;
    highlightStars(selectedRating);
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
    const course_id = document.getElementById("fb_course").value;
    const rating = document.getElementById("fb_rating").value;
    const comment = document.getElementById("fb_comment").value.trim();

    if (!course_id) return showMsg(msgEl, "Please select a course.", "error");
    if (!rating) return showMsg(msgEl, "Please select a rating.", "error");

    const data = await api("POST", "/student/feedback", {
      course_id: parseInt(course_id),
      rating: parseInt(rating),
      comment,
    });

    if (data.success) {
      showMsg(msgEl, data.message, "success");
      this.reset();
      selectedRating = 0;
      highlightStars(0);
    } else {
      showMsg(msgEl, data.message, "error");
    }
  });

// ─── Submit Suggestion ────────────────────────────────────────
document
  .getElementById("suggestionForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const msgEl = document.getElementById("sgMsg");
    const course_id = document.getElementById("sg_course").value;
    const suggestion = document.getElementById("sg_text").value.trim();

    if (!course_id) return showMsg(msgEl, "Please select a course.", "error");
    if (!suggestion)
      return showMsg(msgEl, "Please enter a suggestion.", "error");

    const data = await api("POST", "/student/suggestion", {
      course_id: parseInt(course_id),
      suggestion,
    });

    if (data.success) {
      showMsg(msgEl, data.message, "success");
      this.reset();
    } else {
      showMsg(msgEl, data.message, "error");
    }
  });

// ─── Load Improvements ────────────────────────────────────────
async function loadImprovements() {
  const el = document.getElementById("improvementsList");
  el.innerHTML = '<p class="loading">Loading...</p>';

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
      <p class="improvement-meta">${new Date(imp.created_at).toLocaleDateString()}</p>
    </div>
  `,
    )
    .join("");
}

// ─── Helpers ──────────────────────────────────────────────────
function showMsg(el, msg, type) {
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
