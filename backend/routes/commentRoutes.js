// routes/commentRoutes.js

const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  addComment,
  getComments,
} = require("../auth-controllers/commentController");

// ==========================================
// GET COMMENTS FOR A DISCUSSION
// Public route
// ==========================================

router.get(
  "/discussion/:discussionId",
  getComments,
);

// ==========================================
// ADD COMMENT TO A DISCUSSION
// Protected route - login required
// ==========================================

router.post(
  "/discussion/:discussionId",
  verifyToken,
  addComment,
);

module.exports = router;