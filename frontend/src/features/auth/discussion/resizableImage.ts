import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";

import ResizableImageView from "./ResizableImageView";

const NORMALIZE_ROTATE = (value: unknown) => {
  const degrees = Number.parseInt(String(value ?? 0), 10);

  if (degrees === 90 || degrees === 180 || degrees === 270) {
    return degrees;
  }

  return 0;
};

const ResizableImage = Image.extend({
  name: "image",
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "60%",
        parseHTML: (element) =>
          element.getAttribute("width") || element.style.width || "60%",
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }

          const width = String(attributes.width);
          const cssWidth = /^\d+$/.test(width) ? `${width}px` : width;

          return {
            width: cssWidth,
          };
        },
      },
      align: {
        default: "left",
        parseHTML: (element) => {
          const dataAlign = element.getAttribute("data-align");

          if (dataAlign === "center" || dataAlign === "right" || dataAlign === "left") {
            return dataAlign;
          }

          const parent = element.parentElement;
          const textAlign =
            element.style.textAlign ||
            parent?.style?.textAlign ||
            parent?.getAttribute("data-align") ||
            "";

          if (textAlign.includes("center")) {
            return "center";
          }

          if (textAlign.includes("right")) {
            return "right";
          }

          const style = element.getAttribute("style") || "";

          if (/margin-left\s*:\s*auto/i.test(style) && /margin-right\s*:\s*auto/i.test(style)) {
            return "center";
          }

          if (/margin-left\s*:\s*auto/i.test(style)) {
            return "right";
          }

          return "left";
        },
        renderHTML: (attributes) => {
          const align = attributes.align || "left";
          const width = String(attributes.width || "60%");
          const cssWidth = /^\d+$/.test(width) ? `${width}px` : width;
          const rotate = NORMALIZE_ROTATE(attributes.rotate);

          let margin = "margin-left: 0; margin-right: auto;";
          if (align === "center") {
            margin = "margin-left: auto; margin-right: auto;";
          } else if (align === "right") {
            margin = "margin-left: auto; margin-right: 0;";
          }

          const transform = rotate ? ` transform: rotate(${rotate}deg);` : "";

          return {
            "data-align": align,
            style: `display: block; width: ${cssWidth}; height: auto; max-width: 100%; ${margin}${transform}`,
          };
        },
      },
      rotate: {
        default: 0,
        parseHTML: (element) => {
          const dataRotate = element.getAttribute("data-rotate");

          if (dataRotate != null) {
            return NORMALIZE_ROTATE(dataRotate);
          }

          const style = element.getAttribute("style") || "";
          const match = style.match(/rotate\(\s*(-?\d+(?:\.\d+)?)deg\s*\)/i);

          if (match) {
            const normalized = ((Number.parseFloat(match[1]) % 360) + 360) % 360;
            return NORMALIZE_ROTATE(Math.round(normalized / 90) * 90);
          }

          return 0;
        },
        renderHTML: (attributes) => {
          const rotate = NORMALIZE_ROTATE(attributes.rotate);

          if (!rotate) {
            return {};
          }

          return {
            "data-rotate": String(rotate),
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView, {
      className: "resizable-image-node",
      stopEvent: ({ event }) => {
        const target = event.target as HTMLElement | null;
        return Boolean(
          target?.closest(
            ".resizable-image-toolbar, .resizable-image-handle, .resizable-image-size, .resizable-image-delete, .resizable-image-align, .resizable-image-rotate",
          ),
        );
      },
    });
  },
});

export default ResizableImage;
