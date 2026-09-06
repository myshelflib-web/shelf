"use client";

import { LandingDualWindows } from "./LandingDualWindows";
import { LandingShowcaseMorph } from "./LandingShowcaseMorph";
import { BookMarked, FileText } from "lucide-react";

function DocDraftBack() {
  return (
    <div className="p-3 text-[10px] leading-relaxed text-[var(--text-secondary)] space-y-2 font-[family-name:var(--font-serif)]">
      <p className="text-[11px] font-semibold text-[var(--text-primary)]">
        Methods
      </p>
      <p>
        We reviewed twenty papers on retrieval-augmented study tools
        <span className="text-[var(--accent)] font-medium"> (Smith, 2024)</span>
        and mapped citation practices across exam prep apps.
      </p>
      <p className="text-[var(--text-muted)] border-l-2 border-[var(--border)] pl-2">
        Figure 1 · Study library workflow
      </p>
    </div>
  );
}

function SourcesFront() {
  return (
    <div className="p-3 space-y-2 text-[10px]">
      <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)] font-medium">
        Sources · APA
      </p>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2 space-y-1">
        <p className="font-medium text-[var(--text-primary)] flex items-center gap-1">
          <BookMarked className="w-3 h-3 text-[var(--accent)]" />
          Smith, A. (2024)
        </p>
        <p className="text-[var(--text-muted)] line-clamp-2">
          Retrieval-augmented tutors for personal libraries.
        </p>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <span className="px-1.5 py-0.5 rounded border border-[var(--border)]">
          Cite
        </span>
        <span className="px-1.5 py-0.5 rounded border border-[var(--border)]">
          Export LaTeX
        </span>
        <span className="px-1.5 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent)]">
          Outline
        </span>
      </div>
    </div>
  );
}

function ExportFront() {
  return (
    <div className="p-3 space-y-2 text-[10px]">
      <p className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
        Export draft
      </p>
      <ul className="space-y-1 text-[var(--text-secondary)]">
        <li className="flex justify-between rounded-md border border-[var(--border)] px-2 py-1.5">
          Markdown <span className="text-[var(--accent)]">.md</span>
        </li>
        <li className="flex justify-between rounded-md border border-[var(--border)] px-2 py-1.5">
          LaTeX <span className="text-[var(--accent)]">.tex</span>
        </li>
        <li className="flex justify-between rounded-md border border-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-1.5 text-[var(--accent)]">
          Word <span>.doc</span>
        </li>
      </ul>
    </div>
  );
}

export function ResearchDocMockup() {
  return (
    <LandingShowcaseMorph
      frames={[
        <LandingDualWindows
          key="rd-a"
          backTitle="thesis-chapter.doc"
          back={<DocDraftBack />}
          frontTitle="Sources"
          front={<SourcesFront />}
        />,
        <LandingDualWindows
          key="rd-b"
          backTitle="thesis-chapter.doc"
          back={<DocDraftBack />}
          frontTitle="Export"
          front={<ExportFront />}
        />,
      ]}
    />
  );
}
