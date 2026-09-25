const express = require("express");

const {
  createCompetition,
  getCompetitions,
  getCompetitionById,
  updateCompetition,
  createCompetitionEntry,
  updateCompetitionEntry,
  deleteCompetitionEntry,
  deleteCompetition,
} = require("../auth-controllers/competitionController");

const {
  addCompetitionComment,
  getCompetitionComments,
  deleteCompetitionComment,
} = require("../auth-controllers/competitionCommentController");

const { protect, optionalProtect } = require("../middleware/authMiddleware");
const handleCompetitionEntryUpload = require("../middleware/uploadCompetitionEntry");

const router = express.Router();

router.post("/", protect, handleCompetitionEntryUpload, createCompetition);

router.get("/", optionalProtect, getCompetitions);

router.put("/:id", protect, handleCompetitionEntryUpload, updateCompetition);

// POST fallback — some hosts/proxies handle multipart update more reliably than PUT
router.post(
  "/:id/update",
  protect,
  handleCompetitionEntryUpload,
  updateCompetition,
);

router.post(
  "/:id/entries",
  protect,
  handleCompetitionEntryUpload,
  createCompetitionEntry,
);

router.put(
  "/:id/entries/:entryId",
  protect,
  handleCompetitionEntryUpload,
  updateCompetitionEntry,
);

router.delete("/:id/entries/:entryId", protect, deleteCompetitionEntry);

router.get("/:id/comments", optionalProtect, getCompetitionComments);

router.post("/:id/comments", protect, addCompetitionComment);

router.delete("/:id/comments/:commentId", protect, deleteCompetitionComment);

router.delete("/:id", protect, deleteCompetition);

router.get("/:id", optionalProtect, getCompetitionById);

module.exports = router;
