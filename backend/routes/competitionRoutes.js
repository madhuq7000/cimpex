const express = require("express");

const {
  createCompetition,
  getCompetitions,
  getCompetitionById,
  createCompetitionEntry,
  deleteCompetition,
} = require("../auth-controllers/competitionController");

const {
  addCompetitionComment,
  getCompetitionComments,
  deleteCompetitionComment,
} = require("../auth-controllers/competitionCommentController");

const { protect } = require("../middleware/authMiddleware");
const handleCompetitionEntryUpload = require("../middleware/uploadCompetitionEntry");

const router = express.Router();

router.post("/", protect, handleCompetitionEntryUpload, createCompetition);

router.get("/", getCompetitions);

router.post(
  "/:id/entries",
  protect,
  handleCompetitionEntryUpload,
  createCompetitionEntry,
);

router.get("/:id/comments", getCompetitionComments);

router.post("/:id/comments", protect, addCompetitionComment);

router.delete("/:id/comments/:commentId", protect, deleteCompetitionComment);

router.delete("/:id", protect, deleteCompetition);

router.get("/:id", getCompetitionById);

module.exports = router;
