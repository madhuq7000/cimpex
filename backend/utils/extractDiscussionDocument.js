const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const WordExtractor = require("word-extractor");
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const { extractPdfHtml } = require("./extractPdfHtml");

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 50000;
const MAX_HTML_LENGTH = 200000;
const discussionsUploadPath = path.join(__dirname, "..", "uploads", "discussions");

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

const htmlToText = (html) =>
  String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleFromFileName = (originalName = "") => {
  const base = path.basename(originalName, path.extname(originalName)).trim();
  return (base || "Imported document").slice(0, MAX_TITLE_LENGTH);
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

const extensionForImageType = (contentType = "") => {
  if (contentType.includes("png")) {
    return ".png";
  }

  if (contentType.includes("gif")) {
    return ".gif";
  }

  if (contentType.includes("webp")) {
    return ".webp";
  }

  return ".jpg";
};

const styleMap = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Subtitle'] => h2:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
  "r[style-name='Intense Emphasis'] => em",
];

const stripImageSizing = (html) =>
  String(html || "").replace(/<img\b([^>]*)>/gi, (_, attrs) => {
    const next = String(attrs || "")
      .replace(/\s(?:width|height)\s*=\s*(["'])[\s\S]*?\1/gi, "")
      .replace(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi, (match, quote, css) => {
        const filtered = String(css)
          .split(";")
          .map((rule) => rule.trim())
          .filter((rule) => {
            const name = rule.split(":")[0].trim().toLowerCase();
            return (
              name &&
              name !== "width" &&
              name !== "height" &&
              name !== "max-width" &&
              name !== "min-width"
            );
          })
          .join("; ");

        return filtered ? ` style=${quote}${filtered}${quote}` : "";
      });

    return `<img${next}>`;
  });

const extractDocxHtml = async (buffer, imageBaseUrl = "") => {
  if (!fs.existsSync(discussionsUploadPath)) {
    fs.mkdirSync(discussionsUploadPath, { recursive: true });
  }

  const convertImage = mammoth.images.imgElement(async (image) => {
    const imageBuffer = await image.read();
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extensionForImageType(
      image.contentType,
    )}`;

    fs.writeFileSync(path.join(discussionsUploadPath, filename), imageBuffer);

    const origin = String(imageBaseUrl || "").replace(/\/+$/, "");
    const src = origin
      ? `${origin}/uploads/discussions/${filename}`
      : `/uploads/discussions/${filename}`;

    return {
      src,
      alt: "",
    };
  });

  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage,
      styleMap,
      includeDefaultStyleMap: true,
      ignoreEmptyParagraphs: false,
    },
  );

  return stripImageSizing(String(result?.value || "").trim());
};

const extractDoc = async (buffer) => {
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);
  return document.getBody() || "";
};

const getExtension = (originalName = "") =>
  path.extname(originalName).toLowerCase();

const extractDiscussionDocument = async (file, imageBaseUrl = "") => {
  const extension = getExtension(file.originalname);
  const mimeType = file.mimetype || "";
  const buffer = file.buffer;

  const isPdf = extension === ".pdf" || mimeType === "application/pdf";

  const isDocx =
    extension === ".docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const isDoc = extension === ".doc" || mimeType === "application/msword";

  if (isDocx) {
    const html = await extractDocxHtml(buffer, imageBaseUrl);
    const text = htmlToText(html);
    const hasImages = /<img\s/i.test(html);

    if (!text && !hasImages) {
      const error = new Error(
        "Could not read any text from this document. Please check the file and try again.",
      );
      error.statusCode = 400;
      throw error;
    }

    return {
      title: (text || titleFromFileName(file.originalname)).slice(0, MAX_TITLE_LENGTH),
      description: (html || "<p></p>").slice(0, MAX_HTML_LENGTH),
    };
  }

  if (isPdf) {
    let html = "";

    try {
      html = await extractPdfHtml(buffer, imageBaseUrl);
    } catch (error) {
      console.error("PDF HTML extract failed:", error);
      const text = await extractPdfText(buffer);
      const { title, body } = splitTitleAndBody(text);
      return {
        title: title || titleFromFileName(file.originalname),
        description: textToHtml(body),
      };
    }

    const text = htmlToText(html);
    const hasImages = /<img\s/i.test(html);

    if (!text && !hasImages) {
      const error = new Error(
        "Could not read any text or images from this PDF. Please check the file and try again.",
      );
      error.statusCode = 400;
      throw error;
    }

    return {
      title: (text || titleFromFileName(file.originalname)).slice(
        0,
        MAX_TITLE_LENGTH,
      ),
      description: (html || "<p></p>").slice(0, MAX_HTML_LENGTH),
    };
  }

  let text = "";

  try {
    if (isPdf) {
      text = await extractPdfText(buffer);
    } else if (isDoc) {
      text = await extractDoc(buffer);
    } else {
      const error = new Error("Only PDF, DOC and DOCX files are allowed");
      error.statusCode = 400;
      throw error;
    }
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    console.error("Document extract failed:", error);

    return {
      title: titleFromFileName(file.originalname),
      description: "<p></p>",
    };
  }

  const normalized = String(text || "").trim();

  if (!normalized) {
    return {
      title: titleFromFileName(file.originalname),
      description: "<p></p>",
    };
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
