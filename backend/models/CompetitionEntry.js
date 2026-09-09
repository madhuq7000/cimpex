const mongoose = require("mongoose");

const competitionEntrySchema = new mongoose.Schema(
  {
    competition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
      index: true,
    },

    stance: {
      type: String,
      enum: ["support", "against"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    article: {
      type: String,
      default: "",
      trim: true,
    },

    video: {
      type: String,
      default: "",
    },

    youtubeUrl: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    document: {
      type: String,
      default: "",
    },

    documentName: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

competitionEntrySchema.index({
  competition: 1,
  stance: 1,
  createdAt: -1,
});

module.exports = mongoose.model("CompetitionEntry", competitionEntrySchema);
