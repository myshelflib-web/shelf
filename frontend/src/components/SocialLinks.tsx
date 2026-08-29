import { Instagram, Linkedin, Youtube, type LucideIcon } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/socialLinks";

const ICONS: Record<(typeof SOCIAL_LINKS)[number]["id"], LucideIcon> = {
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
};

export function SocialLinks({
  variant = "default",
}: {
  variant?: "landing" | "default";
}) {
  const linkClass =
    variant === "landing"
      ? "landing-footer-social-link"
      : "inline-flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors";

  return (
    <nav
      aria-label="Social"
      className={
        variant === "landing"
          ? "landing-footer-social"
          : "flex items-center gap-1"
      }
    >
      {SOCIAL_LINKS.map(({ id, name, href }) => {
        const Icon = ICONS[id];
        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name}
            className={linkClass}
          >
            <Icon strokeWidth={1.75} className="w-4 h-4" aria-hidden />
          </a>
        );
      })}
    </nav>
  );
}
