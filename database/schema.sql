-- Smart Student Feedback System - Database Schema (MySQL)
-- Run this to create the database structure

-- Users table (students, faculty, admin)
CREATE TABLE IF NOT EXISTS users (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('student', 'faculty', 'admin') NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    course_id   INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    faculty_id  INT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Facilities table
CREATE TABLE IF NOT EXISTS facilities (
    facility_id   INT AUTO_INCREMENT PRIMARY KEY,
    facility_name VARCHAR(100) NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table (anonymous)
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id   INT AUTO_INCREMENT PRIMARY KEY,
    course_id     INT DEFAULT NULL,
    facility_id   INT DEFAULT NULL,
    rating        INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment       TEXT,
    category      VARCHAR(50) DEFAULT NULL,
    feedback_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE CASCADE,
    CHECK (course_id IS NOT NULL OR facility_id IS NOT NULL)
);

-- Feedback tracking table (prevents duplicate submissions per student per course or facility)
CREATE TABLE IF NOT EXISTS feedback_tracking (
    tracking_id   INT AUTO_INCREMENT PRIMARY KEY,
    student_id    INT NOT NULL,
    course_id     INT DEFAULT NULL,
    facility_id   INT DEFAULT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id),
    UNIQUE(student_id, facility_id),
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE CASCADE
);

-- Actions table (admin records actions taken on feedback issues)
CREATE TABLE IF NOT EXISTS actions (
    action_id         INT AUTO_INCREMENT PRIMARY KEY,
    course_id         INT DEFAULT NULL,
    facility_id       INT DEFAULT NULL,
    issue_description TEXT NOT NULL,
    action_taken      TEXT NOT NULL,
    status            ENUM('pending', 'in-progress', 'resolved') DEFAULT 'pending',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE CASCADE
);

-- Suggestions table (anonymous student suggestions)
CREATE TABLE IF NOT EXISTS suggestions (
    suggestion_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id     INT DEFAULT NULL,
    facility_id   INT DEFAULT NULL,
    suggestion    TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- Seed data - sample users, courses
-- -------------------------------------------------------

-- Passwords: admin123, faculty123, student123 (bcrypt hashed)
INSERT INTO users (name, email, password, role) VALUES
('Admin User',         'admin@college.com',    '$2a$10$p/2XygImQpSCuDMcOoL8p.edARMXOm.4EmyRmgjJC1c22UImSXqK2', 'admin'),
('Dr. Ramesh Kumar',   'ramesh@college.com',   '$2a$10$oYlnjJnGVP1LosjEZ90upuxkFpsHUznK5K.A9uSnPelEJlIeTjGHm', 'faculty'),
('Dr. Priya Sharma',   'priya@college.com',    '$2a$10$oYlnjJnGVP1LosjEZ90upuxkFpsHUznK5K.A9uSnPelEJlIeTjGHm', 'faculty'),
('Dr. Sunita Verma',   'sunita@college.com',   '$2a$10$oYlnjJnGVP1LosjEZ90upuxkFpsHUznK5K.A9uSnPelEJlIeTjGHm', 'faculty'),
('Prof. Arjun Reddy',  'arjun@college.com',    '$2a$10$oYlnjJnGVP1LosjEZ90upuxkFpsHUznK5K.A9uSnPelEJlIeTjGHm', 'faculty'),
('Dr. Lakshmi Iyer',   'lakshmi@college.com',  '$2a$10$oYlnjJnGVP1LosjEZ90upuxkFpsHUznK5K.A9uSnPelEJlIeTjGHm', 'faculty'),
('Prof. Vikram Singh',  'vikram@college.com',   '$2a$10$oYlnjJnGVP1LosjEZ90upuxkFpsHUznK5K.A9uSnPelEJlIeTjGHm', 'faculty'),
('Abishek Yadav',      'ram@student.com',      '$2a$10$TmxBZNyU/SUVJLqgKhRmg.5XgfN6tfQoW7ze6kZjZCK7ykdzEaKsS', 'student'),
('Kavitha Meena',      'kavitha@student.com',  '$2a$10$TmxBZNyU/SUVJLqgKhRmg.5XgfN6tfQoW7ze6kZjZCK7ykdzEaKsS', 'student'),
('Deepak Patel',       'deepak@student.com',   '$2a$10$TmxBZNyU/SUVJLqgKhRmg.5XgfN6tfQoW7ze6kZjZCK7ykdzEaKsS', 'student'),
('Ananya Krishnan',    'ananya@student.com',   '$2a$10$TmxBZNyU/SUVJLqgKhRmg.5XgfN6tfQoW7ze6kZjZCK7ykdzEaKsS', 'student'),
('Rohit Nair',         'rohit@student.com',    '$2a$10$TmxBZNyU/SUVJLqgKhRmg.5XgfN6tfQoW7ze6kZjZCK7ykdzEaKsS', 'student'),
('Sneha Gupta',        'sneha@student.com',    '$2a$10$TmxBZNyU/SUVJLqgKhRmg.5XgfN6tfQoW7ze6kZjZCK7ykdzEaKsS', 'student');

INSERT INTO courses (course_name, faculty_id) VALUES
('Mathematics 101',             2),
('Physics 201',                 2),
('Discrete Mathematics',        2),
('Data Structures',             3),
('Web Development',             3),
('Digital Electronics',         3),
('Operating Systems',           4),
('Database Management Systems', 4),
('Computer Networks',           5),
('Artificial Intelligence',     5),
('Software Engineering',        6),
('Cloud Computing',             6),
('Machine Learning',            7),
('Cyber Security',              7);

INSERT INTO facilities (facility_name) VALUES
('Hostel & Accommodation'),
('Mess & Cafeteria'),
('Restrooms & Hygiene'),
('Library & Study Spaces'),
('Sports & Gym'),
('Campus Wi-Fi & IT'),
('Transportation & Parking');
