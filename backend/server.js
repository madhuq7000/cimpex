const path = require("path");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const commentRoutes = require("./routes/commentRoutes");
const competitionRoutes = require("./routes/competitionRoutes");

dotenv.config({ path: path.join(__dirname, ".env") });

connectDB();

const app = express();

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
  "https://www.amarsavimarsa.com",
  "https://amarsavimarsa.com",
];

const extraOrigins = String(process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

const isLocalBrowserOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isLocalBrowserOrigin(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// ========================================
// BODY PARSER
// ========================================
app.use(express.json());

// ========================================
// STATIC UPLOADS
// ========================================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads")),
);

// ========================================
// AUTH ROUTES
// ========================================
app.use("/api/auth", authRoutes);

// ========================================
// CATEGORY ROUTES
// ========================================
app.use("/api/categories", categoryRoutes);

// ========================================
// DISCUSSION ROUTES
// ========================================
app.use("/api/discussions", discussionRoutes);

// ========================================
// COMMENT ROUTES
// ========================================
app.use("/api/comments", commentRoutes);

app.use("/api/competitions", competitionRoutes);

// ========================================
// TEST API
// ========================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Amarsa Vimarsa API is running",
  });
});

// ========================================
// SERVER
// ========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});