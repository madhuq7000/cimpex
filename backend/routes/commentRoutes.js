const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const { addComment } = require("../auth-controllers/commentController");

router.post("/", verifyToken, addComment);

module.exports = router;
