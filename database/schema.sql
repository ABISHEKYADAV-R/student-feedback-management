-- Smart Student Feedback System - Database Schema (SQLite)
-- This will run on first server boot if database.sqlite is empty

-- Users table (students, faculty, admin)
CREATE TABLE IF NOT EXISTS users (
    user_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('student', 'faculty', 'admin')),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    course_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    faculty_id  INTEGER,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Feedback table (anonymous)
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id     INTEGER NOT NULL,
    rating        INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment       TEXT,
    feedback_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Actions table (admin records actions taken on feedback issues)
CREATE TABLE IF NOT EXISTS actions (
    action_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id         INTEGER NOT NULL,
    issue_description TEXT NOT NULL,
    action_taken      TEXT NOT NULL,
    status            TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'resolved')),
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Suggestions table (anonymous student suggestions)
CREATE TABLE IF NOT EXISTS suggestions (
    suggestion_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id     INTEGER NOT NULL,
    suggestion    TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- Seed data - sample users, courses, feedback
-- -------------------------------------------------------

-- Default admin (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User',    'admin@college.com',   '$2a$10$Oe5lfjLg5TxUmrS982mseun85KQ7acMIh/KhsgIY5MMB0HIGbbLCS', 'admin'),
('Dr. Smith',     'smith@college.com',   '$2a$10$kgdlXj4U.6yWMCRQ6DAE5.BA8mXgHdjG/5.wq1wwP9u/o8zIKQs/S', 'faculty'),
('Dr. Johnson',   'johnson@college.com', '$2a$10$kgdlXj4U.6yWMCRQ6DAE5.BA8mXgHdjG/5.wq1wwP9u/o8zIKQs/S', 'faculty'),
('Ramu Student', 'ram@student.com',   '$2a$10$viqbx1E33C3y9arYORODsep0G0Koy83ipVWstNiCghr8y0aMJmNJu', 'student'),
('Bob Student',   'bob@student.com',     '$2a$10$viqbx1E33C3y9arYORODsep0G0Koy83ipVWstNiCghr8y0aMJmNJu', 'student');

INSERT INTO courses (course_name, faculty_id) VALUES
('Mathematics 101',   2),
('Physics 201',       2),
('Data Structures',   3),
('Web Development',   3);
