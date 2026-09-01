"use client";

import { LandingDualWindows } from "./LandingDualWindows";
import { LandingNotebookReader } from "./LandingNotebookReader";
import { LandingShowcaseMorph } from "./LandingShowcaseMorph";
import {
  BookOpen,
  Columns2,
  FileText,
  FileUp,
  NotebookPen,
  PenLine,
} from "lucide-react";

function UploadDropBack() {
  return (
    <div className="p-5 text-center">
      <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-10 px-4">
        <FileUp className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
        <p className="text-sm font-medium">Drop your PDF here</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Up to 50 MB</p>
      </div>
    </div>
  );
}

function UploadFormatFront() {
  return (
    <div className="p-3 space-y-2 text-xs">
      <p className="text-[var(--text-muted)]">Import as</p>
      <div className="p-2.5 rounded-lg border border-[var(--accent)] bg-[var(--accent-subtle)]">
        <p className="font-medium">Parsed text</p>
        <p className="text-[var(--text-muted)]">Highlights & Study AI</p>
      </div>
      <div className="p-2.5 rounded-lg border border-[var(--border)]">
        <p className="font-medium">Original PDF</p>
        <p className="text-[var(--text-muted)]">View as scanned pages</p>
      </div>
    </div>
  );
}

function UploadLibraryBack() {
  return (
    <div className="p-3 space-y-1.5 text-xs">
      <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide px-1">
        Methods · collection
      </p>
      {["Syllabus pack.pdf", "Chapter notes.pdf", "Essay drafts.pdf"].map(
        (name, i) => (
          <div
            key={name}
            className={`landing-mock-row ${i === 1 ? "landing-mock-row-active" : ""}`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 truncate">{name}</span>
          </div>
        )
      )}
    </div>
  );
}

function UploadListFront() {
  return (
    <div className="p-3 space-y-2 text-xs">
      <p className="font-medium text-[var(--accent)]">3 pages added</p>
      {["Polity notes", "Economy PDF", "Essay drafts"].map((name, i) => (
        <div key={name} className="landing-mock-row">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="flex-1">{name}</span>
          <span className="text-[var(--text-muted)]">{3 - i} pg</span>
        </div>
      ))}
    </div>
  );
}

export function UploadMockup() {
  return (
    <LandingShowcaseMorph
      frames={[
        <LandingDualWindows
          key="upload-a"
          backTitle="Shelf — Upload"
          back={<UploadDropBack />}
          frontTitle="Import options"
          front={<UploadFormatFront />}
        />,
        <LandingDualWindows
          key="upload-b"
          backTitle="Shelf — Library"
          back={<UploadLibraryBack />}
          frontTitle="Upload complete"
          front={<UploadListFront />}
        />,
      ]}
    />
  );
}

function CollectionBack() {
  return (
    <div className="p-3 space-y-1.5 text-xs">
      <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide px-1">
        Organic chemistry
      </p>
      <div className="landing-mock-row">
        <BookOpen className="w-3.5 h-3.5" />
        <span className="flex-1">Lecture slides.pdf</span>
      </div>
      <div className="landing-mock-row landing-mock-row-active">
        <NotebookPen className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span className="flex-1">Mechanism sketches</span>
      </div>
      <div className="landing-mock-row">
        <FileText className="w-3.5 h-3.5" />
        <span className="flex-1">Reaction summary — doc</span>
      </div>
    </div>
  );
}

function AddPageFront() {
  return (
    <div className="p-3 space-y-2">
      <p className="text-[10px] text-[var(--text-muted)]">Add beside PDFs</p>
      <div className="p-2.5 rounded-lg border border-[var(--accent)] bg-[var(--accent-subtle)] text-xs">
        <PenLine className="w-4 h-4 text-[var(--accent)] mb-1.5" />
        <p className="font-medium">Sketch notebook</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
          Multi-sheet ink & diagrams
        </p>
      </div>
      <div className="p-2.5 rounded-lg border border-[var(--border)] text-xs">
        <FileText className="w-4 h-4 text-[var(--accent)] mb-1.5" />
        <p className="font-medium">Doc page</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
          Typed revision notes
        </p>
      </div>
    </div>
  );
}

function SketchReaderFront() {
  return (
    <div className="p-0">
      <LandingNotebookReader />
    </div>
  );
}

export function NotebooksMockup() {
  return (
    <LandingShowcaseMorph
      frames={[
        <LandingDualWindows
          key="nb-a"
          backTitle="Shelf — Collection"
          back={<CollectionBack />}
          frontTitle="Add file"
          front={<AddPageFront />}
        />,
        <LandingDualWindows
          key="nb-b"
          backTitle="Shelf — Collection"
          back={<CollectionBack />}
          frontTitle="Mechanism sketches"
          front={<SketchReaderFront />}
          frontWide
        />,
      ]}
    />
  );
}

function SingleReaderBack() {
  return (
    <div className="p-3 min-h-[140px]">
      <p className="text-[10px] text-[var(--text-muted)] mb-2">syllabus.pdf</p>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-[10px] text-[var(--text-secondary)] font-[family-name:var(--font-serif)] leading-relaxed">
        Article 14 guarantees equality before law and equal protection of
        laws…
      </div>
    </div>
  );
}

function TabsFront() {
  return (
    <div className="p-2 space-y-2">
      <div className="flex gap-1 text-[9px]">
        <span className="px-2 py-1 rounded-md bg-[var(--accent-subtle)] border border-[var(--accent)] text-[var(--accent)]">
          syllabus.pdf
        </span>
        <span className="px-2 py-1 rounded-md border border-[var(--border)] text-[var(--text-muted)]">
          notes.doc
        </span>
        <span className="px-2 py-1 text-[var(--text-muted)]">+ tab</span>
      </div>
      <p className="text-[10px] text-[var(--text-muted)] px-1">
        Up to 15 tabs · layout restores on return
      </p>
    </div>
  );
}

function SplitBack() {
  return (
    <div className="grid grid-cols-2 min-h-[140px] text-[9px]">
      <div className="border-r border-[var(--border)] p-2">
        <p className="text-[var(--text-muted)] mb-1">PDF</p>
        <div className="h-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-[family-name:var(--font-serif)] text-[var(--text-secondary)]">
          Source with highlights…
        </div>
      </div>
      <div className="p-2">
        <p className="text-[var(--text-muted)] mb-1">Doc notes</p>
        <div className="h-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)]">
          Your summary beside the PDF
        </div>
      </div>
    </div>
  );
}

function SplitFront() {
  return (
    <div className="p-3 text-xs space-y-2">
      <p className="inline-flex items-center gap-1.5 text-[var(--accent)] font-medium">
        <Columns2 className="w-3.5 h-3.5" />
        Split view active
      </p>
      <p className="text-[var(--text-muted)] leading-relaxed">
        Resize panes, collapse library or Study AI, and keep both sources in
        sync.
      </p>
    </div>
  );
}

export function WorkspaceMockup() {
  return (
    <LandingShowcaseMorph
      frames={[
        <LandingDualWindows
          key="ws-a"
          backTitle="Shelf — Reader"
          back={<SingleReaderBack />}
          frontTitle="Open tabs"
          front={<TabsFront />}
        />,
        <LandingDualWindows
          key="ws-b"
          backTitle="Shelf — Split view"
          back={<SplitBack />}
          frontTitle="Workspace"
          front={<SplitFront />}
        />,
      ]}
    />
  );
}

export {
  StudyAIMockup,
  CalendarMockup,
  DashboardMockup,
} from "./LandingShowcaseMockupsMore";
