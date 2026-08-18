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

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Parse JSON request body
// This must come before all API routes
app.use(express.json());

// Make uploaded files publicly accessible
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Authentication APIs
app.use("/api/auth", authRoutes);

// Category APIs
app.use("/api/categories", categoryRoutes);

// Discussion APIs
app.use("/api/discussions", discussionRoutes);
app.use("/api/comments", commentRoutes);

// Test API
app.get("/", (req, res) => {
  res.status(200).json({
    message: "VaadSamvaad API is running",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
