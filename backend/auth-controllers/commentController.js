// auth-controllers/commentController.js

const Comment = require("../models/Comment");
const Discussion = require("../models/Discussion");

// ==========================================
// ADD COMMENT
// ==========================================

const addComment = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { comment } = req.body;

    // ========================================
    // DEBUG
    // ========================================

    console.log("================================");
    console.log("ADD COMMENT REQUEST");
    console.log("Discussion ID:", discussionId);
    console.log("Comment:", comment);
    console.log("req.user:", req.user);
    console.log("req.userId:", req.userId);
    console.log("================================");

    // ========================================
    // VALIDATE COMMENT
    // ========================================

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    // ========================================
    // GET LOGGED-IN USER ID
    // ========================================

    const userId =
      req.user?._id ||
      req.user?.userId ||
      req.user?.id ||
      req.userId;

    console.log("Resolved User ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // ========================================
    // CHECK DISCUSSION
    // ========================================

    const discussion = await Discussion.findById(
      discussionId,
    );

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    // ========================================
    // CREATE COMMENT
    // ========================================

    const newComment = await Comment.create({
      discussion: discussionId,
      comment: comment.trim(),
      createdBy: userId,
    });

    // ========================================
    // POPULATE USER
    // ========================================

    const populatedComment =
      await Comment.findById(newComment._id)
        .populate("createdBy", "name email");

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedComment,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

// ==========================================
// GET COMMENTS
// ==========================================

const getComments = async (req, res) => {
  try {
    const { discussionId } = req.params;

    console.log(
      "Getting comments for discussion:",
      discussionId,
    );

    const comments = await Comment.find({
      discussion: discussionId,
      status: "active",
    })
      .populate("createdBy", "name email")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  addComment,
  getComments,
};