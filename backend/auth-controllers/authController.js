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

module.exports = {
  register,
  login,
};