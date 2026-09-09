const Competition = require("../models/Competition");
const CompetitionComment = require("../models/CompetitionComment");

const addCompetitionComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    const userId = req.user?._id || req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    const newComment = await CompetitionComment.create({
      competition: id,
      comment: comment.trim(),
      createdBy: userId,
    });

    const populatedComment = await CompetitionComment.findById(
      newComment._id,
    ).populate("createdBy", "name email profileImage");

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedComment,
    });
  } catch (error) {
    console.error("Add competition comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

const getCompetitionComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await CompetitionComment.find({
      competition: id,
      status: "active",
    })
      .populate("createdBy", "name email profileImage")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Get competition comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};

const deleteCompetitionComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user?._id || req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const comment = await CompetitionComment.findById(commentId);

    if (!comment || comment.status === "deleted") {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (String(comment.competition) !== String(id)) {
      return res.status(400).json({
        success: false,
        message: "Comment does not belong to this competition",
      });
    }

    const competition = await Competition.findById(id);

    const isCommentOwner =
      comment.createdBy && comment.createdBy.toString() === String(userId);
    const isCompetitionOwner =
      competition &&
      competition.createdBy &&
      competition.createdBy.toString() === String(userId);

    if (!isCommentOwner && !isCompetitionOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment",
      });
    }

    comment.status = "deleted";
    await comment.save();

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete competition comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message,
    });
  }
};

module.exports = {
  addCompetitionComment,
  getCompetitionComments,
  deleteCompetitionComment,
};
