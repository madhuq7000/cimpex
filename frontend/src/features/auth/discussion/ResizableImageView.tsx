import { useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";

const MIN_PERCENT = 20;
const MAX_PERCENT = 100;
const STEP_PERCENT = 10;

type ImageAlign = "left" | "center" | "right";

const parseWidthPercent = (value?: string | null) => {
  const numeric = Number.parseFloat(String(value || "60"));

  if (Number.isNaN(numeric)) {
    return 60;
  }

  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(numeric)));
};

const alignMarginStyle = (align: ImageAlign): CSSProperties => {
  if (align === "center") {
    return { marginLeft: "auto", marginRight: "auto" };
  }

  if (align === "right") {
    return { marginLeft: "auto", marginRight: 0 };
  }

  return { marginLeft: 0, marginRight: "auto" };
};

const ResizableImageView = ({
  node,
  updateAttributes,
  selected,
  editor,
  deleteNode,
}: NodeViewProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const containerWidth = useRef(0);

  const widthPercent = parseWidthPercent(node.attrs.width);
  const align = (node.attrs.align || "left") as ImageAlign;

  const setWidthPercent = (next: number) => {
    const clamped = Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(next)));
    updateAttributes({ width: `${clamped}%` });
  };

  const setAlign = (next: ImageAlign) => {
    updateAttributes({ align: next });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!editor.isEditable) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const image = imageRef.current;
    const wrapper = wrapperRef.current;
    const container = image?.closest(".ProseMirror") as HTMLElement | null;

    if (!image || !wrapper || !container) {
      return;
    }

    startX.current = event.clientX;
    startWidth.current = wrapper.getBoundingClientRect().width;
    containerWidth.current = container.clientWidth || startWidth.current;

    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const delta = moveEvent.clientX - startX.current;
      const nextPercent = Math.min(
        MAX_PERCENT,
        Math.max(
          MIN_PERCENT,
          ((startWidth.current + delta) / containerWidth.current) * 100,
        ),
      );

      wrapper.style.width = `${nextPercent}%`;
    };

    const finish = (upEvent: PointerEvent) => {
      handle.releasePointerCapture(upEvent.pointerId);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", finish);

      const delta = upEvent.clientX - startX.current;
      const nextPercent = Math.min(
        MAX_PERCENT,
        Math.max(
          MIN_PERCENT,
          ((startWidth.current + delta) / containerWidth.current) * 100,
        ),
      );

      setWidthPercent(nextPercent);
    };

    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  };

  return (
    <NodeViewWrapper
      as="div"
      className={`resizable-image is-align-${align}${selected ? " is-selected" : ""}`}
      data-align={align}
      draggable={false}
      ref={wrapperRef}
      style={{
        width: `${widthPercent}%`,
        maxWidth: "100%",
        display: "block",
        ...alignMarginStyle(align),
      }}
    >
      {editor.isEditable ? (
        <button
          type="button"
          className="resizable-image-move"
          title="Drag up or down"
          data-drag-handle
          draggable
          contentEditable={false}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          ⋮⋮
        </button>
      ) : null}

      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        title={node.attrs.title || ""}
        draggable={false}
        data-align={align}
        style={{ width: "100%", height: "auto", maxWidth: "100%", display: "block" }}
      />

      {editor.isEditable ? (
        <>
          <div className="resizable-image-toolbar" contentEditable={false}>
            <button
              type="button"
              className={`resizable-image-align${align === "left" ? " is-active" : ""}`}
              title="Align left"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setAlign("left");
              }}
            >
              <i className="bi bi-text-left"></i>
            </button>
            <button
              type="button"
              className={`resizable-image-align${align === "center" ? " is-active" : ""}`}
              title="Align center"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setAlign("center");
              }}
            >
              <i className="bi bi-text-center"></i>
            </button>
            <button
              type="button"
              className={`resizable-image-align${align === "right" ? " is-active" : ""}`}
              title="Align right"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setAlign("right");
              }}
            >
              <i className="bi bi-text-right"></i>
            </button>
            <button
              type="button"
              className="resizable-image-size"
              title="Make smaller"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setWidthPercent(widthPercent - STEP_PERCENT);
              }}
            >
              −
            </button>
            <button
              type="button"
              className="resizable-image-size"
              title="Make larger"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setWidthPercent(widthPercent + STEP_PERCENT);
              }}
            >
              +
            </button>
            <button
              type="button"
              className="resizable-image-delete"
              title="Delete image"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                deleteNode();
              }}
            >
              ×
            </button>
          </div>
          <span
            className="resizable-image-handle"
            title="Drag to resize"
            contentEditable={false}
            onPointerDown={onPointerDown}
          />
        </>
      ) : null}
    </NodeViewWrapper>
  );
};

export default ResizableImageView;
