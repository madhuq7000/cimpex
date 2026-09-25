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

router.get("/oauth-config", (req, res) => {
  const localApi = String(
    process.env.LOCAL_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3000}`,
  ).replace(/\/+$/, "");
  const publicApi = String(
    process.env.PUBLIC_API_URL || "https://www.amarsavimarsa.com",
  ).replace(/\/+$/, "");
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "http")
    .split(",")[0]
    .trim();
  const host = String(req.headers["x-forwarded-host"] || req.get("host") || "").trim();

  return res.status(200).json({
    success: true,
    data: {
      publicApiUrl: process.env.PUBLIC_API_URL || null,
      localPublicApiUrl: process.env.LOCAL_PUBLIC_API_URL || localApi,
      clientUrl: process.env.CLIENT_URL || null,
      nodeEnv: process.env.NODE_ENV || null,
      requestHost: host,
      requestProto: proto,
      googleConfigured: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      ),
      facebookConfigured: Boolean(
        process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET,
      ),
      localGoogleRedirectUri: `${localApi}/api/auth/google/callback`,
      liveGoogleRedirectUri: `${publicApi}/api/auth/google/callback`,
      localFacebookRedirectUri: `${localApi}/api/auth/facebook/callback`,
      liveFacebookRedirectUri: `${publicApi}/api/auth/facebook/callback`,
      note: "Add BOTH local and live redirect URIs in Google/Meta. App picks automatically from the browser origin.",
    },
  });
});

router.get("/google", startGoogle);
router.get("/google/callback", googleCallback);
router.get("/facebook", startFacebook);
router.get("/facebook/callback", facebookCallback);

module.exports = router;