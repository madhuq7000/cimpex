const express = require("express");

const { addCategory } = require("../auth-controllers/categoryController");

const router = express.Router();

router.post("/", addCategory);

module.exports = router;
