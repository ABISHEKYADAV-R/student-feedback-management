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

    // Get latest 20 comments across all courses of this faculty
    const [comments] = await db.query(
      `
      SELECT
        f.course_id,
        c.course_name,
        f.rating,
        f.comment,
        f.category,
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

    // Rating distribution for Chart.js (per star count)
    const [ratingDist] = await db.query(
      `
      SELECT f.rating, COUNT(*) AS count
      FROM feedback f
      JOIN courses c ON f.course_id = c.course_id
      WHERE c.faculty_id = ?
      GROUP BY f.rating
      ORDER BY f.rating
    `,
      [facultyId],
    );

    // Category breakdown
    const [categoryStats] = await db.query(
      `
      SELECT
        COALESCE(f.category, 'Uncategorized') AS category,
        COUNT(*) AS count,
        ROUND(AVG(f.rating), 2) AS avg_rating
      FROM feedback f
      JOIN courses c ON f.course_id = c.course_id
      WHERE c.faculty_id = ?
      GROUP BY f.category
      ORDER BY count DESC
    `,
      [facultyId],
    );

    return res.json({
      success: true,
      summary: summary,
      comments: comments,
      ratingDistribution: ratingDist,
      categoryStats: categoryStats,
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

// GET /faculty/feedback-trends - Feedback trends over time for this faculty's courses
async function getFeedbackTrends(req, res) {
  try {
    const facultyId = req.user.user_id;

    const [rows] = await db.query(
      `
      SELECT
        DATE_FORMAT(f.feedback_date, '%Y-%u') AS week_key,
        MIN(f.feedback_date) AS week_start,
        COUNT(*) AS count,
        ROUND(AVG(f.rating), 2) AS avg_rating
      FROM feedback f
      JOIN courses c ON f.course_id = c.course_id
      WHERE c.faculty_id = ?
      GROUP BY week_key
      ORDER BY week_key ASC
      LIMIT 24
    `,
      [facultyId],
    );

    return res.json({ success: true, trends: rows });
  } catch (err) {
    console.error("Faculty feedback trends error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

// GET /faculty/quick-summary - Generate a text summary of feedback
async function getQuickSummary(req, res) {
  try {
    const facultyId = req.user.user_id;

    // Get summary data
    const [summary] = await db.query(
      `
      SELECT
        c.course_name,
        COUNT(f.feedback_id) AS total,
        ROUND(AVG(f.rating), 2) AS avg_rating
      FROM courses c
      LEFT JOIN feedback f ON c.course_id = f.course_id
      WHERE c.faculty_id = ?
      GROUP BY c.course_id, c.course_name
    `,
      [facultyId],
    );

    const [recentComments] = await db.query(
      `
      SELECT f.comment, f.rating, c.course_name
      FROM feedback f
      JOIN courses c ON f.course_id = c.course_id
      WHERE c.faculty_id = ?
        AND f.comment IS NOT NULL AND f.comment != ''
      ORDER BY f.created_at DESC
      LIMIT 5
    `,
      [facultyId],
    );

    // Build a quick text summary
    if (summary.length === 0) {
      return res.json({
        success: true,
        quickSummary: "No courses assigned yet. Once students start providing feedback, a summary will appear here.",
      });
    }

    const totalFeedback = summary.reduce((s, c) => s + Number(c.total), 0);
    const avgAll = summary.length
      ? (summary.reduce((s, c) => s + Number(c.avg_rating || 0), 0) / summary.length).toFixed(2)
      : "N/A";

    let text = `📊 You have ${totalFeedback} feedback responses across ${summary.length} course(s) with an overall average rating of ${avgAll}/5.\n\n`;

    // Per-course highlights
    summary.forEach((c) => {
      const stars = "★".repeat(Math.round(Number(c.avg_rating || 0))) + "☆".repeat(5 - Math.round(Number(c.avg_rating || 0)));
      text += `• ${c.course_name}: ${c.total} responses, ${c.avg_rating || "N/A"} avg (${stars})\n`;
    });

    // Latest comments
    if (recentComments.length > 0) {
      text += `\n💬 Recent comments:\n`;
      recentComments.forEach((c) => {
        text += `• "${c.comment}" — ${c.course_name} (${"★".repeat(c.rating)})\n`;
      });
    }

    return res.json({ success: true, quickSummary: text });
  } catch (err) {
    console.error("Quick summary error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}

module.exports = { getFeedbackSummary, getMyCourses, getFeedbackTrends, getQuickSummary };
