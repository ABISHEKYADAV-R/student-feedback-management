# 📚 Smart Student Feedback System

A full-stack web application for **anonymous student feedback** with role-based dashboards, feedback analytics, and trend tracking — built with **Node.js + Express + MySQL + Vanilla JS**.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens&logoColor=white)
![Chart.js](https://img.shields.io/badge/Charts-Chart.js-FF6384?logo=chartdotjs&logoColor=white)

---

## ✨ Key Features

### 🎓 Student Dashboard
- Submit **anonymous** feedback (rating 1–5 + comment) per course
- Choose a **feedback category** (Teaching Quality, Course Material, Lab Work, Exam Difficulty, Communication, Other)
- **Duplicate prevention** — only one feedback per student per course is allowed
- Submit **anonymous** suggestions
- View improvements/actions taken by admin

### 👨‍🏫 Faculty Dashboard
- View feedback summary (avg rating, count, lowest/highest) for own courses
- **Rating distribution chart** (doughnut chart via Chart.js)
- **Feedback trends over time** (line chart — avg rating + count by week)
- **Category breakdown** — see which areas students are commenting on most
- **Quick summary** — auto-generated text overview of feedback stats
- Read recent student comments with ratings

### 🛠️ Admin Dashboard
- View overall statistics (total feedback, avg rating, suggestions, pending actions)
- **Rating breakdown** bar chart + **doughnut distribution** chart
- **Feedback trends over time** (weekly line chart with dual axes)
- **Category stats** — feedback counts and avg ratings per category
- Manage courses (view / add)
- Record actions taken on feedback issues
- Update action status (pending → in-progress → resolved)
- View all student suggestions

---

## 📁 Project Structure

```
student-feedback-system/
├── database/
│   └── schema.sql              ← MySQL schema + seed data
├── backend/
│   ├── config/
│   │   ├── db.js               ← MySQL connection pool
│   │   └── initDb.js           ← Database initialization check
│   ├── controllers/
│   │   ├── authController.js   ← Login / Register
│   │   ├── studentController.js← Student features + dedup
│   │   ├── facultyController.js← Faculty features + trends
│   │   └── adminController.js  ← Admin features + analytics
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
    ├── index.html              ← Login page (role selection)
    ├── student-dashboard.html
    ├── faculty-dashboard.html
    ├── admin-dashboard.html
    ├── css/
    │   └── style.css           ← Full design system (dark/light)
    └── js/
        ├── auth.js
        ├── theme.js            ← Dark/light mode toggle
        ├── student.js
        ├── faculty.js
        └── admin.js
```

---

## 🚀 Setup Instructions

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

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_feedback_db
JWT_SECRET=your_secret_key
PORT=5002
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

The app runs at **http://localhost:5002**

---

## 🔐 Default Login Credentials

| Role    | Email               | Password   |
| ------- | ------------------- | ---------- |
| Admin   | admin@college.com   | admin123   |
| Faculty | smith@college.com   | faculty123 |
| Faculty | johnson@college.com | faculty123 |
| Student | alice@student.com   | student123 |
| Student | bob@student.com     | student123 |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint    | Description           |
| ------ | ----------- | --------------------- |
| POST   | `/login`    | Login and get JWT     |
| POST   | `/register` | Register new user     |

### Student Routes (requires JWT + student role)

| Method | Endpoint                | Description                        |
| ------ | ----------------------- | ---------------------------------- |
| GET    | `/student/courses`      | List all courses                   |
| GET    | `/student/categories`   | List valid feedback categories     |
| POST   | `/student/feedback`     | Submit anonymous feedback (1/course) |
| POST   | `/student/suggestion`   | Submit anonymous suggestion        |
| GET    | `/student/improvements` | View resolved improvements         |

### Faculty Routes (requires JWT + faculty role)

| Method | Endpoint                    | Description                          |
| ------ | --------------------------- | ------------------------------------ |
| GET    | `/faculty/feedback-summary` | Feedback stats + comments + charts   |
| GET    | `/faculty/courses`          | Courses assigned to this faculty     |
| GET    | `/faculty/feedback-trends`  | Weekly feedback trends (line chart)  |
| GET    | `/faculty/quick-summary`    | Auto-generated text summary          |

### Admin Routes (requires JWT + admin role)

| Method | Endpoint                   | Description                         |
| ------ | -------------------------- | ----------------------------------- |
| GET    | `/admin/feedback-stats`    | Overall stats + category breakdown  |
| GET    | `/admin/feedback-trends`   | Weekly feedback trends (line chart) |
| GET    | `/admin/actions`           | List recorded actions               |
| POST   | `/admin/action`            | Record a new action                 |
| PUT    | `/admin/action/:id`        | Update action status                |
| GET    | `/admin/courses`           | List all courses                    |
| POST   | `/admin/course`            | Add a new course                    |
| GET    | `/admin/faculty`           | List all faculty members            |
| GET    | `/admin/suggestions`       | View all suggestions                |

---

## 🗄️ Database Schema

| Table                | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `users`              | All users (students, faculty, admin) with hashed passwords |
| `courses`            | Courses linked to faculty members                     |
| `feedback`           | Anonymous feedback with rating, comment, and category |
| `feedback_tracking`  | Prevents duplicate submissions (student_id + course_id unique) |
| `suggestions`        | Anonymous student suggestions                         |
| `actions`            | Admin actions taken on feedback issues                |

---

## 🛡️ Security

- **JWT Authentication** — All dashboard routes are protected with Bearer tokens
- **Role-based access control** — Middleware enforces student/faculty/admin permissions
- **Password hashing** — bcryptjs with salt rounds
- **Anonymous feedback** — Student identity is NOT stored in the feedback table
- **Duplicate prevention** — Tracked separately so anonymity is preserved
- **XSS protection** — All dynamic content is HTML-escaped before rendering

---

## 🛠️ Technologies Used

| Layer      | Tech                                    |
| ---------- | --------------------------------------- |
| Frontend   | HTML5, CSS3, Vanilla JavaScript         |
| Backend    | Node.js, Express.js                     |
| Database   | MySQL (mysql2 driver)                   |
| Auth       | JWT (jsonwebtoken) + bcryptjs           |
| Charts     | Chart.js (doughnut + line charts)       |
| Styling    | Custom CSS with dark/light mode support |
| Other      | dotenv, cors, nodemon (dev)             |

---

## 📄 License

This project is built for educational purposes as a college project.
