// controllers/facultyController.js - Faculty feature logic
const db = require("../config/db");

// GET /faculty/feedback-summary - Feedback summary for courses assigned to this faculty
async function getFeedbackSummary(req, res) {
  try {
    const facultyId = req.user.user_id;

    // Get summary per course (average rating, count, latest comments)
    const [summary] = await db.query(
      `
      SELECT
        c.course_id,
        c.course_name,
        COUNT(f.feedback_id)        AS total_feedback,
        ROUND(AVG(f.rating), 2)     AS average_rating,
        MIN(f.rating)               AS lowest_rating,
        MAX(f.rating)               AS highest_rating
      FROM courses c
      LEFT JOIN feedback f ON c.course_id = f.course_id
      WHERE c.faculty_id = ?
      GROUP BY c.course_id, c.course_name
      ORDER BY c.course_name
    `,
      [facultyId],
    );

    // Get latest 5 comments per course
    const [comments] = await db.query(
      `
      SELECT
        f.course_id,
        f.rating,
        f.comment,
        f.feedback_date
      FROM feedback f
      JOIN courses c ON f.course_id = c.course_id
      WHERE c.faculty_id = ?
        AND f.comment IS NOT NULL
        AND f.comment != ''
      ORDER BY f.feedback_date DESC
      LIMIT 20
    `,
      [facultyId],
    );

    return res.json({
      success: true,
      summary: summary,
      comments: comments,
    });
  } catch (err) {
    console.error("Faculty feedback summary error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// GET /faculty/courses - Get courses belonging to this faculty
async function getMyCourses(req, res) {
  try {
    const facultyId = req.user.user_id;

    const [rows] = await db.query(
      "SELECT course_id, course_name FROM courses WHERE faculty_id = ? ORDER BY course_name",
      [facultyId],
    );

    return res.json({ success: true, courses: rows });
  } catch (err) {
    console.error("Get faculty courses error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

module.exports = { getFeedbackSummary, getMyCourses };
