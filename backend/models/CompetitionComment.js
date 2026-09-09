const mongoose = require("mongoose");

const competitionCommentSchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
      index: true,
    },

    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

competitionCommentSchema.index({
  competition: 1,
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "CompetitionComment",
  competitionCommentSchema,
);
