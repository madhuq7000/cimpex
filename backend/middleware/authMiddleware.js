const jwt = require("jsonwebtoken");

const User = require("../models/User");

const attachUserFromToken = async (req) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.split(" ")[1];

  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select("-password");

  return user || null;
};

const protect = async (req, res, next) => {
  try {
    const user = await attachUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        message: "Authentication token is required",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

const optionalProtect = async (req, res, next) => {
  try {
    req.user = await attachUserFromToken(req);
  } catch {
    req.user = null;
  }

  next();
};

module.exports = {
  protect,
  optionalProtect,
};
