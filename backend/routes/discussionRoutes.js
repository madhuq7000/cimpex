const express = require("express");

const {
  startDiscussion,
  getDiscussions,
  getDiscussionById,
} = require("../auth-controllers/discussionController");

const { protect } = require("../middleware/authMiddleware");

const uploadDiscussion = require("../middleware/uploadDiscussion");

const router = express.Router();

// ==========================================
// POST - Create Discussion
// ==========================================
router.post(
  "/",
  protect,
  uploadDiscussion.single("image"),
  startDiscussion
);

// ==========================================
// GET - Get All Discussions
// ==========================================
router.get(
  "/",
  getDiscussions
);

// ==========================================
// GET - Get Single Discussion
// ==========================================
router.get(
  "/:id",
  getDiscussionById
);

module.exports = router;