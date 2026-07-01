"use client";

import { useState, useRef } from "react";

interface BottomSheetProps {
  children: React.ReactNode;
  peekHeight?: number;
  defaultExpanded?: boolean;
}

/**
 * On md+ screens: renders as a 412px left sidebar inside the flex <main>.
 * On mobile: fixed bottom sheet with swipe-to-expand/collapse gesture.
 * Only the drag handle registers swipe — content inside scrolls normally.
 */
export default function BottomSheet({
  children,
  peekHeight = 220,
  defaultExpanded = true,
}: BottomSheetProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const touchStartY = useRef<number | null>(null);

  function onHandleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function onHandleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy < -28) setExpanded(true);
    if (dy > 28) setExpanded(false);
    touchStartY.current = null;
  }

  return (
    <>
      {/* ── Desktop: regular left sidebar ── */}
      <section className="hidden md:flex w-[412px] flex-none bg-white border-r border-[#E6EBF1] flex-col overflow-y-auto">
        {children}
      </section>

      {/* ── Mobile: bottom sheet overlay ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-[22px] border-t border-[#E6EBF1] shadow-[0_-6px_28px_-6px_rgba(16,40,70,0.18)] flex flex-col"
        style={{
          height: expanded ? "78dvh" : `${peekHeight}px`,
          transition: "height 0.32s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Drag handle — only this area handles swipe */}
        <button
          type="button"
          aria-label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded((v) => !v)}
          onTouchStart={onHandleTouchStart}
          onTouchEnd={onHandleTouchEnd}
          className="flex-none flex justify-center items-center py-3 w-full bg-transparent border-none cursor-pointer touch-none"
        >
          <div className="w-10 h-[5px] rounded-full bg-[#D1D9E2]" />
        </button>

        {/* Scrollable content — not connected to swipe */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
}
