const path = require("path");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const commentRoutes = require("./routes/commentRoutes");

dotenv.config();

connectDB();

const app = express();

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://www.vaadsamvaad.com",
  "https://vaadsamvaad.com",
];

const extraOrigins = String(process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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

// ========================================
// TEST API
// ========================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VaadSamvaad API is running",
  });
});

// ========================================
// SERVER
// ========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});