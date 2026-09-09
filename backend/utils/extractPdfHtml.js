const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
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

const publicImageSrc = (imageBaseUrl, filename) => {
  const origin = String(imageBaseUrl || "").replace(/\/+$/, "");
  return origin
    ? `${origin}/uploads/discussions/${filename}`
    : `/uploads/discussions/${filename}`;
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

const extractPageImages = async (page, imageBaseUrl) => {
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

    try {
      const filename = rasterToPng(image);

      if (!filename) {
        continue;
      }

      const src = publicImageSrc(imageBaseUrl, filename);
      htmlParts.push(`<p><img src="${src}" alt=""></p>`);
    } catch (error) {
      console.error("Failed to save PDF image:", error);
    }
  }

  return htmlParts;
};

const extractPdfHtml = async (buffer, imageBaseUrl = "") => {
  const data = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({
    data,
    verbosity: 0,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const htmlParts = [];
  let extractedImageCount = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const lines = [];
    let currentLine = "";
    let lastY = null;

    textContent.items.forEach((item) => {
      const y = item.transform ? item.transform[5] : null;
      const text = String(item.str || "");

      if (lastY !== null && y !== null && Math.abs(lastY - y) > 4 && currentLine.trim()) {
        lines.push(currentLine.trim());
        currentLine = text;
      } else {
        currentLine += text;
      }

      lastY = y;
    });

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    const pageText = lines
      .join("\n")
      .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
      .trim();

    if (pageText) {
      htmlParts.push(
        pageText
          .split(/\n+/)
          .map((line) => `<p>${escapeHtml(line)}</p>`)
          .join(""),
      );
    }

    if (extractedImageCount < MAX_PDF_IMAGES) {
      const images = await extractPageImages(page, imageBaseUrl);
      extractedImageCount += images.length;
      htmlParts.push(...images);
    }
  }

  return htmlParts.join("").trim();
};

module.exports = {
  extractPdfHtml,
};
