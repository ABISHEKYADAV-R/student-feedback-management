# Smart Student Feedback System

A full-stack web application for anonymous student feedback, built with **Node.js + Express + MySQL + HTML/CSS/JS**.

---

## Project Structure

```
student-feedback-system/
├── database/
│   └── schema.sql              ← Run this in MySQL first
├── backend/
│   ├── config/
│   │   └── db.js               ← MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js   ← Login / Register
│   │   ├── studentController.js← Student features
│   │   ├── facultyController.js← Faculty features
│   │   └── adminController.js  ← Admin features
│   ├── routes/
│   │   ├── auth.js
│   │   ├── student.js
│   │   ├── faculty.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── authMiddleware.js   ← JWT auth + role check
│   ├── utils/
│   │   └── seed.js             ← Seed default users
│   ├── server.js               ← Express app entry point
│   ├── package.json
│   └── .env.example            ← Copy to .env and configure
└── frontend/
    ├── index.html              ← Login page
    ├── student-dashboard.html
    ├── faculty-dashboard.html
    ├── admin-dashboard.html
    ├── css/
    │   └── style.css
    └── js/
        ├── auth.js
        ├── student.js
        ├── faculty.js
        └── admin.js
```

---

## Setup Instructions

### 1. Database Setup

Open MySQL and run:

```sql
source path/to/database/schema.sql
```

Or paste contents of `database/schema.sql` into MySQL Workbench.

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your MySQL details:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_feedback_db
JWT_SECRET=your_secret_key
PORT=5000
```

### 3. Seed Default Users

```bash
cd backend
node utils/seed.js
```

### 4. Start the Server

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

The app runs at **http://localhost:5000**

---

## Default Login Credentials

| Role    | Email               | Password   |
| ------- | ------------------- | ---------- |
| Admin   | admin@college.com   | admin123   |
| Faculty | smith@college.com   | faculty123 |
| Faculty | johnson@college.com | faculty123 |
| Student | alice@student.com   | student123 |
| Student | bob@student.com     | student123 |

---

## API Endpoints

| Method | Endpoint                  | Role    | Description                     |
| ------ | ------------------------- | ------- | ------------------------------- |
| POST   | /login                    | All     | Login and get JWT token         |
| POST   | /register                 | All     | Register new user               |
| GET    | /student/courses          | Student | Get all courses                 |
| POST   | /student/feedback         | Student | Submit anonymous feedback       |
| POST   | /student/suggestion       | Student | Submit anonymous suggestion     |
| GET    | /student/improvements     | Student | View resolved improvements      |
| GET    | /faculty/feedback-summary | Faculty | Feedback summary for my courses |
| GET    | /faculty/courses          | Faculty | My assigned courses             |
| GET    | /admin/feedback-stats     | Admin   | Overall statistics              |
| GET    | /admin/actions            | Admin   | List recorded actions           |
| POST   | /admin/action             | Admin   | Record a new action             |
| PUT    | /admin/action/:id         | Admin   | Update action status            |
| GET    | /admin/courses            | Admin   | List all courses                |
| POST   | /admin/course             | Admin   | Add a new course                |
| GET    | /admin/faculty            | Admin   | List all faculty members        |
| GET    | /admin/suggestions        | Admin   | View all suggestions            |

---

## Features

### Student

- Submit **anonymous** feedback (rating 1–5 + comment) per course
- Submit **anonymous** suggestions
- View improvements/actions taken by admin

### Faculty

- View feedback summary (avg rating, count) for own courses
- Read recent student comments

### Admin

- View overall statistics (total feedback, avg rating, suggestions, pending actions)
- Rating breakdown bar chart
- Manage courses (view / add)
- Record actions taken on feedback issues
- Update action status (pending → in-progress → resolved)
- View all student suggestions

---

## Technologies Used

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL (mysql2 driver)
- **Auth:** JWT (jsonwebtoken) + bcryptjs password hashing
- **Other:** dotenv, cors
