const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Upload folder
const uploadPath = path.join(__dirname, "/uploads/discussions/${req.file.filename}");


// Create folder if it does not exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const extension = path.extname(file.originalname);

    cb(null, `${uniqueName}${extension}`);
  },
});

// Allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Configure Multer
const uploadDiscussion = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = uploadDiscussion;
