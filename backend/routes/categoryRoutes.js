// src/routes/category.routes.js

const router = require("express").Router();

const {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../auth-controllers/categoryController");

const { protect } = require("../middleware/authMiddleware");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");

// Get All Categories (public)
router.get("/", getCategories);

// Get Category By ID (public)
router.get("/:id", getCategoryById);

// Create / update / delete — only rakesh@dsnlegal.com
router.post("/", protect, requireSuperAdmin, addCategory);
router.put("/:id", protect, requireSuperAdmin, updateCategory);
router.delete("/:id", protect, requireSuperAdmin, deleteCategory);

module.exports = router;
