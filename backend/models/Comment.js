const mongoose = require("mongoose");

// ==========================================
// COMMENT SCHEMA
// ==========================================

const commentSchema = new mongoose.Schema(
  {
    // ========================================
    // DISCUSSION
    // ========================================
    // The discussion this comment belongs to

    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
      index: true,
    },

    // ========================================
    // COMMENT
    // ========================================

    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },

    // ========================================
    // CREATED BY
    // ========================================
    // User who posted this particular comment

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // STATUS
    // ========================================
    // Used for soft delete

    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
  },

  // ==========================================
  // TIMESTAMPS
  // ==========================================

  {
    timestamps: true,
  },
);

// ==========================================
// INDEX
// ==========================================
// Helps when loading comments for a discussion
// sorted by newest first

commentSchema.index({
  discussion: 1,
  status: 1,
  createdAt: -1,
});

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = mongoose.model(
  "Comment",
  commentSchema,
);