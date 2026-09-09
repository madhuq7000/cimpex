// routes/authRoutes.js

const express = require("express");
const multer = require("multer");

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../auth-controllers/authController");
const {
  startGoogle,
  googleCallback,
  startFacebook,
  facebookCallback,
} = require("../auth-controllers/socialAuth");
const { protect } = require("../middleware/authMiddleware");

const uploadProfile = require("../middleware/uploadProfile");

const router = express.Router();

// ==========================================
// PROFILE IMAGE UPLOAD HANDLER
// ==========================================

const handleProfileUpload = (req, res, next) => {
  uploadProfile.single("profileImage")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: "Profile image upload failed",
        error: error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile image",
        error: error.message,
      });
    }

    next();
  });
};

// ==========================================
// REGISTER
// ==========================================

router.post(
  "/register",
  handleProfileUpload,
  register,
);

// ==========================================
// LOGIN
// ==========================================

router.post(
  "/login",
  login,
);

router.post(
  "/forgot-password",
  forgotPassword,
);

router.post(
  "/reset-password",
  resetPassword,
);

router.get("/me", protect, getMe);

router.get("/google", startGoogle);
router.get("/google/callback", googleCallback);
router.get("/facebook", startFacebook);
router.get("/facebook/callback", facebookCallback);

module.exports = router;