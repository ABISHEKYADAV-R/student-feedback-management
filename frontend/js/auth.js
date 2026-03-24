// js/auth.js - Login page logic
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
const API = isLocalhost ? "http://localhost:5002" : window.location.origin;

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

// ─── UI Transitions for Role Selection ────────────────────────
const roleSelection = document.getElementById("roleSelection");
const loginSection = document.getElementById("loginSection");
const roleInput = document.getElementById("role");
const loginRoleTitle = document.getElementById("loginRoleTitle");
const loginRoleIcon = document.getElementById("loginRoleIcon");
const demoCredentialsList = document.getElementById("demoCredentialsList");

function selectRole(role) {
  roleInput.value = role;
  
  // Set UI elements based on role
  if (role === 'student') {
    loginRoleTitle.textContent = "Student Login";
    loginRoleIcon.innerHTML = "&#127891;";
    demoCredentialsList.innerHTML = `<span class="cred-item">ram@student.com / student123</span>`;
  } else if (role === 'faculty') {
    loginRoleTitle.textContent = "Faculty Login";
    loginRoleIcon.innerHTML = "&#128104;&#8205;&#127979;";
    demoCredentialsList.innerHTML = `<span class="cred-item">smith@college.com / faculty123</span>`;
  } else if (role === 'admin') {
    loginRoleTitle.textContent = "Admin Login";
    loginRoleIcon.innerHTML = "&#128187;";
    demoCredentialsList.innerHTML = `<span class="cred-item">admin@college.com / admin123</span>`;
  }

  // Hide selection, show form
  roleSelection.style.display = "none";
  loginSection.style.display = "block";
  
  // Clear previous errors/inputs
  document.getElementById("loginError").classList.add("hidden");
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  
  // Quick fade-in animation
  loginSection.style.animation = "none";
  loginSection.offsetHeight; /* trigger reflow */
  loginSection.style.animation = null;
}

function showRoleSelection() {
  loginSection.style.display = "none";
  roleSelection.style.display = "grid";
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
    btn.classList.add("btn-loading");

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!data.success) {
        showError(errEl, data.message || "Invalid credentials or role mismatch.");
        return;
      }

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      const userRole = data.user.role;
      if (userRole === "admin") window.location.href = "admin-dashboard.html";
      else if (userRole === "faculty")
        window.location.href = "faculty-dashboard.html";
      else window.location.href = "student-dashboard.html";
    } catch (err) {
      showError(errEl, "Could not connect to server. Is the backend running?");
    } finally {
      btn.disabled = false;
      btn.classList.remove("btn-loading");
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
