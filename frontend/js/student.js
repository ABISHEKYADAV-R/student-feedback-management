// js/student.js - Student dashboard logic (enhanced UI)
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
const API = isLocalhost ? "http://localhost:5002" : window.location.origin;

// ─── Auth guard ───────────────────────────────────────────────
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user || user.role !== "student") {
  window.location.href = "index.html";
}

document.getElementById("navUser").textContent = `Hello, ${user.name}`;

// Populate mobile nav
const mobileAvatar = document.getElementById("mobileAvatar");
const mobileUserName = document.getElementById("mobileUserName");
if (mobileAvatar) mobileAvatar.textContent = (user.name || "S").charAt(0).toUpperCase();
if (mobileUserName) mobileUserName.textContent = user.name || "Student";

// Populate welcome title
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
    const tabEl = document.getElementById(`tab-${btn.dataset.tab}`);
    tabEl.classList.add("active");
    
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

// ─── Load categories into dropdown ────────────────────────────
async function loadCategories() {
  const data = await api("GET", "/student/categories");
  if (!data.categories) return;
  const opts = data.categories
    .map((c) => `<option value="${escHtml(c)}">${escHtml(c)}</option>`)
    .join("");
  document.getElementById("fb_category").innerHTML =
    '<option value="">-- Select a category (optional) --</option>' + opts;
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
  // Touch support
  star.addEventListener("touchstart", (e) => {
    e.preventDefault();
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
    const category = document.getElementById("fb_category").value;

    if (!course_id)
      return showInline(msgEl, "Please select a course.", "error");
    if (!rating)
      return showInline(msgEl, "Please select a star rating.", "error");

    btn.disabled = true;
    btn.classList.add("btn-loading");

    const data = await api("POST", "/student/feedback", {
      course_id: parseInt(course_id),
      rating: parseInt(rating),
      comment,
      category: category || undefined,
    });

    btn.disabled = false;
    btn.classList.remove("btn-loading");

    if (data.success) {
      showToast(data.message, "success");
      msgEl.classList.add("hidden");
      this.reset();
      selectedRating = 0;
      highlightStars(0);
      document.getElementById("starHint").textContent = "Click a star to rate";
    } else {
      showToast(data.message, "error");
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
    btn.classList.add("btn-loading");

    const data = await api("POST", "/student/suggestion", {
      course_id: parseInt(course_id),
      suggestion,
    });

    btn.disabled = false;
    btn.classList.remove("btn-loading");

    if (data.success) {
      showToast(data.message, "success");
      msgEl.classList.add("hidden");
      this.reset();
    } else {
      showToast(data.message, "error");
      showInline(msgEl, data.message, "error");
    }
  });

// ─── Load Improvements ────────────────────────────────────────
async function loadImprovements() {
  const el = document.getElementById("improvementsList");
  el.innerHTML = skeletonComments(3);

  const data = await api("GET", "/student/improvements");

  if (!data.improvements || data.improvements.length === 0) {
    el.innerHTML = emptyState("No Improvements Yet", "Once administration takes action on feedback, improvements will appear here.");
    return;
  }

  el.innerHTML = data.improvements
    .map(
      (imp, i) => `
      <div class="improvement-item animate-in" style="animation-delay:${i * 0.06}s">
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

// ─── Init ─────────────────────────────────────────────────────
loadCourses();
loadCategories();
