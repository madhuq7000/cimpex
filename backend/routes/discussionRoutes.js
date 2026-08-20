const express = require("express");

const {
  startDiscussion,
  getDiscussions,
  getDiscussionById,
  updateDiscussion,
} = require("../auth-controllers/discussionController");

const { protect } = require("../middleware/authMiddleware");

const uploadDiscussion = require("../middleware/uploadDiscussion");

const router = express.Router();

// ==========================================
// CREATE DISCUSSION
// POST /api/discussions
// ==========================================
router.post(
  "/",
  protect,
  uploadDiscussion.single("image"),
  startDiscussion
);

// ==========================================
// GET ALL DISCUSSIONS
// GET /api/discussions
// ==========================================
router.get("/", getDiscussions);

// ==========================================
// GET SINGLE DISCUSSION
// GET /api/discussions/:id
// ==========================================
router.get("/:id", getDiscussionById);

// ==========================================
// UPDATE DISCUSSION
// PUT /api/discussions/:id
// ==========================================
router.put(
  "/:id",
  protect,
  uploadDiscussion.single("image"),
  updateDiscussion
);

module.exports = router;