const Competition = require("../models/Competition");
const CompetitionEntry = require("../models/CompetitionEntry");
const CompetitionComment = require("../models/CompetitionComment");
const { normalizeYoutubeUrl } = require("../utils/youtube");
const {
  isCompetitionAdminUser,
  redactCompetitionPayload,
  filterOwnedItems,
  getUserId,
  isSameUserId,
} = require("../utils/superAdmin");

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

const getOwnerIdFromDoc = (doc) =>
  String(doc?.createdBy?._id || doc?.createdBy || "");

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
      description: description || "",
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
        let supportQuery = {
          competition: competition._id,
          stance: "support",
          status: "active",
        };
        let againstQuery = {
          competition: competition._id,
          stance: "against",
          status: "active",
        };
        let commentQuery = {
          competition: competition._id,
          status: "active",
        };

        if (!isCompetitionAdminUser(req.user)) {
          const viewerId = getUserId(req.user);
          if (viewerId) {
            supportQuery = { ...supportQuery, createdBy: viewerId };
            againstQuery = { ...againstQuery, createdBy: viewerId };
            commentQuery = { ...commentQuery, createdBy: viewerId };
          } else {
            supportQuery = { ...supportQuery, createdBy: null };
            againstQuery = { ...againstQuery, createdBy: null };
            commentQuery = { ...commentQuery, createdBy: null };
          }
        }

        const [supportCount, againstCount, commentCount] = await Promise.all([
          CompetitionEntry.countDocuments(supportQuery),
          CompetitionEntry.countDocuments(againstQuery),
          CompetitionComment.countDocuments(commentQuery),
        ]);

        return {
          ...redactCompetitionPayload(competition, req.user),
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

    const visibleEntries = filterOwnedItems(
      entries,
      req.user,
      getOwnerIdFromDoc,
    );

    let commentQuery = {
      competition: competition._id,
      status: "active",
    };

    if (!isCompetitionAdminUser(req.user)) {
      const viewerId = getUserId(req.user);
      commentQuery = viewerId
        ? { ...commentQuery, createdBy: viewerId }
        : { ...commentQuery, createdBy: null };
    }

    const commentCount = await CompetitionComment.countDocuments(commentQuery);

    const supportEntries = visibleEntries.filter(
      (entry) => entry.stance === "support",
    );
    const againstEntries = visibleEntries.filter(
      (entry) => entry.stance === "against",
    );

    return res.status(200).json({
      success: true,
      data: {
        ...redactCompetitionPayload(competition, req.user),
        entries: visibleEntries,
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
// UPDATE COMPETITION
// PUT /api/competitions/:id
// ==========================================
const updateCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, youtubeUrl, removeImage, removeVideo, removeYoutube } =
      req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    const isOwner = isSameUserId(competition.createdBy, req.user._id);
    const isAdmin = isCompetitionAdminUser(req.user);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this competition",
      });
    }

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

    competition.title = title.trim();
    // Avoid mongoose trim() stripping intentional HTML whitespace from rich text
    competition.description = typeof description === "string" ? description : "";
    competition.markModified("description");

    if (removeImage === "true" || removeImage === true) {
      competition.image = "";
    }

    if (removeVideo === "true" || removeVideo === true) {
      competition.video = "";
    }

    if (removeYoutube === "true" || removeYoutube === true) {
      competition.youtubeUrl = "";
    }

    if (videoFile) {
      competition.video = getCompetitionMediaPath(videoFile);
      competition.youtubeUrl = "";
    } else if (normalizedYoutubeUrl) {
      competition.youtubeUrl = normalizedYoutubeUrl;
      competition.video = "";
    }

    if (imageFile) {
      competition.image = getCompetitionMediaPath(imageFile);
    }

    await competition.save();

    const populatedCompetition = await Competition.findById(
      competition._id,
    ).populate(populateUser);

    return res.status(200).json({
      success: true,
      message: "Competition updated successfully",
      data: populatedCompetition,
    });
  } catch (error) {
    console.error("Update competition error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update competition",
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

    const isOwner = isSameUserId(competition.createdBy, req.user._id);
    const isAdmin = isCompetitionAdminUser(req.user);

    if (!isOwner && !isAdmin) {
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

const canManageEntry = (entry, competition, user) => {
  const userId = getUserId(user);
  const isEntryOwner = isSameUserId(entry.createdBy, userId);
  const isCompOwner =
    competition && isSameUserId(competition.createdBy, userId);
  const isAdmin = isCompetitionAdminUser(user);

  return isEntryOwner || isCompOwner || isAdmin;
};

// ==========================================
// UPDATE ENTRY
// PUT /api/competitions/:id/entries/:entryId
// ==========================================
const updateCompetitionEntry = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const {
      stance,
      title,
      article,
      youtubeUrl,
      removeImage,
      removeVideo,
      removeYoutube,
      removeDocument,
    } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    const entry = await CompetitionEntry.findById(entryId);

    if (!entry || entry.status === "deleted") {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }

    if (String(entry.competition) !== String(id)) {
      return res.status(400).json({
        success: false,
        message: "Entry does not belong to this competition",
      });
    }

    if (!canManageEntry(entry, competition, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this entry",
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

    entry.stance = stance;
    entry.title = title.trim();
    entry.article = articleText;

    if (removeImage === "true" || removeImage === true) {
      entry.image = "";
    }

    if (removeVideo === "true" || removeVideo === true) {
      entry.video = "";
    }

    if (removeYoutube === "true" || removeYoutube === true) {
      entry.youtubeUrl = "";
    }

    if (removeDocument === "true" || removeDocument === true) {
      entry.document = "";
      entry.documentName = "";
    }

    if (videoFile) {
      entry.video = getCompetitionMediaPath(videoFile);
      entry.youtubeUrl = "";
    } else if (normalizedYoutubeUrl) {
      entry.youtubeUrl = normalizedYoutubeUrl;
      entry.video = "";
    }

    if (imageFile) {
      entry.image = getCompetitionMediaPath(imageFile);
    }

    if (documentFile) {
      if (documentFile.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Document size must be less than 10MB",
        });
      }

      entry.document = getCompetitionMediaPath(documentFile);
      entry.documentName = documentFile.originalname;
    }

    const hasContent =
      Boolean(entry.article) ||
      Boolean(entry.video) ||
      Boolean(entry.youtubeUrl) ||
      Boolean(entry.image) ||
      Boolean(entry.document);

    if (!hasContent) {
      return res.status(400).json({
        success: false,
        message: "Add an article, image, video, YouTube link, or PDF/DOC file",
      });
    }

    await entry.save();

    const populatedEntry = await CompetitionEntry.findById(entry._id).populate(
      populateUser,
    );

    return res.status(200).json({
      success: true,
      message: "Entry updated successfully",
      data: populatedEntry,
    });
  } catch (error) {
    console.error("Update competition entry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update entry",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE ENTRY
// DELETE /api/competitions/:id/entries/:entryId
// ==========================================
const deleteCompetitionEntry = async (req, res) => {
  try {
    const { id, entryId } = req.params;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    const entry = await CompetitionEntry.findById(entryId);

    if (!entry || entry.status === "deleted") {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }

    if (String(entry.competition) !== String(id)) {
      return res.status(400).json({
        success: false,
        message: "Entry does not belong to this competition",
      });
    }

    if (!canManageEntry(entry, competition, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this entry",
      });
    }

    entry.status = "deleted";
    await entry.save();

    return res.status(200).json({
      success: true,
      message: "Entry deleted successfully",
    });
  } catch (error) {
    console.error("Delete competition entry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete entry",
      error: error.message,
    });
  }
};

module.exports = {
  createCompetition,
  getCompetitions,
  getCompetitionById,
  updateCompetition,
  createCompetitionEntry,
  updateCompetitionEntry,
  deleteCompetitionEntry,
  deleteCompetition,
};
