const router = require("express").Router();

const {
  addProduct,
  updateProduct,
  getProductById,
  getProducts,
} = require("../controllers/product.controller");

const upload = require("../middlewares/upload");

console.log("📦 PRODUCT ROUTE FILE LOADED");

// ==============================
// 📌 CREATE PRODUCT (KEEP FIRST)
// ==============================
router.post(
  "/add-product",
  upload.array("images", 5),
  (req, res, next) => {
    console.log("🔥 ADD PRODUCT ROUTE HIT");
    next();
  },
  addProduct
);

// ==============================
// 📌 UPDATE PRODUCT
// ==============================
router.put(
  "/:id",
  upload.array("images", 5),
  (req, res, next) => {
    console.log("🔥 UPDATE ROUTE HIT");
    next();
  },
  updateProduct
);

// ==============================
// 📌 GET ALL PRODUCTS
// ==============================
router.get("/", getProducts);

// ==============================
// 📌 GET SINGLE PRODUCT (ALWAYS LAST)
// ==============================
router.get("/:id", getProductById);

module.exports = router;