const Competition = require("../models/Competition");
const CompetitionEntry = require("../models/CompetitionEntry");
const CompetitionComment = require("../models/CompetitionComment");
const { normalizeYoutubeUrl } = require("../utils/youtube");

const getUploadedFile = (req, fieldName) => {
  if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
    return req.files[fieldName][0];
  }

  return null;
};

const getCompetitionMediaPath = (file) => {
  if (!file) {
    return "";
  }

  return `/uploads/competitions/${file.filename}`;
};

const populateUser = {
  path: "createdBy",
  select: "name email profileImage",
};

// ==========================================
// CREATE COMPETITION
// POST /api/competitions
// ==========================================
const createCompetition = async (req, res) => {
  try {
    const { title, description, youtubeUrl } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Competition topic is required",
      });
    }

    const videoFile = getUploadedFile(req, "video");
    const imageFile = getUploadedFile(req, "image");
    const normalizedYoutubeUrl = normalizeYoutubeUrl(youtubeUrl);

    if (youtubeUrl && String(youtubeUrl).trim() && !normalizedYoutubeUrl) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid YouTube video link",
      });
    }

    const competition = await Competition.create({
      title: title.trim(),
      description: (description || "").trim(),
      video: getCompetitionMediaPath(videoFile),
      youtubeUrl: videoFile ? "" : normalizedYoutubeUrl,
      image: getCompetitionMediaPath(imageFile),
      createdBy: req.user._id,
    });

    const populatedCompetition = await Competition.findById(
      competition._id,
    ).populate(populateUser);

    return res.status(201).json({
      success: true,
      message: "Competition created successfully",
      data: populatedCompetition,
    });
  } catch (error) {
    console.error("Create competition error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create competition",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL COMPETITIONS
// GET /api/competitions
// ==========================================
const getCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find()
      .populate(populateUser)
      .sort({
        createdAt: -1,
      })
      .lean();

    const competitionsWithCounts = await Promise.all(
      competitions.map(async (competition) => {
        const [supportCount, againstCount, commentCount] = await Promise.all([
          CompetitionEntry.countDocuments({
            competition: competition._id,
            stance: "support",
            status: "active",
          }),
          CompetitionEntry.countDocuments({
            competition: competition._id,
            stance: "against",
            status: "active",
          }),
          CompetitionComment.countDocuments({
            competition: competition._id,
            status: "active",
          }),
        ]);

        return {
          ...competition,
          supportCount,
          againstCount,
          commentCount,
          entryCount: supportCount + againstCount,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      count: competitionsWithCounts.length,
      data: competitionsWithCounts,
    });
  } catch (error) {
    console.error("Get competitions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load competitions",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE COMPETITION
// GET /api/competitions/:id
// ==========================================
const getCompetitionById = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate(populateUser)
      .lean();

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    const entries = await CompetitionEntry.find({
      competition: competition._id,
      status: "active",
    })
      .populate(populateUser)
      .sort({
        createdAt: -1,
      })
      .lean();

    const commentCount = await CompetitionComment.countDocuments({
      competition: competition._id,
      status: "active",
    });

    const supportEntries = entries.filter((entry) => entry.stance === "support");
    const againstEntries = entries.filter((entry) => entry.stance === "against");

    return res.status(200).json({
      success: true,
      data: {
        ...competition,
        entries,
        supportEntries,
        againstEntries,
        supportCount: supportEntries.length,
        againstCount: againstEntries.length,
        commentCount,
      },
    });
  } catch (error) {
    console.error("Get competition error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load competition",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE ENTRY
// POST /api/competitions/:id/entries
// ==========================================
const createCompetitionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { stance, title, article, youtubeUrl } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    if (competition.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "This competition is closed",
      });
    }

    if (!stance || !["support", "against"].includes(stance)) {
      return res.status(400).json({
        success: false,
        message: "Please choose support or against",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Entry title is required",
      });
    }

    const videoFile = getUploadedFile(req, "video");
    const imageFile = getUploadedFile(req, "image");
    const documentFile = getUploadedFile(req, "document");
    const articleText = (article || "").trim();
    const normalizedYoutubeUrl = normalizeYoutubeUrl(youtubeUrl);

    if (youtubeUrl && String(youtubeUrl).trim() && !normalizedYoutubeUrl) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid YouTube video link",
      });
    }

    if (
      !articleText &&
      !videoFile &&
      !documentFile &&
      !normalizedYoutubeUrl &&
      !imageFile
    ) {
      return res.status(400).json({
        success: false,
        message: "Add an article, image, video, YouTube link, or PDF/DOC file",
      });
    }

    if (documentFile && documentFile.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Document size must be less than 10MB",
      });
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 5MB",
      });
    }

    const entry = await CompetitionEntry.create({
      competition: id,
      stance,
      title: title.trim(),
      article: articleText,
      video: getCompetitionMediaPath(videoFile),
      youtubeUrl: videoFile ? "" : normalizedYoutubeUrl,
      image: getCompetitionMediaPath(imageFile),
      document: getCompetitionMediaPath(documentFile),
      documentName: documentFile ? documentFile.originalname : "",
      createdBy: req.user._id,
    });

    const populatedEntry = await CompetitionEntry.findById(entry._id).populate(
      populateUser,
    );

    return res.status(201).json({
      success: true,
      message: "Entry submitted successfully",
      data: populatedEntry,
    });
  } catch (error) {
    console.error("Create competition entry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit entry",
      error: error.message,
    });
  }
};

const deleteCompetition = async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    if (competition.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this competition",
      });
    }

    await CompetitionComment.updateMany(
      { competition: id },
      { $set: { status: "deleted" } },
    );

    await CompetitionEntry.updateMany(
      { competition: id },
      { $set: { status: "deleted" } },
    );

    await Competition.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Competition, entries, and comments were deleted",
    });
  } catch (error) {
    console.error("Delete competition error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid competition ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete competition",
      error: error.message,
    });
  }
};

module.exports = {
  createCompetition,
  getCompetitions,
  getCompetitionById,
  createCompetitionEntry,
  deleteCompetition,
};
