// config/initDb.js
// Auto-creates the database, all tables, and seeds default users/courses
// Called once at server startup; safe to run multiple times (IF NOT EXISTS / INSERT IGNORE).

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function initDb() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const dbName = process.env.DB_NAME || "student_feedback_db";

  // Connect WITHOUT specifying a database so we can create it
  const conn = await mysql.createConnection({ host, port, user, password });

  // ── Create database ──────────────────────────────────────────────────────
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await conn.query(`USE \`${dbName}\``);

  // ── Create tables ────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id    INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      email      VARCHAR(100) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      role       ENUM('student','faculty','admin') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS courses (
      course_id   INT AUTO_INCREMENT PRIMARY KEY,
      course_name VARCHAR(150) NOT NULL,
      faculty_id  INT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (faculty_id) REFERENCES users(user_id) ON DELETE SET NULL
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      feedback_id   INT AUTO_INCREMENT PRIMARY KEY,
      course_id     INT NOT NULL,
      rating        TINYINT NOT NULL,
      comment       TEXT,
      feedback_date DATE NOT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS actions (
      action_id         INT AUTO_INCREMENT PRIMARY KEY,
      course_id         INT NOT NULL,
      issue_description TEXT NOT NULL,
      action_taken      TEXT NOT NULL,
      status            ENUM('pending','in-progress','resolved') DEFAULT 'pending',
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS suggestions (
      suggestion_id INT AUTO_INCREMENT PRIMARY KEY,
      course_id     INT NOT NULL,
      suggestion    TEXT NOT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
    )
  `);

  // ── Seed default users (INSERT IGNORE — skips if email already exists) ───
  const defaultUsers = [
    {
      name: "Admin User",
      email: "admin@college.com",
      password: "admin123",
      role: "admin",
    },
    {
      name: "Dr. Smith",
      email: "smith@college.com",
      password: "faculty123",
      role: "faculty",
    },
    {
      name: "Dr. Johnson",
      email: "johnson@college.com",
      password: "faculty123",
      role: "faculty",
    },
    {
      name: "Alice Student",
      email: "alice@student.com",
      password: "student123",
      role: "student",
    },
    {
      name: "Bob Student",
      email: "bob@student.com",
      password: "student123",
      role: "student",
    },
  ];

  for (const u of defaultUsers) {
    const hashed = await bcrypt.hash(u.password, 10);
    await conn.query(
      `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      [u.name, u.email, hashed, u.role],
    );
  }

  // ── Seed courses (only if courses table is empty) ────────────────────────
  const [[{ cnt }]] = await conn.query("SELECT COUNT(*) AS cnt FROM courses");
  if (cnt === 0) {
    const [[smith]] = await conn.query(
      "SELECT user_id FROM users WHERE email = 'smith@college.com'",
    );
    const [[johnson]] = await conn.query(
      "SELECT user_id FROM users WHERE email = 'johnson@college.com'",
    );

    if (smith && johnson) {
      const courses = [
        ["Mathematics 101", smith.user_id],
        ["Physics 201", smith.user_id],
        ["Data Structures", johnson.user_id],
        ["Web Development", johnson.user_id],
      ];
      for (const [name, fid] of courses) {
        await conn.query(
          "INSERT INTO courses (course_name, faculty_id) VALUES (?, ?)",
          [name, fid],
        );
      }
    }
  }

  await conn.end();
  console.log(`✅ Database "${dbName}" ready.`);
}

module.exports = initDb;
