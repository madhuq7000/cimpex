const Discussion = require("../models/Discussion");
const Category = require("../models/Category");

// ==========================================
// CREATE DISCUSSION
// POST /api/discussions
// ==========================================
const startDiscussion = async (req, res) => {
  try {
    console.log("========== CREATE DISCUSSION ==========");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("User:", req.user);

    const { title, description, categoryId } = req.body;

    if (!title || !description || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Title, description and category are required",
      });
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    let image = "";

    if (req.file) {
      image = `/uploads/discussions/${req.file.filename}`;
    }

    const discussion = await Discussion.create({
      title: title.trim(),
      description: description.trim(),
      category: categoryId,
      image,
      createdBy: req.user._id,
    });

    // ==========================================
    // POPULATE CATEGORY + USER PROFILE IMAGE
    // ==========================================

    const populatedDiscussion = await Discussion.findById(
      discussion._id,
    )
      .populate("category", "name")
      .populate(
        "createdBy",
        "name email profileImage",
      );

    return res.status(201).json({
      success: true,
      message: "Discussion created successfully",
      data: populatedDiscussion,
    });
  } catch (error) {
    console.error("Create discussion error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create discussion",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL DISCUSSIONS
// GET /api/discussions
// ==========================================
const getDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate("category", "name")
      .populate(
        "createdBy",
        "name email profileImage",
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: discussions.length,
      data: discussions,
    });
  } catch (error) {
    console.error("Get discussions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get discussions",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE DISCUSSION
// GET /api/discussions/:id
// ==========================================
const getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findById(id)
      .populate("category", "name")
      .populate(
        "createdBy",
        "name email profileImage",
      );

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: discussion,
    });
  } catch (error) {
    console.error("Get discussion error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid discussion ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to get discussion",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE DISCUSSION
// PUT /api/discussions/:id
// ==========================================
const updateDiscussion = async (req, res) => {
  try {
    console.log("========== UPDATE DISCUSSION ==========");
    console.log("Discussion ID:", req.params.id);
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { id } = req.params;

    const {
      title,
      description,
      categoryId,
      removeImage,
    } = req.body;

    // ==========================================
    // FIND DISCUSSION
    // ==========================================

    const discussion =
      await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    // ==========================================
    // CHECK OWNER
    // ==========================================

    if (
      discussion.createdBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to edit this discussion",
      });
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!title || !description || !categoryId) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description and category are required",
      });
    }

    // ==========================================
    // CHECK CATEGORY
    // ==========================================

    const category =
      await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // ==========================================
    // UPDATE BASIC FIELDS
    // ==========================================

    discussion.title = title.trim();
    discussion.description =
      description.trim();
    discussion.category = categoryId;

    // ==========================================
    // UPDATE IMAGE
    // ==========================================

    if (req.file) {
      discussion.image =
        `/uploads/discussions/${req.file.filename}`;

      console.log(
        "New image:",
        discussion.image,
      );
    } else if (removeImage === "true") {
      discussion.image = "";

      console.log(
        "Existing image removed",
      );
    }

    await discussion.save();

    // ==========================================
    // POPULATE UPDATED DISCUSSION
    // ==========================================

    const updatedDiscussion =
      await Discussion.findById(id)
        .populate(
          "category",
          "name",
        )
        .populate(
          "createdBy",
          "name email profileImage",
        );

    return res.status(200).json({
      success: true,
      message:
        "Discussion updated successfully",
      data: updatedDiscussion,
    });
  } catch (error) {
    console.error(
      "Update discussion error:",
      error,
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid discussion ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update discussion",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  startDiscussion,
  getDiscussions,
  getDiscussionById,
  updateDiscussion,
};