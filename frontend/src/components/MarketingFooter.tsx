import Link from "next/link";
import { ShelfLogo } from "@/components/ShelfLogo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)] mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <ShelfLogo size={22} />
          <span className="font-semibold text-sm">Shelf</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]">
          <Link href="/blog" className="nav-link">
            Blog
          </Link>
          <Link href="/subscribe" className="nav-link">
            Pricing
          </Link>
          <Link href="/learn" className="nav-link">
            Learn
          </Link>
          <Link href="/quiz" className="nav-link">
            Quiz
          </Link>
          <Link href="/about" className="nav-link">
            About
          </Link>
          <Link href="/contact" className="nav-link">
            Contact
          </Link>
          <Link href="/login" className="nav-link">
            Sign in
          </Link>
        </nav>
        <p className="text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} Shelf
        </p>
      </div>
    </footer>
  );
}
