// controllers/adminController.js - Admin feature logic
const db = require("../config/db");

// GET /admin/feedback-stats - Overall feedback statistics
async function getFeedbackStats(req, res) {
  try {
    // Overall numbers
    const [[totals]] = await db.query(`
      SELECT
        COUNT(*)                 AS total_feedback,
        ROUND(AVG(rating), 2)   AS overall_avg_rating,
        SUM(rating = 5)         AS five_star,
        SUM(rating = 4)         AS four_star,
        SUM(rating = 3)         AS three_star,
        SUM(rating = 2)         AS two_star,
        SUM(rating = 1)         AS one_star
      FROM feedback
    `);

    // Per-course stats
    const [courseStats] = await db.query(`
      SELECT
        c.course_id,
        c.course_name,
        u.name                       AS faculty_name,
        COUNT(f.feedback_id)         AS total_feedback,
        ROUND(AVG(f.rating), 2)      AS avg_rating
      FROM courses c
      LEFT JOIN users    u ON c.faculty_id = u.user_id
      LEFT JOIN feedback f ON c.course_id  = f.course_id
      GROUP BY c.course_id, c.course_name, u.name
      ORDER BY avg_rating ASC
    `);

    // Total suggestions
    const [[suggestionCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM suggestions",
    );

    // Pending actions
    const [[pendingActions]] = await db.query(
      "SELECT COUNT(*) AS total FROM actions WHERE status != 'resolved'",
    );

    // Category breakdown
    const [categoryStats] = await db.query(`
      SELECT
        COALESCE(category, 'Uncategorized') AS category,
        COUNT(*) AS count,
        ROUND(AVG(rating), 2) AS avg_rating
      FROM feedback
      GROUP BY category
      ORDER BY count DESC
    `);

    return res.json({
      success: true,
      stats: {
        totals,
        courseStats,
        totalSuggestions: suggestionCount.total,
        pendingActions: pendingActions.total,
        categoryStats,
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// GET /admin/feedback-trends - Feedback trends over time (weekly)
async function getFeedbackTrends(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(feedback_date, '%Y-%u') AS week_key,
        MIN(feedback_date) AS week_start,
        COUNT(*) AS count,
        ROUND(AVG(rating), 2) AS avg_rating
      FROM feedback
      GROUP BY week_key
      ORDER BY week_key ASC
      LIMIT 24
    `);

    return res.json({ success: true, trends: rows });
  } catch (err) {
    console.error("Feedback trends error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// POST /admin/action - Record an action taken on a feedback issue
async function recordAction(req, res) {
  try {
    const { course_id, issue_description, action_taken, status } = req.body;

    if (!course_id || !issue_description || !action_taken) {
      return res.status(400).json({
        success: false,
        message: "course_id, issue_description, and action_taken are required.",
      });
    }

    const validStatuses = ["pending", "in-progress", "resolved"];
    const actionStatus = validStatuses.includes(status) ? status : "pending";

    const [result] = await db.query(
      "INSERT INTO actions (course_id, issue_description, action_taken, status) VALUES (?, ?, ?, ?)",
      [course_id, issue_description, action_taken, actionStatus],
    );

    return res.status(201).json({
      success: true,
      message: "Action recorded successfully.",
      action_id: result.insertId,
    });
  } catch (err) {
    console.error("Record action error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// GET /admin/actions - List all actions with filters
async function getActions(req, res) {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        a.action_id,
        c.course_name,
        u.name            AS faculty_name,
        a.issue_description,
        a.action_taken,
        a.status,
        a.created_at
      FROM actions a
      JOIN courses c ON a.course_id = c.course_id
      LEFT JOIN users u ON c.faculty_id = u.user_id
    `;
    const params = [];

    if (status) {
      query += " WHERE a.status = ?";
      params.push(status);
    }

    query += " ORDER BY a.created_at DESC";

    const [rows] = await db.query(query, params);
    return res.json({ success: true, actions: rows });
  } catch (err) {
    console.error("Get actions error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// PUT /admin/action/:id - Update action status
async function updateActionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in-progress", "resolved"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status." });
    }

    const [result] = await db.query(
      "UPDATE actions SET status = ? WHERE action_id = ?",
      [status, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Action not found." });
    }

    return res.json({ success: true, message: "Action status updated." });
  } catch (err) {
    console.error("Update action error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// GET /admin/courses - List all courses
async function getCourses(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT c.course_id, c.course_name, u.name AS faculty_name, u.user_id AS faculty_id
      FROM courses c
      LEFT JOIN users u ON c.faculty_id = u.user_id
      ORDER BY c.course_name
    `);
    return res.json({ success: true, courses: rows });
  } catch (err) {
    console.error("Admin get courses error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// POST /admin/course - Add a new course
async function addCourse(req, res) {
  try {
    const { course_name, faculty_id } = req.body;

    if (!course_name) {
      return res
        .status(400)
        .json({ success: false, message: "course_name is required." });
    }

    const [result] = await db.query(
      "INSERT INTO courses (course_name, faculty_id) VALUES (?, ?)",
      [course_name, faculty_id || null],
    );

    return res.status(201).json({
      success: true,
      message: "Course added.",
      course_id: result.insertId,
    });
  } catch (err) {
    console.error("Add course error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// GET /admin/faculty - List all faculty members
async function getFacultyList(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT user_id, name, email FROM users WHERE role = 'faculty' ORDER BY name",
    );
    return res.json({ success: true, faculty: rows });
  } catch (err) {
    console.error("Get faculty list error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// GET /admin/suggestions - View all student suggestions
async function getSuggestions(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT s.suggestion_id, c.course_name, s.suggestion, s.created_at
      FROM suggestions s
      JOIN courses c ON s.course_id = c.course_id
      ORDER BY s.created_at DESC
    `);
    return res.json({ success: true, suggestions: rows });
  } catch (err) {
    console.error("Get suggestions error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

module.exports = {
  getFeedbackStats,
  getFeedbackTrends,
  recordAction,
  getActions,
  updateActionStatus,
  getCourses,
  addCourse,
  getFacultyList,
  getSuggestions,
};
