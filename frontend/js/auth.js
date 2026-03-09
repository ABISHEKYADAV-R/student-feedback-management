// js/auth.js - Login page logic
const API = (window.location.protocol === "file:" || window.location.origin === "null") ? "http://localhost:5002" : window.location.origin;

// ─── Password show/hide toggle ────────────────────────────────
const toggleBtn = document.getElementById("togglePwd");
const pwdInput = document.getElementById("password");
if (toggleBtn && pwdInput) {
  toggleBtn.addEventListener("click", () => {
    const isText = pwdInput.type === "text";
    pwdInput.type = isText ? "password" : "text";
    toggleBtn.textContent = isText ? "👁" : "🙈";
  });
}

// ─── Login form ───────────────────────────────────────────────
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;
    const errEl = document.getElementById("loginError");
    const btn = document.getElementById("loginBtn");

    errEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Logging in...";
    if (!role) {
      showError(errEl, "Please select your role.");
      btn.disabled = false;
      btn.textContent = "Login";
      return;
    }

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!data.success) {
        showError(errEl, data.message || "Login failed.");
        return;
      }

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      const role = data.user.role;
      if (role === "admin") window.location.href = "admin-dashboard.html";
      else if (role === "faculty")
        window.location.href = "faculty-dashboard.html";
      else window.location.href = "student-dashboard.html";
    } catch (err) {
      showError(errEl, "Could not connect to server. Is the backend running?");
    } finally {
      btn.disabled = false;
      btn.textContent = "Login";
    }
  });

function showError(el, msg) {
  el.textContent = msg;
  el.className = "alert alert-error";
}

// ─── Redirect if already logged in ───────────────────────────
(function checkExisting() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (token && user) {
    if (user.role === "admin") window.location.href = "admin-dashboard.html";
    else if (user.role === "faculty")
      window.location.href = "faculty-dashboard.html";
    else window.location.href = "student-dashboard.html";
  }
})();
