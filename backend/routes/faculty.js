// routes/faculty.js - Faculty routes (protected, faculty role required)
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  getFeedbackSummary,
  getMyCourses,
  getFeedbackTrends,
  getQuickSummary,
} = require("../controllers/facultyController");

router.use(verifyToken, requireRole("faculty", "admin"));

// GET /faculty/feedback-summary - Feedback summary for faculty's courses
router.get("/feedback-summary", getFeedbackSummary);

// GET /faculty/courses - List courses assigned to this faculty
router.get("/courses", getMyCourses);

// GET /faculty/feedback-trends - Feedback trends over time
router.get("/feedback-trends", getFeedbackTrends);

// GET /faculty/quick-summary - Text-based quick summary
router.get("/quick-summary", getQuickSummary);

module.exports = router;
