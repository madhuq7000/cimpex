import { jsPDF } from "jspdf";
import DOMPurify from "dompurify";

import logoImage from "../../../assets/images/logo.png";

export interface DiscussionPdfComment {
  comment: string;
  createdBy?: {
    name?: string;
    email?: string;
  };
  createdAt?: string;
}

export interface DiscussionPdfData {
  title: string;
  description: string;
  categoryName?: string;
  authorName?: string;
  createdAt?: string;
  comments?: DiscussionPdfComment[];
}

const htmlToPlainText = (html: string) => {
  const container = document.createElement("div");
  container.innerHTML = DOMPurify.sanitize(html || "");

  return (container.textContent || container.innerText || "")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const toFileName = (title: string) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${slug || "discussion"}.pdf`;
};

const formatDate = (value?: string) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const loadLogoDataUrl = () =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Could not read logo"));
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => reject(new Error("Could not load logo"));
    image.src = logoImage;
  });

export const downloadDiscussionPdf = async (data: DiscussionPdfData) => {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 6;
  let y = 18;

  try {
    const logoDataUrl = await loadLogoDataUrl();
    const logoWidth = 24;
    const logoHeight = 12;

    doc.addImage(logoDataUrl, "PNG", margin, y - 6, logoWidth, logoHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(11, 71, 46);
    doc.text("VaadSamvaad", margin + logoWidth + 4, y + 2);

    y += logoHeight + 4;
  } catch (error) {
    console.error("PDF logo error:", error);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(11, 71, 46);
    doc.text("VaadSamvaad", margin, y);

    y += 8;
  }

  doc.setDrawColor(11, 71, 46);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  const ensureSpace = (needed = lineHeight) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addLines = (
    text: string,
    options?: {
      fontSize?: number;
      fontStyle?: "normal" | "bold";
      color?: [number, number, number];
    },
  ) => {
    const fontSize = options?.fontSize ?? 11;
    const fontStyle = options?.fontStyle ?? "normal";
    const color = options?.color ?? [33, 37, 41];

    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text || "-", maxWidth) as string[];

    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    });
  };

  addLines(data.title || "Discussion", {
    fontSize: 16,
    fontStyle: "bold",
  });

  y += 2;

  const metaParts = [
    data.categoryName ? `Category: ${data.categoryName}` : "",
    data.authorName ? `By: ${data.authorName}` : "",
    data.createdAt ? `Date: ${formatDate(data.createdAt)}` : "",
  ].filter(Boolean);

  if (metaParts.length) {
    addLines(metaParts.join("  |  "), {
      fontSize: 10,
      color: [108, 117, 125],
    });
  }

  y += 4;
  addLines("Description", {
    fontSize: 12,
    fontStyle: "bold",
  });
  y += 1;
  addLines(htmlToPlainText(data.description));

  const comments = data.comments || [];

  y += 6;
  addLines(`Comments (${comments.length})`, {
    fontSize: 12,
    fontStyle: "bold",
  });
  y += 1;

  if (!comments.length) {
    addLines("No comments yet.", {
      fontSize: 10,
      color: [108, 117, 125],
    });
  } else {
    comments.forEach((comment, index) => {
      y += 3;
      const author =
        comment.createdBy?.name || comment.createdBy?.email || "User";
      const stamped = [author, formatDate(comment.createdAt)]
        .filter(Boolean)
        .join("  |  ");

      addLines(`${index + 1}. ${stamped}`, {
        fontSize: 10,
        fontStyle: "bold",
      });
      addLines(comment.comment || "", {
        fontSize: 10,
      });
    });
  }

  doc.save(toFileName(data.title));
};
