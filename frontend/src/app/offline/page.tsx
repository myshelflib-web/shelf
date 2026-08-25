import Link from "next/link";
import { ShelfLogo } from "@/components/ShelfLogo";

export default function OfflinePage() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <ShelfLogo size={40} />
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-[var(--text-secondary)]">
        Shelf needs a network connection to load your library and documents. Reconnect, then try again.
      </p>
      <Link
        href="/my-content"
        className="mt-2 rounded-[10px] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
      >
        Retry
      </Link>
    </main>
  );
}
