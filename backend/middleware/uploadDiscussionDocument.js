const multer = require("multer");
const path = require("path");

const allowedExtensions = [".pdf", ".doc", ".docx"];

const decodeOriginalName = (name = "") => {
  try {
    // Browsers often send UTF-8 filenames as latin1 to Multer.
    return Buffer.from(String(name), "latin1").toString("utf8");
  } catch (_error) {
    return String(name || "");
  }
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  file.originalname = decodeOriginalName(file.originalname);
  const extension = path.extname(file.originalname || "").toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    cb(new Error("Only PDF, DOC and DOCX files are allowed"));
    return;
  }

  cb(null, true);
};

const uploadDiscussionDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

const handleDiscussionDocumentUpload = (req, res, next) => {
  uploadDiscussionDocument.single("document")(req, res, (error) => {
    if (!error) {
      if (req.file?.originalname) {
        req.file.originalname = decodeOriginalName(req.file.originalname);
      }

      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Document size must be less than 50MB",
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
