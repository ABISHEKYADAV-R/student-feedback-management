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

// ─── Local startup only (Vercel serverless imports app as a handler) ──────────
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5002;

  function startServer(port) {
    const server = app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
      console.log(`   Frontend: http://localhost:${port}`);
      console.log(`   API:      http://localhost:${port}/api/health`);
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`⚠️  Port ${port} is in use, trying port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error("❌ Server error:", err.message);
        process.exit(1);
      }
    });
  }

  startServer(PORT);
}

module.exports = app;
