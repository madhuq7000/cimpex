const Category = require("../models/Category");

const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check category name
    if (!name) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    // Check duplicate category
    const existingCategory = await Category.findOne({
      name: {
        $regex: `^${name.trim()}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    // Create category
    const category = await Category.create({
      name: name.trim(),
      description: description?.trim() || "",
    });

    return res.status(201).json({
      message: "Category added successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add category",
      error: error.message,
    });
  }
};

module.exports = {
  addCategory,
};
