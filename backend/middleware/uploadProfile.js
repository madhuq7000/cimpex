// middleware/uploadProfile.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================
// PROFILE UPLOAD DIRECTORY
// backend/uploads/profiles/
// ==========================================

const uploadPath = path.join(
  __dirname,
  "..",
  "uploads",
  "profiles",
);

// ==========================================
// CREATE PROFILE DIRECTORY
// ==========================================

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });

  console.log(
    "Profile upload directory created:",
    uploadPath,
  );
}

// ==========================================
// STORAGE CONFIGURATION
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
      `profile-${uniqueName}${extension}`,
    );
  },
});

// ==========================================
// ALLOWED IMAGE TYPES
// ==========================================

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, JPEG, PNG and WEBP images are allowed",
    ),
    false,
  );
};

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const uploadProfile = multer({
  storage,

  fileFilter,

  limits: {
    // Maximum profile image size: 5 MB
    fileSize: 5 * 1024 * 1024,

    // Only one profile image
    files: 1,
  },
});

module.exports = uploadProfile;