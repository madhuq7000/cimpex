// src/routes/category.routes.js

const router = require("express").Router();

const {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../auth-controllers/categoryController");

//const verifyToken = require("../middlewares/verifyToken");

// Create Category
router.post("/", addCategory);

// Get All Categories
router.get("/",getCategories);

// Get Category By ID
router.get("/:id", getCategoryById);

// Update Category
router.put("/:id", updateCategory);

// Delete Category (Soft Delete)
router.delete("/:id", deleteCategory);

module.exports = router;