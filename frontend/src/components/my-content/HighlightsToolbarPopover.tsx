"use client";

import { useRef, useState } from "react";
import { List } from "lucide-react";
import { ToolPopover } from "@/components/my-content/ToolPopover";
import { ToolBtn } from "@/components/my-content/EditorToolbarChrome";
import type { UserContentHighlight } from "@/types";
import { HighlightsPanel } from "@/components/my-content/reader/HighlightsPanel";

type HighlightsToolbarPopoverProps = {
  highlights: UserContentHighlight[];
  hydrating: boolean;
  isPdf: boolean;
  onSelect: (highlight: UserContentHighlight) => void;
  phone?: boolean;
  closeOnSelect?: boolean;
};

export function HighlightsToolbarPopover({
  highlights,
  hydrating,
  isPdf,
  onSelect,
  phone = false,
  closeOnSelect = true,
}: HighlightsToolbarPopoverProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const count = highlights.length;

  return (
    <>
      <ToolBtn
        ref={btnRef}
        phone={phone}
        label={
          count > 0
            ? `Highlights & notes (${count})`
            : "Highlights & notes on this page"
        }
        active={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative inline-flex">
          <List className="w-[17px] h-[17px]" />
          {count > 0 ? (
            <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[var(--accent)] text-[9px] font-bold text-white leading-[14px] text-center">
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </span>
      </ToolBtn>

      <ToolPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={btnRef.current}
        title="Highlights & notes"
        widthClass="w-[min(360px,calc(100vw-16px))]"
      >
        <div className="max-h-[min(420px,52vh)] flex flex-col min-h-0 -mx-1">
          <HighlightsPanel
            highlights={highlights}
            hydrating={hydrating}
            isPdf={isPdf}
            onSelect={(h) => {
              onSelect(h);
              if (closeOnSelect) setOpen(false);
            }}
          />
        </div>
      </ToolPopover>
    </>
  );
}
