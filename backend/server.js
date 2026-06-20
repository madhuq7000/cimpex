require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = require("./src/app");

// =====================================
// ✅ ENABLE CORS (important)
// =====================================
app.use(cors());

// =====================================
// ✅ SERVE UPLOADS (WRITE HERE)
// =====================================
const uploadsPath = path.resolve(__dirname, "src", "uploads");

app.use(
  "/uploads",
  express.static(uploadsPath, {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// =====================================
// ✅ START SERVER
// =====================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});