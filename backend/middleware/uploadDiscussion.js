const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(__dirname, "..", "uploads", "discussions");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const videoMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];

const documentMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
];

const documentExtensions = [".pdf", ".doc", ".docx"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname).toLowerCase();

    cb(null, `${uniqueName}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "video") {
    if (videoMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only MP4, WEBM and OGG video files are allowed"));
    return;
  }

  if (file.fieldname === "document") {
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (documentExtensions.includes(extension)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only PDF, DOC and DOCX files are allowed"));
    return;
  }

  if (imageMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Only JPG, PNG, WEBP, GIF images, videos, or PDF/DOC files are allowed"));
};

const uploadDiscussion = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    fieldSize: 20 * 1024 * 1024,
  },
});

const handleDiscussionMediaUpload = (req, res, next) => {
  uploadDiscussion.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size must be less than 50MB",
        });
      }

      if (error.code === "LIMIT_FIELD_VALUE") {
        return res.status(400).json({
          success: false,
          message: "Discussion content is too large. Please shorten the description.",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to upload file",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to upload file",
    });
  });
};

module.exports = handleDiscussionMediaUpload;
