// routes/admin.js - Admin routes (protected, admin role required)
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  getFeedbackStats,
  getFeedbackTrends,
  recordAction,
  getActions,
  updateActionStatus,
  getCourses,
  addCourse,
  getFacultyList,
  getSuggestions,
} = require("../controllers/adminController");

router.use(verifyToken, requireRole("admin"));

// GET  /admin/feedback-stats  - Overall feedback statistics
router.get("/feedback-stats", getFeedbackStats);

// GET  /admin/feedback-trends - Feedback trends over time
router.get("/feedback-trends", getFeedbackTrends);

// GET  /admin/actions         - List all actions (optional ?status= filter)
router.get("/actions", getActions);

// POST /admin/action          - Record a new action
router.post("/action", recordAction);

// PUT  /admin/action/:id      - Update action status
router.put("/action/:id", updateActionStatus);

// GET  /admin/courses         - List all courses
router.get("/courses", getCourses);

// POST /admin/course          - Add a new course
router.post("/course", addCourse);

// GET  /admin/faculty         - List all faculty
router.get("/faculty", getFacultyList);

// GET  /admin/suggestions     - View all student suggestions
router.get("/suggestions", getSuggestions);

module.exports = router;
