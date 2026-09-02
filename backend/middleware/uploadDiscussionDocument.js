const multer = require("multer");
const path = require("path");

const allowedExtensions = [".pdf", ".doc", ".docx"];

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname || "").toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    cb(new Error("Only PDF, DOC and DOCX files are allowed"));
    return;
  }

  if (file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error("Only PDF, DOC and DOCX files are allowed"));
    return;
  }

  cb(null, true);
};

const uploadDiscussionDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const handleDiscussionDocumentUpload = (req, res, next) => {
  uploadDiscussionDocument.single("document")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Document size must be less than 10MB",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to upload document",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to upload document",
    });
  });
};

module.exports = handleDiscussionDocumentUpload;
