const Discussion = require("../models/Discussion");

const Category = require("../models/Category");

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
      message: "Discussion started successfully",

      data: discussion,
    });
  } catch (error) {
    console.error("Start discussion error:", error);

    return res.status(500).json({
      message: "Failed to start discussion",
      error: error.message,
    });
  }
};

module.exports = {
  startDiscussion,
};
