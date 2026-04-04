// controllers/studentController.js - Student feature logic
const db = require("../config/db");

// Valid feedback categories
const VALID_CATEGORIES = [
  "Teaching Quality",
  "Course Material",
  "Lab Work",
  "Exam Difficulty",
  "Communication",
  "Other",
];

// POST /student/feedback - Submit anonymous feedback for a course
async function submitFeedback(req, res) {
  try {
    const { course_id, rating, comment, category } = req.body;
    const student_id = req.user.user_id;

    if (!course_id || !rating) {
      return res
        .status(400)
        .json({
          success: false,
          message: "course_id and rating are required.",
        });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5." });
    }

    // Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid feedback category." });
    }

    // Verify course exists
    const [courses] = await db.query(
      "SELECT course_id FROM courses WHERE course_id = ?",
      [course_id],
    );
    if (courses.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    }

    // ── Duplicate prevention: check if student already submitted for this course ──
    const [existing] = await db.query(
      "SELECT tracking_id FROM feedback_tracking WHERE student_id = ? AND course_id = ?",
      [student_id, course_id],
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({
          success: false,
          message: "You have already submitted feedback for this course. Only one submission per course is allowed.",
        });
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Insert the anonymous feedback (no student_id stored in feedback table)
    await db.query(
      "INSERT INTO feedback (course_id, rating, comment, category, feedback_date) VALUES (?, ?, ?, ?, ?)",
      [course_id, rating, comment || null, category || null, today],
    );

    // Track that this student submitted for this course (for dedup only)
    await db.query(
      "INSERT INTO feedback_tracking (student_id, course_id) VALUES (?, ?)",
      [student_id, course_id],
    );

    return res
      .status(201)
      .json({
        success: true,
        message: "Feedback submitted anonymously. Thank you!",
      });
  } catch (err) {
    console.error("Submit feedback error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// POST /student/suggestion - Submit anonymous suggestion
async function submitSuggestion(req, res) {
  try {
    const { course_id, suggestion } = req.body;

    if (!course_id || !suggestion) {
      return res
        .status(400)
        .json({
          success: false,
          message: "course_id and suggestion are required.",
        });
    }

    const [courses] = await db.query(
      "SELECT course_id FROM courses WHERE course_id = ?",
      [course_id],
    );
    if (courses.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    }

    await db.query(
      "INSERT INTO suggestions (course_id, suggestion) VALUES (?, ?)",
      [course_id, suggestion],
    );

    return res
      .status(201)
      .json({
        success: true,
        message: "Suggestion submitted anonymously. Thank you!",
      });
  } catch (err) {
    console.error("Submit suggestion error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// GET /student/improvements - View improvements/actions taken based on feedback
async function getImprovements(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
        a.action_id,
        c.course_name,
        a.issue_description,
        a.action_taken,
        a.status,
        a.created_at
      FROM actions a
      JOIN courses c ON a.course_id = c.course_id
      WHERE a.status = 'resolved'
      ORDER BY a.created_at DESC
    `);

    return res.json({ success: true, improvements: rows });
  } catch (err) {
    console.error("Get improvements error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// GET /student/courses - List all courses (for dropdown selection)
async function getCourses(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT c.course_id, c.course_name, u.name AS faculty_name
      FROM courses c
      LEFT JOIN users u ON c.faculty_id = u.user_id
      ORDER BY c.course_name
    `);
    return res.json({ success: true, courses: rows });
  } catch (err) {
    console.error("Get courses error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// GET /student/categories - List valid feedback categories
async function getCategories(req, res) {
  return res.json({ success: true, categories: VALID_CATEGORIES });
}

module.exports = {
  submitFeedback,
  submitSuggestion,
  getImprovements,
  getCourses,
  getCategories,
};
