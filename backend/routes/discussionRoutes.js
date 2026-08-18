const express = require("express");

const { startDiscussion } = require("../auth-controllers/discussionController");

const { protect } = require("../middleware/authMiddleware");

const uploadDiscussion = require("../middleware/uploadDiscussion");

const router = express.Router();

router.post("/", protect, uploadDiscussion.single("image"), startDiscussion);

module.exports = router;
