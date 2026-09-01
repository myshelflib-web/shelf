import { Header } from "@/components/Header";
import { LearnReaderPaneSkeleton } from "@/components/learn/LearnReaderSkeleton";

export default function LearnArticleLoading() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div
          className="hidden md:block w-72 shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)]"
          aria-hidden
        />
        <main className="flex-1 min-h-0 overflow-hidden bg-[var(--bg-primary)]">
          <LearnReaderPaneSkeleton />
        </main>
      </div>
    </div>
  );
}
