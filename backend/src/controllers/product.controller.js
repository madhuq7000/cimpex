// src/controllers/product.controller.js
const Product = require("../models/product.model");

// ==============================
// ADD PRODUCT
// ==============================
exports.addProduct = async (req, res) => {
  try {
    const { name, price, description, categoryId } = req.body;

    // ✅ get multiple files
    const images = req.files ? req.files.map(file => file.filename) : [];

    const product = await Product.create({
      name,
      price,
      description,
      images, // ✅ array
      category: categoryId,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// UPDATE PRODUCT
// ==============================
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, categoryId } = req.body;

    const updateData = {
      name,
      price,
      description,
      category: categoryId,
    };

    // ✅ only update images if new uploaded
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.filename);
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// GET PRODUCT BY ID
// ==============================
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// GET ALL PRODUCTS
// ==============================
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};