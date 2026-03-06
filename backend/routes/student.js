// routes/student.js - Student routes (protected)
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  submitFeedback,
  submitSuggestion,
  getImprovements,
  getCourses,
} = require("../controllers/studentController");

// All student routes require a valid JWT
router.use(verifyToken);

// GET  /student/courses     - List all courses (for dropdowns)
router.get("/courses", getCourses);

// POST /student/feedback    - Submit anonymous feedback
router.post("/feedback", submitFeedback);

// POST /student/suggestion  - Submit anonymous suggestion
router.post("/suggestion", submitSuggestion);

// GET  /student/improvements - View resolved improvements
router.get("/improvements", getImprovements);

module.exports = router;
