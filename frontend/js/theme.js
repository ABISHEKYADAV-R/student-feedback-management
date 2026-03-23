// js/theme.js - Global Theme Manager
(function() {
  const PREF_KEY = "feedback_theme_pref";
  const LIGHT = "light";
  const DARK = "dark";

  // Check LocalStorage or system preference
  function getPreferredTheme() {
    const stored = localStorage.getItem(PREF_KEY);
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK : LIGHT;
  }

  function applyTheme(theme) {
    if (theme === DARK) {
      document.documentElement.classList.add("dark-theme");
    } else {
      document.documentElement.classList.remove("dark-theme");
    }
  }

  function toggleTheme() {
    const current = document.documentElement.classList.contains("dark-theme") ? DARK : LIGHT;
    const next = current === DARK ? LIGHT : DARK;
    applyTheme(next);
    localStorage.setItem(PREF_KEY, next);
    updateIcons(next);
  }

  function updateIcons(theme) {
    document.querySelectorAll(".theme-toggle .icon").forEach(icon => {
      icon.innerHTML = theme === DARK ? "☀️" : "🌙";
    });
  }

  // Initial load
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // Setup button listener after DOM loads
  window.addEventListener("DOMContentLoaded", () => {
    updateIcons(initialTheme);
    document.querySelectorAll(".theme-toggle").forEach(btn => {
      btn.addEventListener("click", toggleTheme);
    });
  });

  // Expose globally
  window.toggleTheme = toggleTheme;
})();
