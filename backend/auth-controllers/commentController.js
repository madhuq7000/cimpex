const Comment = require("../models/Comment");
const Discussion = require("../models/Discussion");

const addComment = async (req, res) => {
  try {
    const { discussionId, comment } = req.body;

    // Validate required fields
    if (!discussionId || !comment) {
      return res.status(400).json({
        message: "Discussion ID and comment are required",
      });
    }

    // Check logged-in user
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    // Check whether discussion exists
    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        message: "Discussion not found",
      });
    }

    // Create comment
    const newComment = await Comment.create({
      discussion: discussionId,
      comment: comment,
      createdBy: req.user.userId,
    });

    // Populate user information
    const populatedComment = await Comment.findById(newComment._id)
      .populate("createdBy", "name email")
      .populate("discussion", "title");

    return res.status(201).json({
      message: "Comment added successfully",
      data: populatedComment,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    return res.status(500).json({
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

module.exports = {
  addComment,
};
