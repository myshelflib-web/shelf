"use client";

import { useEffect, useState } from "react";

interface RightSidebarProps {
  content: string;
  scrollContainer?: HTMLElement | null;
  contentRoot?: HTMLElement | null;
  readPercent?: number;
  onReadPercentChange?: (percent: number) => void;
  className?: string;
}

interface TocItem {
  id: string;
  title: string;
}

export function RightSidebar({
  content,
  scrollContainer,
  contentRoot,
  readPercent: controlledPercent,
  onReadPercentChange,
  className,
}: RightSidebarProps) {
  const [localPercent, setLocalPercent] = useState(0);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");

  const readPercent = controlledPercent ?? localPercent;

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const headings = doc.querySelectorAll("h2");
    const items: TocItem[] = [];
    headings.forEach((h, i) => {
      const id = h.id || `section-${i + 1}`;
      items.push({ id, title: h.textContent ?? `Section ${i + 1}` });
    });
    setToc(items);
  }, [content]);

  useEffect(() => {
    const container = scrollContainer;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const percent = Math.min(
        100,
        Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) || 0
      );
      if (onReadPercentChange) onReadPercentChange(percent);
      else setLocalPercent(percent);

      if (contentRoot && toc.length) {
        let current = toc[0]?.id ?? "";
        for (const item of toc) {
          const el = contentRoot.querySelector(`#${CSS.escape(item.id)}`);
          if (!el) continue;
          const top =
            el.getBoundingClientRect().top -
            contentRoot.getBoundingClientRect().top +
            container.scrollTop;
          if (top <= container.scrollTop + 48) current = item.id;
        }
        setActiveSection(current);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, [scrollContainer, contentRoot, toc, onReadPercentChange]);

  const scrollTo = (id: string) => {
    const root = contentRoot;
    const container = scrollContainer;
    const el = root?.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;
    if (el && container) {
      const top =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop;
      container.scrollTo({ top: Math.max(0, top - 12), behavior: "smooth" });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setActiveSection(id);
  };

  return (
    <aside
      className={
        className ??
        "w-64 shrink-0 border-l border-[var(--border)] bg-[var(--bg-sidebar)] p-4 overflow-y-auto hidden lg:block h-full"
      }
    >
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
          <span>Reading Progress</span>
          <span>{readPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${readPercent}%` }}
          />
        </div>
      </div>

      {toc.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            On this page
          </h3>
          <nav className="space-y-1">
            {toc.map((item, i) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`block w-full text-left text-sm py-1 px-2 rounded transition truncate ${
                  activeSection === item.id
                    ? "text-[var(--accent)] font-medium"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {i + 1}. {item.title}
              </button>
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
}
