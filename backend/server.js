// server.js - Main Express application entry point
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ─── API Routes ───────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const facultyRoutes = require("./routes/faculty");
const adminRoutes = require("./routes/admin");

app.use("/", authRoutes); // POST /login, POST /register
app.use("/student", studentRoutes); // /student/*
app.use("/faculty", facultyRoutes); // /faculty/*
app.use("/admin", adminRoutes); // /admin/*

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Smart Student Feedback System API is running.",
  });
});

// ─── Catch-all: serve frontend for any unmatched route ────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// ─── Start server ─────────────────────────────────────────────────────────────
const initDb = require("./config/initDb");

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5002;
  (async () => {
    try {
      await initDb();
      app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error("❌ Database initialization failed:", err.message);
    }
  })();
} else {
  // On Vercel, simply initialize the connection check
  initDb().catch(err => console.error("❌ DB connection failed:", err.message));
}

module.exports = app;
