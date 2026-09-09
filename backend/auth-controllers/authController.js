const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const createToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

// ==========================================
// REGISTER
// ==========================================

const register = async (req, res) => {
  try {
    console.log("========== REGISTER ==========");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      fullName,
      name,
      email,
      password,
    } = req.body || {};

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // ==========================================
    // CHECK EXISTING USER
    // ==========================================

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(
      password,
      12,
    );

    // ==========================================
    // PROFILE IMAGE
    // ==========================================

    const profileImage = req.file
      ? req.file.filename
      : "default-profile.png";

    // ==========================================
    // CREATE USER
    // ==========================================

    const user = await User.create({
      fullName: fullName || "",
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      profileImage,
    });

    // ==========================================
    // CREATE TOKEN
    // ==========================================

    const token = createToken(user._id);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "User registered successfully",

      token,

      user: {
        id: user._id,
        fullName: user.fullName,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// ==========================================
// LOGIN
// ==========================================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body || {};

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({
        message: "This account is inactive",
      });
    }

    // ==========================================
    // CHECK PASSWORD
    // ==========================================

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ==========================================
    // CREATE TOKEN
    // ==========================================

    const token = createToken(user._id);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        fullName: user.fullName,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage:
          user.profileImage ||
          "default-profile.png",
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = (req.body?.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists for this email, you can reset the password.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Use the reset form to choose a new password.",
      resetToken,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not start password reset",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = req.body?.token || "";
    const password = req.body?.password || "";

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        message: "This reset link is invalid or has expired",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not reset password",
      error: error.message,
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || "default-profile.png",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not load account",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
};