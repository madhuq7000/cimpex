const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ✅ Correct path to src/uploads
const uploadPath = path.join(__dirname, "../uploads");

// ✅ create folder if not exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = upload;