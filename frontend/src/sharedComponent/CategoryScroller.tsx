import { useEffect, useRef, useState } from "react";
import type { FC, MouseEvent, PointerEvent, ReactNode } from "react";

import { useLanguage } from "../core/context/LanguageContext";

interface CategoryScrollerProps {
  children: ReactNode;
}

const CategoryScroller: FC<CategoryScrollerProps> = ({ children }) => {
  const { t } = useLanguage();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;

    setCanScrollLeft(scroller.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && scroller.scrollLeft < maxScroll - 4);
  };

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    updateScrollState();
    scroller.addEventListener("scroll", updateScrollState, { passive: true });

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(scroller);

    return () => {
      scroller.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [children]);

  const scrollByPage = (direction: number) => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const amount = Math.max(180, scroller.clientWidth * 0.7);
    scroller.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;

    if (!scroller || event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: scroller.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    const drag = dragRef.current;

    if (!scroller || !drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const delta = event.clientX - drag.startX;

    if (Math.abs(delta) > 8) {
      if (!drag.moved) {
        scroller.setPointerCapture(event.pointerId);
      }

      drag.moved = true;
      scroller.scrollLeft = drag.startScroll - delta;
    }
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (drag.moved) {
      suppressClickRef.current = true;
    }

    dragRef.current = null;
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  return (
    <div className="category-scroller">
      {canScrollLeft && (
        <button
          type="button"
          className="category-scroll-btn category-scroll-btn-left"
          aria-label={t("scrollCategoriesLeft")}
          onClick={() => scrollByPage(-1)}
        >
          <i className="bi bi-chevron-left"></i>
        </button>
      )}

      <div
        className="filters"
        ref={scrollerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>

      {canScrollRight && (
        <button
          type="button"
          className="category-scroll-btn category-scroll-btn-right"
          aria-label={t("scrollCategoriesRight")}
          onClick={() => scrollByPage(1)}
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      )}
    </div>
  );
};

export default CategoryScroller;
