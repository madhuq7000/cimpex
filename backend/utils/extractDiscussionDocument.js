const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const WordExtractor = require("word-extractor");
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 50000;
const MAX_HTML_LENGTH = 200000;
const discussionsUploadPath = path.join(__dirname, "..", "uploads", "discussions");

const loadExtractPdfHtml = () => {
  // Lazy-load so DOCX/DOC import still works if PDF libs fail on the host.
  // eslint-disable-next-line global-require
  const { extractPdfHtml } = require("./extractPdfHtml");
  return extractPdfHtml;
};

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

const normalizeImportedHtmlSpacing = (html) =>
  String(html || "")
    .replace(/<p>\s*(?:&nbsp;|\u00a0|\s|<br\s*\/?>)*\s*<\/p>/gi, "")
    .replace(/(<\/p>)\s*(<p\b)/gi, "$1$2")
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>")
    .trim();

const ensureUploadDir = () => {
  if (!fs.existsSync(discussionsUploadPath)) {
    fs.mkdirSync(discussionsUploadPath, { recursive: true });
  }
};

const saveDocxImage = async (image, _imageBaseUrl = "") => {
  const imageBuffer = await image.read();
  const contentType = image.contentType || "image/png";

  try {
    ensureUploadDir();
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extensionForImageType(
      contentType,
    )}`;
    fs.writeFileSync(path.join(discussionsUploadPath, filename), imageBuffer);

    // Relative path only — never use proxy host (often 127.0.0.1 on live).
    return {
      src: `/api/uploads/discussions/${filename}`,
      alt: "",
    };
  } catch (writeError) {
    console.error("DOCX image disk write failed, using data URL:", writeError.message);
    const base64 = Buffer.from(imageBuffer).toString("base64");
    return {
      src: `data:${contentType};base64,${base64}`,
      alt: "",
    };
  }
};

const extractDocxHtml = async (buffer, imageBaseUrl = "") => {
  const convertImage = mammoth.images.imgElement(async (image) =>
    saveDocxImage(image, imageBaseUrl),
  );

  try {
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage,
        styleMap,
        includeDefaultStyleMap: true,
        ignoreEmptyParagraphs: true,
      },
    );

    return normalizeImportedHtmlSpacing(
      stripImageSizing(String(result?.value || "").trim()),
    );
  } catch (withImagesError) {
    console.error("DOCX HTML with images failed, retrying text-only:", withImagesError.message);

    const result = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap,
        includeDefaultStyleMap: true,
        ignoreEmptyParagraphs: true,
        convertImage: mammoth.images.imgElement(async () => ({
          src: "",
          alt: "",
        })),
      },
    );

    return normalizeImportedHtmlSpacing(
      stripImageSizing(
        String(result?.value || "")
          .replace(/<img\b[^>]*>/gi, "")
          .trim(),
      ),
    );
  }
};

const extractDoc = async (buffer) => {
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);
  return document.getBody() || "";
};

const getExtension = (originalName = "") =>
  path.extname(originalName).toLowerCase();

const emptyResult = (originalName) => ({
  title: titleFromFileName(originalName),
  description: "<p></p>",
});

const extractDiscussionDocument = async (file, imageBaseUrl = "") => {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer) || !file.buffer.length) {
    const error = new Error("Uploaded document is empty or missing. Please try again.");
    error.statusCode = 400;
    throw error;
  }

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
    try {
      const html = await extractDocxHtml(buffer, imageBaseUrl);
      const text = htmlToText(html);
      const hasImages = /<img\s/i.test(html);

      if (!text && !hasImages) {
        return emptyResult(file.originalname);
      }

      const { title } = splitTitleAndBody(text || titleFromFileName(file.originalname));

      return {
        title: (title || titleFromFileName(file.originalname)).slice(0, MAX_TITLE_LENGTH),
        description: normalizeImportedHtmlSpacing(html || "<p></p>").slice(
          0,
          MAX_HTML_LENGTH,
        ),
      };
    } catch (docxError) {
      console.error("DOCX extract failed:", docxError);
      const error = new Error(
        "Could not read this Word document. Please try saving it as DOCX again, or paste the text manually.",
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if (isPdf) {
    let html = "";

    try {
      html = await loadExtractPdfHtml()(buffer, imageBaseUrl);
    } catch (pdfHtmlError) {
      console.error("PDF HTML extract failed:", pdfHtmlError.message || pdfHtmlError);

      try {
        const text = await extractPdfText(buffer);
        if (!text.trim()) {
          return emptyResult(file.originalname);
        }

        const { title, body } = splitTitleAndBody(text);
        return {
          title: title || titleFromFileName(file.originalname),
          description: textToHtml(body),
        };
      } catch (pdfTextError) {
        console.error("PDF text extract failed:", pdfTextError.message || pdfTextError);
        const error = new Error(
          "Could not read this PDF on the server. Try a text-based PDF, or paste the content manually.",
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const text = htmlToText(html);
    const hasImages = /<img\s/i.test(html);

    if (!text && !hasImages) {
      return emptyResult(file.originalname);
    }

    return {
      title: (text || titleFromFileName(file.originalname)).slice(0, MAX_TITLE_LENGTH),
      description: normalizeImportedHtmlSpacing(html || "<p></p>").slice(
        0,
        MAX_HTML_LENGTH,
      ),
    };
  }

  if (isDoc) {
    try {
      const text = await extractDoc(buffer);
      const normalized = String(text || "").trim();

      if (!normalized) {
        return emptyResult(file.originalname);
      }

      const { title, body } = splitTitleAndBody(normalized);
      return {
        title,
        description: textToHtml(body),
      };
    } catch (docError) {
      console.error("DOC extract failed:", docError.message || docError);
      const error = new Error(
        "Could not read this .doc file. Please convert it to DOCX or PDF and try again.",
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const error = new Error("Only PDF, DOC and DOCX files are allowed");
  error.statusCode = 400;
  throw error;
};

module.exports = {
  extractDiscussionDocument,
};
