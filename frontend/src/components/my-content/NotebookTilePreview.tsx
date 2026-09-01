"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { flattenPages } from "@/lib/myContentTree";
import { UserSubject } from "@/types";

export function NotebookTilePreview({ subject }: { subject: UserSubject }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const items = flattenPages(subject);
  const [fit, setFit] = useState(items.length);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight;
      const row = 22;
      const more = 20;
      if (h <= 0) return;
      const allFit = items.length * row <= h;
      if (allFit) {
        setFit(items.length);
        return;
      }
      setFit(Math.max(0, Math.floor((h - more) / row)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  if (items.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No files</p>;
  }

  const shown = items.slice(0, fit);
  const hidden = items.length - shown.length;

  return (
    <div ref={boxRef} className="h-full min-h-0 overflow-hidden">
      {shown.map(({ page, href, topicTitle }) => (
        <Link
          key={page.id}
          href={href}
          className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-0.5 truncate leading-5"
          title={`${topicTitle} · ${page.title}`}
        >
          {page.title}
        </Link>
      ))}
      {hidden > 0 && (
        <Link
          href={`/my-content/${subject.slug}`}
          className="block text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] py-0.5"
        >
          +{hidden} more
        </Link>
      )}
    </div>
  );
}
