const Discussion = require("../models/Discussion");
const Category = require("../models/Category");

// ==========================================
// UPDATE DISCUSSION
// ==========================================
/**
 * PATCH /api/discussions/:id
 * Update discussion
 */
const updateDiscussion = async (req, res) => {
  try {
    console.log("========== UPDATE DISCUSSION ==========");
    console.log("Discussion ID:", req.params.id);
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { id } = req.params;
    const { title, description, categoryId, removeImage } = req.body;

    // ==========================================
    // FIND DISCUSSION
    // ==========================================

    const discussion = await Discussion.findById(id);

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
        message: "You are not authorized to edit this discussion",
      });
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!title || !description || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Title, description and category are required",
      });
    }

    // ==========================================
    // CHECK CATEGORY
    // ==========================================

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // ==========================================
    // UPDATE BASIC DATA
    // ==========================================

    discussion.title = title.trim();

    discussion.description = description.trim();

    discussion.category = categoryId;

    // ==========================================
    // UPDATE IMAGE
    // ==========================================

    if (req.file) {
      // New image uploaded
      discussion.image =
        `/uploads/discussions/${req.file.filename}`;

      console.log(
        "New image:",
        discussion.image,
      );
    } else if (removeImage === "true") {
      // User removed existing image
      discussion.image = "";

      console.log("Existing image removed");
    }

    // ==========================================
    // SAVE
    // ==========================================

    await discussion.save();

    // ==========================================
    // RETURN UPDATED DATA
    // ==========================================

    const updatedDiscussion =
      await Discussion.findById(id)
        .populate("category", "name")
        .populate("createdBy", "name email");

    console.log(
      "Updated discussion:",
      updatedDiscussion,
    );

    return res.status(200).json({
      success: true,
      message: "Discussion updated successfully",
      data: updatedDiscussion,
    });

  } catch (error) {
    console.error(
      "Update discussion error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update discussion",
      error: error.message,
    });
  }
};

module.exports = {
  startDiscussion,
  getDiscussions,
  getDiscussionById,
  updateDiscussion,
};