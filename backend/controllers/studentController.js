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
    const { course_id, facility_id, rating, comment, category } = req.body;
    const student_id = req.user.user_id;

    if ((!course_id && !facility_id) || !rating) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Either course_id or facility_id and rating are required.",
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

    // Verify it exists
    if (course_id) {
      const [courses] = await db.query(
        "SELECT course_id FROM courses WHERE course_id = ?",
        [course_id],
      );
      if (courses.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });
      }
    } else if (facility_id) {
      const [facilities] = await db.query(
        "SELECT facility_id FROM facilities WHERE facility_id = ?",
        [facility_id],
      );
      if (facilities.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Facility not found." });
      }
    }

    // ── Duplicate prevention: check if student already submitted for this ──
    const [existing] = await db.query(
      `SELECT tracking_id FROM feedback_tracking 
       WHERE student_id = ? AND ${course_id ? 'course_id = ?' : 'facility_id = ?'}`,
      [student_id, course_id || facility_id],
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({
          success: false,
          message: `You have already submitted feedback for this ${course_id ? 'course' : 'facility'}. Only one submission is allowed.`,
        });
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Insert the anonymous feedback
    await db.query(
      "INSERT INTO feedback (course_id, facility_id, rating, comment, category, feedback_date) VALUES (?, ?, ?, ?, ?, ?)",
      [course_id || null, facility_id || null, rating, comment || null, category || null, today],
    );

    // Track that this student submitted (for dedup only)
    await db.query(
      "INSERT INTO feedback_tracking (student_id, course_id, facility_id) VALUES (?, ?, ?)",
      [student_id, course_id || null, facility_id || null],
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
    const { course_id, facility_id, suggestion } = req.body;

    if ((!course_id && !facility_id) || !suggestion) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Either course_id or facility_id and suggestion are required.",
        });
    }

    if (course_id) {
      const [courses] = await db.query(
        "SELECT course_id FROM courses WHERE course_id = ?",
        [course_id],
      );
      if (courses.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });
      }
    } else if (facility_id) {
      const [facilities] = await db.query(
        "SELECT facility_id FROM facilities WHERE facility_id = ?",
        [facility_id],
      );
      if (facilities.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Facility not found." });
      }
    }

    await db.query(
      "INSERT INTO suggestions (course_id, facility_id, suggestion) VALUES (?, ?, ?)",
      [course_id || null, facility_id || null, suggestion],
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
        fa.facility_name,
        a.issue_description,
        a.action_taken,
        a.status,
        a.created_at
      FROM actions a
      LEFT JOIN courses c ON a.course_id = c.course_id
      LEFT JOIN facilities fa ON a.facility_id = fa.facility_id
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

// GET /student/facilities - List all facilities
async function getFacilities(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT facility_id, facility_name
      FROM facilities
      ORDER BY facility_name
    `);
    return res.json({ success: true, facilities: rows });
  } catch (err) {
    console.error("Get facilities error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

module.exports = {
  submitFeedback,
  submitSuggestion,
  getImprovements,
  getCourses,
  getCategories,
  getFacilities,
};
