const express = require("express");

const {
  startDiscussion,
  getDiscussions,
  getDiscussionById,
  updateDiscussion,
  importDiscussionDocument,
} = require("../auth-controllers/discussionController");

const { protect } = require("../middleware/authMiddleware");

const handleDiscussionMediaUpload = require("../middleware/uploadDiscussion");
const handleDiscussionDocumentUpload = require("../middleware/uploadDiscussionDocument");

const router = express.Router();

// ==========================================
// IMPORT DOCUMENT
// POST /api/discussions/import-document
// ==========================================
router.post(
  "/import-document",
  protect,
  handleDiscussionDocumentUpload,
  importDiscussionDocument
);

// ==========================================
// CREATE DISCUSSION
// POST /api/discussions
// ==========================================
router.post(
  "/",
  protect,
  handleDiscussionMediaUpload,
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
  handleDiscussionMediaUpload,
  updateDiscussion
);

module.exports = router;