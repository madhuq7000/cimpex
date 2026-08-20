const Category = require("../models/Category");

// ========================================
// CREATE CATEGORY
// POST /api/categories
// ========================================
const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate category name
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
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
        success: false,
        message: "Category already exists",
      });
    }

    // Create category
    const category = await Category.create({
      name: name.trim(),
      description: description?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: category,
    });
  } catch (error) {
    console.error("Add category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add category",
      error: error.message,
    });
  }
};

// ========================================
// GET ALL CATEGORIES
// GET /api/categories
// ========================================
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({
      name: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// ========================================
// GET CATEGORY BY ID
// GET /api/categories/:id
// ========================================
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    });
  } catch (error) {
    console.error("Get category by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE CATEGORY
// PUT /api/categories/:id
// ========================================
const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check duplicate category
    const existingCategory = await Category.findOne({
      name: {
        $regex: `^${name.trim()}$`,
        $options: "i",
      },
      _id: {
        $ne: req.params.id,
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description?.trim() || "",
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

// ========================================
// DELETE CATEGORY
// DELETE /api/categories/:id
// ========================================
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

// ========================================
// EXPORT
// ========================================
module.exports = {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};