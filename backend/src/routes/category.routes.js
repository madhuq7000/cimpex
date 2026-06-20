// src/routes/category.routes.js
const router = require("express").Router();
const {
  addCategory,
  getCategories,
} = require("../controllers/category.controller");

router.post("/", addCategory);
router.get("/", getCategories);

module.exports = router;