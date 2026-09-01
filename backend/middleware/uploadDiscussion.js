// middleware/uploadProfile.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================
// PROFILE UPLOAD FOLDER
// ==========================================

const uploadPath = path.join(
  __dirname,
  "..",
  "uploads",
  "discussions",
);

// Create folder if it does not exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

// ==========================================
// STORAGE
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}`;

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    cb(
      null,
      `${uniqueName}${extension}`,
    );
  },
});

// ==========================================
// ALLOW ONLY IMAGES
// ==========================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG and WEBP image files are allowed",
      ),
      false,
    );
  }
};

// ==========================================
// CONFIGURE MULTER
// ==========================================

const uploadProfile = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = uploadProfile;