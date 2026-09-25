import type { Editor } from "@tiptap/react";
import type { FC } from "react";

const FONT_SIZES = [
  { label: "Default", value: "" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
];

const TEXT_COLORS = [
  "#111827",
  "#2e3094",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0891b2",
  "#7c3aed",
  "#db2777",
];

interface EditorToolbarProps {
  editor: Editor | null;
  onSetLink?: () => void;
  onRemoveLink?: () => void;
  onEmoji?: () => void;
  showImageAlign?: boolean;
}

const EditorToolbar: FC<EditorToolbarProps> = ({
  editor,
  onSetLink,
  onRemoveLink,
  onEmoji,
  showImageAlign = false,
}) => {
  const currentFontSize =
    (editor?.getAttributes("textStyle")?.fontSize as string | undefined) || "";
  const currentColor =
    (editor?.getAttributes("textStyle")?.color as string | undefined) ||
    "#111827";

  return (
    <div className="editor-toolbar">
      <button
        type="button"
        className={`editor-tool ${editor?.isActive("bold") ? "active" : ""}`}
        title="Bold"
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <i className="bi bi-type-bold"></i>
      </button>

      <button
        type="button"
        className={`editor-tool ${editor?.isActive("italic") ? "active" : ""}`}
        title="Italic"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <i className="bi bi-type-italic"></i>
      </button>

      <button
        type="button"
        className={`editor-tool ${
          editor?.isActive("bulletList") ? "active" : ""
        }`}
        title="Bullet List"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <i className="bi bi-list-ul"></i>
      </button>

      <button
        type="button"
        className={`editor-tool ${
          editor?.isActive("blockquote") ? "active" : ""
        }`}
        title="Quote"
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <i className="bi bi-quote"></i>
      </button>

      {onSetLink ? (
        <button
          type="button"
          className={`editor-tool ${editor?.isActive("link") ? "active" : ""}`}
          title="Add Link"
          onClick={onSetLink}
        >
          <i className="bi bi-link-45deg"></i>
        </button>
      ) : null}

      <button
        type="button"
        className={`editor-tool ${
          editor?.isActive({ textAlign: "left" }) ? "active" : ""
        }`}
        title="Align left"
        onClick={() => editor?.chain().focus().setTextAlign("left").run()}
      >
        <i className="bi bi-text-left"></i>
      </button>

      <button
        type="button"
        className={`editor-tool ${
          editor?.isActive({ textAlign: "center" }) ? "active" : ""
        }`}
        title="Align center"
        onClick={() => editor?.chain().focus().setTextAlign("center").run()}
      >
        <i className="bi bi-text-center"></i>
      </button>

      <button
        type="button"
        className={`editor-tool ${
          editor?.isActive({ textAlign: "right" }) ? "active" : ""
        }`}
        title="Align right"
        onClick={() => editor?.chain().focus().setTextAlign("right").run()}
      >
        <i className="bi bi-text-right"></i>
      </button>

      <button
        type="button"
        className={`editor-tool ${
          editor?.isActive({ textAlign: "justify" }) ? "active" : ""
        }`}
        title="Justify"
        onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
      >
        <i className="bi bi-justify"></i>
      </button>

      <label className="editor-tool editor-tool-select" title="Text size">
        <i className="bi bi-fonts"></i>
        <select
          aria-label="Text size"
          value={currentFontSize}
          onChange={(event) => {
            const value = event.target.value;
            if (!editor) {
              return;
            }
            if (!value) {
              editor.chain().focus().unsetFontSize().run();
              return;
            }
            editor.chain().focus().setFontSize(value).run();
          }}
        >
          {FONT_SIZES.map((size) => (
            <option key={size.label} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </label>

      <label className="editor-tool editor-tool-color" title="Text color">
        <i className="bi bi-palette"></i>
        <input
          type="color"
          aria-label="Text color"
          value={currentColor.startsWith("#") ? currentColor : "#111827"}
          onChange={(event) =>
            editor?.chain().focus().setColor(event.target.value).run()
          }
        />
      </label>

      <div className="editor-color-swatches" aria-label="Quick colors">
        {TEXT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`editor-color-swatch${
              currentColor === color ? " active" : ""
            }`}
            style={{ backgroundColor: color }}
            title={color}
            onClick={() => editor?.chain().focus().setColor(color).run()}
          />
        ))}
        <button
          type="button"
          className="editor-tool"
          title="Reset color"
          onClick={() => editor?.chain().focus().unsetColor().run()}
        >
          <i className="bi bi-eraser"></i>
        </button>
      </div>

      {showImageAlign && editor?.isActive("image") ? (
        <>
          <button
            type="button"
            className={`editor-tool ${
              editor.isActive("image", { align: "left" }) ? "active" : ""
            }`}
            title="Align image left"
            onClick={() =>
              editor
                .chain()
                .focus()
                .updateAttributes("image", { align: "left" })
                .run()
            }
          >
            <i className="bi bi-text-left"></i>
          </button>
          <button
            type="button"
            className={`editor-tool ${
              editor.isActive("image", { align: "center" }) ? "active" : ""
            }`}
            title="Align image center"
            onClick={() =>
              editor
                .chain()
                .focus()
                .updateAttributes("image", { align: "center" })
                .run()
            }
          >
            <i className="bi bi-text-center"></i>
          </button>
          <button
            type="button"
            className={`editor-tool ${
              editor.isActive("image", { align: "right" }) ? "active" : ""
            }`}
            title="Align image right"
            onClick={() =>
              editor
                .chain()
                .focus()
                .updateAttributes("image", { align: "right" })
                .run()
            }
          >
            <i className="bi bi-text-right"></i>
          </button>
        </>
      ) : null}

      {editor?.isActive("link") && onRemoveLink ? (
        <button
          type="button"
          className="editor-tool"
          title="Remove Link"
          onClick={onRemoveLink}
        >
          <i className="bi bi-link-45deg"></i>
          <span style={{ fontSize: "10px" }}>×</span>
        </button>
      ) : null}

      {onEmoji ? (
        <button
          type="button"
          className="editor-tool"
          title="Emoji"
          onClick={onEmoji}
        >
          <i className="bi bi-emoji-smile"></i>
        </button>
      ) : null}
    </div>
  );
};

export default EditorToolbar;
