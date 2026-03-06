-- Smart Student Feedback System - Database Schema
-- Run this file in MySQL to set up the database

CREATE DATABASE IF NOT EXISTS student_feedback_db;
USE student_feedback_db;

-- Users table (students, faculty, admin)
CREATE TABLE IF NOT EXISTS users (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('student', 'faculty', 'admin') NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    course_id   INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL,
    faculty_id  INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Feedback table (anonymous)
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id   INT AUTO_INCREMENT PRIMARY KEY,
    course_id     INT NOT NULL,
    rating        TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT,
    feedback_date DATE NOT NULL DEFAULT (CURDATE()),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Actions table (admin records actions taken on feedback issues)
CREATE TABLE IF NOT EXISTS actions (
    action_id         INT AUTO_INCREMENT PRIMARY KEY,
    course_id         INT NOT NULL,
    issue_description TEXT NOT NULL,
    action_taken      TEXT NOT NULL,
    status            ENUM('pending', 'in-progress', 'resolved') DEFAULT 'pending',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Suggestions table (anonymous student suggestions)
CREATE TABLE IF NOT EXISTS suggestions (
    suggestion_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id     INT NOT NULL,
    suggestion    TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- Seed data - sample users, courses, feedback
-- -------------------------------------------------------

-- Default admin (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User',    'admin@college.com',   '$2b$10$abcdefghijklmnopqrstuuVwXYZ1234567890abcdefghij', 'admin'),
('Dr. Smith',     'smith@college.com',   '$2b$10$abcdefghijklmnopqrstuuVwXYZ1234567890abcdefghij', 'faculty'),
('Dr. Johnson',   'johnson@college.com', '$2b$10$abcdefghijklmnopqrstuuVwXYZ1234567890abcdefghij', 'faculty'),
('Alice Student', 'alice@student.com',   '$2b$10$abcdefghijklmnopqrstuuVwXYZ1234567890abcdefghij', 'student'),
('Bob Student',   'bob@student.com',     '$2b$10$abcdefghijklmnopqrstuuVwXYZ1234567890abcdefghij', 'student');

-- NOTE: The hashed passwords above are placeholders.
-- Use the /register endpoint or update with bcrypt-hashed values.
-- For quick testing use the seed-users.js script.

INSERT INTO courses (course_name, faculty_id) VALUES
('Mathematics 101',   2),
('Physics 201',       2),
('Data Structures',   3),
('Web Development',   3);
