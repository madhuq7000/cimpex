const Discussion = require("../models/Discussion");
const Category = require("../models/Category");

/**
 * POST /api/discussions
 * Start a new discussion
 */
const startDiscussion = async (req, res) => {
  try {
    console.log("Discussion body:", req.body);
    console.log("Discussion image:", req.file);

    const { title, description, categoryId } = req.body;

    // Validate required fields
    if (!title || !description || !categoryId) {
      return res.status(400).json({
        message: "Title, description and category are required",
      });
    }

    // Check category
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // Save image path
    let image = "";

    if (req.file) {
      image = `/uploads/discussions/${req.file.filename}`;
    }

    // Create discussion
    const discussion = await Discussion.create({
      title: title.trim(),
      description: description.trim(),
      category: categoryId,
      createdBy: req.user._id,
      image,
    });

    return res.status(201).json({
      success: true,
      message: "Discussion started successfully",
      data: discussion,
    });
  } catch (error) {
    console.error("Start discussion error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start discussion",
      error: error.message,
    });
  }
};

/**
 * GET /api/discussions
 * Get all discussions
 */
const getDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate("category", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Discussions fetched successfully",
      data: discussions,
    });
  } catch (error) {
    console.error("Get discussions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch discussions",
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
      .populate("createdBy", "name email");

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Discussion fetched successfully",
      data: discussion,
    });
  } catch (error) {
    console.error("Get discussion by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch discussion",
      error: error.message,
    });
  }
};



module.exports = {
  startDiscussion,
  getDiscussions,
  getDiscussionById
};