// routes/faculty.js - Faculty routes (protected, faculty role required)
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  getFeedbackSummary,
  getMyCourses,
} = require("../controllers/facultyController");

router.use(verifyToken, requireRole("faculty", "admin"));

// GET /faculty/feedback-summary - Feedback summary for faculty's courses
router.get("/feedback-summary", getFeedbackSummary);

// GET /faculty/courses - List courses assigned to this faculty
router.get("/courses", getMyCourses);

module.exports = router;
