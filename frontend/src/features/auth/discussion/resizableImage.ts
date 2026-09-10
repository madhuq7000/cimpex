import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";

import ResizableImageView from "./ResizableImageView";

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

          let margin = "margin-left: 0; margin-right: auto;";
          if (align === "center") {
            margin = "margin-left: auto; margin-right: auto;";
          } else if (align === "right") {
            margin = "margin-left: auto; margin-right: 0;";
          }

          return {
            "data-align": align,
            style: `display: block; width: ${cssWidth}; height: auto; max-width: 100%; ${margin}`,
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
            ".resizable-image-toolbar, .resizable-image-handle, .resizable-image-size, .resizable-image-delete, .resizable-image-align",
          ),
        );
      },
    });
  },
});

export default ResizableImage;
