// js/utils.js — Shared utilities: toast system, skeleton loaders, hamburger menu
// Must be loaded BEFORE dashboard-specific scripts

(function () {
  "use strict";

  // ─── Enhanced Toast Notification System ────────────────────────
  const MAX_TOASTS = 4;
  const TOAST_DURATION = 4000;

  const toastIcons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  };

  const toastTitles = {
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Info",
  };

  function getToastContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      container.id = "toastContainer";
      document.body.appendChild(container);
    }
    return container;
  }

  window.showToast = function (msg, type = "success", duration = TOAST_DURATION) {
    const container = getToastContainer();

    // Limit visible toasts
    const existing = container.querySelectorAll(".toast:not(.exiting)");
    if (existing.length >= MAX_TOASTS) {
      dismissToast(existing[0]);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
      <span class="toast-icon">${toastIcons[type] || toastIcons.info}</span>
      <div class="toast-body">
        <div class="toast-title">${toastTitles[type] || "Notice"}</div>
        <div class="toast-message">${escHtml(msg)}</div>
      </div>
      <button class="toast-close" title="Dismiss">&times;</button>
      <div class="toast-progress" style="width: 100%"></div>
    `;

    container.appendChild(toast);

    // Progress bar countdown
    const progress = toast.querySelector(".toast-progress");
    const startTime = Date.now();
    let animFrame;

    function updateProgress() {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1 - elapsed / duration);
      progress.style.width = (remaining * 100) + "%";
      if (remaining > 0) {
        animFrame = requestAnimationFrame(updateProgress);
      }
    }
    animFrame = requestAnimationFrame(updateProgress);

    // Click-to-dismiss
    toast.querySelector(".toast-close").addEventListener("click", (e) => {
      e.stopPropagation();
      cancelAnimationFrame(animFrame);
      dismissToast(toast);
    });

    toast.addEventListener("click", () => {
      cancelAnimationFrame(animFrame);
      dismissToast(toast);
    });

    // Auto-dismiss
    const timer = setTimeout(() => {
      cancelAnimationFrame(animFrame);
      dismissToast(toast);
    }, duration);

    // Pause on hover
    toast.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrame);
      progress.style.width = progress.style.width; // freeze
    });

    toast.addEventListener("mouseleave", () => {
      // Resume with remaining time
      const currentWidth = parseFloat(progress.style.width) / 100;
      const remainingTime = currentWidth * duration;
      const resumeStart = Date.now();

      function resumeProgress() {
        const elapsed = Date.now() - resumeStart;
        const remaining = Math.max(0, currentWidth - (elapsed / duration));
        progress.style.width = (remaining * 100) + "%";
        if (remaining > 0) {
          animFrame = requestAnimationFrame(resumeProgress);
        }
      }
      animFrame = requestAnimationFrame(resumeProgress);

      setTimeout(() => {
        cancelAnimationFrame(animFrame);
        dismissToast(toast);
      }, remainingTime);
    });
  };

  function dismissToast(toast) {
    if (toast.classList.contains("exiting")) return;
    toast.classList.add("exiting");
    setTimeout(() => toast.remove(), 350);
  }

  // ─── Skeleton Loader Helpers ──────────────────────────────────

  window.skeletonStatCards = function (count = 4) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-stat-card animate-in" style="animation-delay:${i * 0.06}s">
          <div class="skeleton skeleton-stat-value"></div>
          <div class="skeleton skeleton-stat-label"></div>
        </div>`;
    }
    return html;
  };

  window.skeletonTableRows = function (rows = 5, cols = 4) {
    let html = "";
    for (let r = 0; r < rows; r++) {
      html += `<div class="skeleton-table-row" style="animation-delay:${r * 0.04}s">`;
      for (let c = 0; c < cols; c++) {
        html += `<div class="skeleton skeleton-table-cell"></div>`;
      }
      html += "</div>";
    }
    return html;
  };

  window.skeletonComments = function (count = 3) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-comment animate-in" style="animation-delay:${i * 0.08}s">
          <div class="skeleton skeleton-text short" style="margin-bottom:12px"></div>
          <div class="skeleton skeleton-text long"></div>
          <div class="skeleton skeleton-text medium"></div>
        </div>`;
    }
    return html;
  };

  window.skeletonChart = function () {
    return `<div class="skeleton skeleton-chart animate-in"></div>`;
  };

  // ─── Empty State Generator ────────────────────────────────────
  window.emptyState = function (title, text) {
    return `
      <div class="empty-state animate-in">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <div class="empty-state-title">${escHtml(title)}</div>
        <div class="empty-state-text">${escHtml(text)}</div>
      </div>`;
  };

  // ─── Hamburger Menu Logic ─────────────────────────────────────
  window.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector(".hamburger-btn");
    const overlay = document.querySelector(".mobile-nav-overlay");
    const menu = document.querySelector(".mobile-nav-menu");

    if (hamburger && overlay && menu) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        overlay.classList.toggle("active");
        menu.classList.toggle("active");
        document.body.style.overflow = menu.classList.contains("active") ? "hidden" : "";
      });

      overlay.addEventListener("click", () => {
        hamburger.classList.remove("active");
        overlay.classList.remove("active");
        menu.classList.remove("active");
        document.body.style.overflow = "";
      });

      // Close on escape
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menu.classList.contains("active")) {
          hamburger.classList.remove("active");
          overlay.classList.remove("active");
          menu.classList.remove("active");
          document.body.style.overflow = "";
        }
      });
    }
  });

  // ─── Shared Helpers ───────────────────────────────────────────
  window.escHtml = function (str) {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Stagger animation for dynamically added children
  window.animateChildren = function (parentEl) {
    if (!parentEl) return;
    const children = parentEl.children;
    for (let i = 0; i < children.length; i++) {
      children[i].style.animation = "none";
      children[i].offsetHeight; // reflow
      children[i].style.animation = `fadeInUp 0.4s ease-out ${i * 0.06}s both`;
    }
  };

})();
