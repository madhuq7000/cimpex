const path = require("path");
const mammoth = require("mammoth");
const WordExtractor = require("word-extractor");
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5000;

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const textToHtml = (text) => {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return "<p></p>";
  }

  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
};

const splitTitleAndBody = (text) => {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return {
      title: "",
      body: "",
    };
  }

  const title = lines[0].slice(0, MAX_TITLE_LENGTH).trim();
  const remaining = lines.slice(1).join("\n\n") || lines[0];
  const body = remaining.slice(0, MAX_DESCRIPTION_LENGTH).trim();

  return {
    title,
    body,
  };
};

const extractPdfText = async (buffer) => {
  const result = await pdfParse(buffer);
  return String(result?.text || "")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
    .trim();
};

const extractDocx = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result?.value || "";
};

const extractDoc = async (buffer) => {
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);
  return document.getBody() || "";
};

const getExtension = (originalName = "") =>
  path.extname(originalName).toLowerCase();

const extractDiscussionDocument = async (file) => {
  const extension = getExtension(file.originalname);
  const mimeType = file.mimetype || "";
  const buffer = file.buffer;

  let text = "";

  const isPdf =
    extension === ".pdf" || mimeType === "application/pdf";

  const isDocx =
    extension === ".docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const isDoc =
    extension === ".doc" || mimeType === "application/msword";

  if (isPdf) {
    text = await extractPdfText(buffer);
  } else if (isDocx) {
    text = await extractDocx(buffer);
  } else if (isDoc) {
    text = await extractDoc(buffer);
  } else {
    const error = new Error("Only PDF, DOC and DOCX files are allowed");
    error.statusCode = 400;
    throw error;
  }

  const normalized = String(text || "").trim();

  if (!normalized) {
    const error = new Error(
      "Could not read any text from this document. Please check the file and try again.",
    );
    error.statusCode = 400;
    throw error;
  }

  const { title, body } = splitTitleAndBody(normalized);

  return {
    title,
    description: textToHtml(body),
  };
};

module.exports = {
  extractDiscussionDocument,
};
