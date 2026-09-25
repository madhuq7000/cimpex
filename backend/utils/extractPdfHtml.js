const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// pdf.js expects DOMMatrix in Node. Prefer native/canvas, else a minimal polyfill.
(() => {
  if (typeof globalThis.DOMMatrix !== "undefined") {
    return;
  }

  try {
    // Optional dependency — may be missing on some hosts.
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const canvas = require("canvas");
    if (canvas.DOMMatrix) {
      globalThis.DOMMatrix = canvas.DOMMatrix;
      return;
    }
  } catch (_error) {
    // fall through to polyfill
  }

  class DOMMatrixPolyfill {
    constructor(init) {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
      this.m11 = 1;
      this.m12 = 0;
      this.m13 = 0;
      this.m14 = 0;
      this.m21 = 0;
      this.m22 = 1;
      this.m23 = 0;
      this.m24 = 0;
      this.m31 = 0;
      this.m32 = 0;
      this.m33 = 1;
      this.m34 = 0;
      this.m41 = 0;
      this.m42 = 0;
      this.m43 = 0;
      this.m44 = 1;
      this.is2D = true;
      this.isIdentity = true;

      if (Array.isArray(init) && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        this.m11 = this.a;
        this.m12 = this.b;
        this.m21 = this.c;
        this.m22 = this.d;
        this.m41 = this.e;
        this.m42 = this.f;
        this.isIdentity =
          this.a === 1 &&
          this.b === 0 &&
          this.c === 0 &&
          this.d === 1 &&
          this.e === 0 &&
          this.f === 0;
      }
    }

    multiplySelf() {
      return this;
    }

    prependSelf() {
      return this;
    }

    invertSelf() {
      return this;
    }

    translateSelf() {
      return this;
    }

    scaleSelf() {
      return this;
    }

    rotateSelf() {
      return this;
    }
  }

  globalThis.DOMMatrix = DOMMatrixPolyfill;
})();

const { PNG } = require("pngjs");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

const discussionsUploadPath = path.join(__dirname, "..", "uploads", "discussions");
const MIN_IMAGE_SIZE = 60;
const MAX_PDF_IMAGES = 30;

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.js",
  );
} catch (error) {
  console.warn("PDF worker not configured:", error.message);
}

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const ensureUploadDir = () => {
  if (!fs.existsSync(discussionsUploadPath)) {
    fs.mkdirSync(discussionsUploadPath, { recursive: true });
  }
};

const publicImageSrc = (_imageBaseUrl, filename) => {
  // Always relative. Absolute hosts from the proxy are often http://127.0.0.1:3000
  // which browsers on the public site cannot load.
  return `/api/uploads/discussions/${filename}`;
};

const savePng = (pngBuffer) => {
  ensureUploadDir();
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.png`;
  fs.writeFileSync(path.join(discussionsUploadPath, filename), pngBuffer);
  return filename;
};

const rasterToPng = (image) => {
  const width = Number(image.width) || 0;
  const height = Number(image.height) || 0;
  const kind = Number(image.kind) || 0;
  const src = Buffer.from(image.data || []);

  if (!width || !height || !src.length) {
    return null;
  }

  if (src[0] === 0xff && src[1] === 0xd8) {
    ensureUploadDir();
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.jpg`;
    fs.writeFileSync(path.join(discussionsUploadPath, filename), src);
    return filename;
  }

  const png = new PNG({ width, height });

  if (kind === 3 && src.length >= width * height * 4) {
    src.copy(png.data, 0, 0, width * height * 4);
  } else if (kind === 2 && src.length >= width * height * 3) {
    let readIndex = 0;
    for (let writeIndex = 0; writeIndex < png.data.length; writeIndex += 4) {
      png.data[writeIndex] = src[readIndex];
      png.data[writeIndex + 1] = src[readIndex + 1];
      png.data[writeIndex + 2] = src[readIndex + 2];
      png.data[writeIndex + 3] = 255;
      readIndex += 3;
    }
  } else if (src.length >= width * height * 4) {
    src.copy(png.data, 0, 0, width * height * 4);
  } else if (src.length >= width * height * 3) {
    let readIndex = 0;
    for (let writeIndex = 0; writeIndex < png.data.length; writeIndex += 4) {
      png.data[writeIndex] = src[readIndex];
      png.data[writeIndex + 1] = src[readIndex + 1];
      png.data[writeIndex + 2] = src[readIndex + 2];
      png.data[writeIndex + 3] = 255;
      readIndex += 3;
    }
  } else {
    return null;
  }

  return savePng(PNG.sync.write(png));
};

const readPageObject = (page, name) =>
  new Promise((resolve) => {
    let settled = false;

    const finish = (value) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(value || null);
    };

    try {
      page.objs.get(name, finish);
    } catch (error) {
      finish(null);
    }

    setTimeout(() => finish(null), 1500);
  });

const extractPageImages = async (page, imageBaseUrl, options = {}) => {
  const { skipLargePageImages = false, pageWidth = 0, pageHeight = 0 } = options;
  const operatorList = await page.getOperatorList();
  const imageNames = [];

  for (let index = 0; index < operatorList.fnArray.length; index += 1) {
    const fn = operatorList.fnArray[index];
    const args = operatorList.argsArray[index] || [];

    if (
      fn === pdfjsLib.OPS.paintImageXObject ||
      fn === pdfjsLib.OPS.paintImageXObjectRepeat ||
      fn === pdfjsLib.OPS.paintJpegXObject ||
      fn === pdfjsLib.OPS.paintInlineImageXObject
    ) {
      const imageName = args[0];

      if (typeof imageName === "string" && !imageNames.includes(imageName)) {
        imageNames.push(imageName);
      }
    }
  }

  const htmlParts = [];

  for (const imageName of imageNames) {
    if (htmlParts.length >= MAX_PDF_IMAGES) {
      break;
    }

    const image = await readPageObject(page, imageName);

    if (!image || image.width < MIN_IMAGE_SIZE || image.height < MIN_IMAGE_SIZE) {
      continue;
    }

    // Full-page / near-page images create a paper frame with empty side margins.
    if (
      skipLargePageImages &&
      pageWidth > 0 &&
      pageHeight > 0 &&
      image.width >= pageWidth * 0.65 &&
      image.height >= pageHeight * 0.65
    ) {
      console.log("PDF full-page image skipped:", imageName, image.width, image.height);
      continue;
    }

    try {
      const filename = rasterToPng(image);

      if (!filename) {
        console.warn("PDF image skipped (unsupported raster):", imageName, {
          width: image.width,
          height: image.height,
          kind: image.kind,
        });
        continue;
      }

      const src = publicImageSrc(imageBaseUrl, filename);
      console.log("PDF image saved:", filename);
      htmlParts.push(`<p><img src="${src}" alt=""></p>`);
    } catch (error) {
      console.error("Failed to save PDF image:", error);

      try {
        const width = Number(image.width) || 0;
        const height = Number(image.height) || 0;
        const raw = Buffer.from(image.data || []);
        if (width && height && raw.length && raw.length < 1.5 * 1024 * 1024) {
          if (raw[0] === 0xff && raw[1] === 0xd8) {
            htmlParts.push(
              `<p><img src="data:image/jpeg;base64,${raw.toString("base64")}" alt=""></p>`,
            );
          }
        }
      } catch (embedError) {
        console.error("PDF image embed fallback failed:", embedError.message);
      }
    }
  }

  return htmlParts;
};

const mergePdfLinesIntoParagraphs = (lines) => {
  if (!lines.length) {
    return [];
  }

  const gaps = [];
  for (let index = 1; index < lines.length; index += 1) {
    const prevY = lines[index - 1].y;
    const nextY = lines[index].y;
    if (typeof prevY === "number" && typeof nextY === "number") {
      gaps.push(Math.abs(prevY - nextY));
    }
  }

  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const medianGap =
    sortedGaps.length > 0
      ? sortedGaps[Math.floor(sortedGaps.length / 2)]
      : 12;
  // Only start a new paragraph on clearly larger gaps (not normal line spacing).
  const paragraphGapThreshold = Math.max(medianGap * 1.85, medianGap + 10);

  const paragraphs = [];
  let bucket = [];

  const flush = () => {
    if (!bucket.length) {
      return;
    }

    let merged = "";
    bucket.forEach((line) => {
      const cleaned = String(line || "")
        .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
        .replace(/^\d+$/g, "") // drop lone page numbers
        .trim();

      if (!cleaned) {
        return;
      }

      if (!merged) {
        merged = cleaned;
        return;
      }

      if (/[A-Za-z0-9]-$/.test(merged) && /^[a-z]/.test(cleaned)) {
        merged = `${merged.slice(0, -1)}${cleaned}`;
        return;
      }

      merged = `${merged} ${cleaned}`;
    });

    merged = merged.replace(/\s+/g, " ").trim();
    if (merged) {
      paragraphs.push(merged);
    }
    bucket = [];
  };

  let previousY = null;
  lines.forEach((line) => {
    const y = typeof line.y === "number" ? line.y : null;
    if (
      previousY !== null &&
      y !== null &&
      Math.abs(previousY - y) > paragraphGapThreshold &&
      bucket.length
    ) {
      flush();
    }
    bucket.push(line.text);
    previousY = y;
  });
  flush();

  return paragraphs;
};

const extractPdfHtml = async (buffer, imageBaseUrl = "") => {
  const data = Buffer.isBuffer(buffer) ? new Uint8Array(buffer) : new Uint8Array(buffer || []);

  if (!data.length) {
    throw new Error("PDF file is empty");
  }

  const pdf = await pdfjsLib.getDocument({
    data,
    verbosity: 0,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  const htmlParts = [];
  let extractedImageCount = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const lines = [];
    let currentLine = "";
    let lastY = null;

    textContent.items.forEach((item) => {
      const y = item.transform ? item.transform[5] : null;
      const text = String(item.str || "");

      if (lastY !== null && y !== null && Math.abs(lastY - y) > 4 && currentLine.trim()) {
        lines.push({ text: currentLine.trim(), y: lastY });
        currentLine = text;
      } else {
        // pdf.js often omits spaces between text runs on the same line.
        const needsSpace =
          currentLine &&
          text &&
          !/\s$/.test(currentLine) &&
          !/^\s/.test(text) &&
          !/[-–—]$/.test(currentLine);
        currentLine += needsSpace ? ` ${text}` : text;
      }

      lastY = y;
    });

    if (currentLine.trim()) {
      lines.push({ text: currentLine.trim(), y: lastY });
    }

    const paragraphs = mergePdfLinesIntoParagraphs(lines);
    const pageHasText = paragraphs.length > 0;

    if (pageHasText) {
      htmlParts.push(
        paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join(""),
      );
    }

    if (extractedImageCount < MAX_PDF_IMAGES) {
      try {
        const images = await extractPageImages(page, imageBaseUrl, {
          // If we already have readable text, skip paper-sized images that
          // recreate the PDF page with large empty side margins.
          skipLargePageImages: pageHasText,
          pageWidth: viewport.width,
          pageHeight: viewport.height,
        });
        extractedImageCount += images.length;
        htmlParts.push(...images);
      } catch (imageError) {
        console.error("PDF page image extract failed:", imageError.message || imageError);
      }
    }
  }

  return htmlParts.join("").trim();
};

module.exports = {
  extractPdfHtml,
};
