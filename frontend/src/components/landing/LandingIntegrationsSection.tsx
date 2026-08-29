import Link from "next/link";
import { ArrowRight, Music, Send, Share2 } from "lucide-react";
import { RevealOnScroll } from "@/components/RevealOnScroll";

const INTEGRATIONS = [
  {
    icon: Send,
    title: "Telegram PDF import",
    body: "Forward coaching PDFs from Telegram to the Shelf bot. Files land in your library with the same reader, highlights, and Study AI as in-app uploads.",
    href: "/features/telegram-pdf-import",
    blogHref: "/blog/telegram-save-pdfs",
    cta: "Telegram import guide",
  },
  {
    icon: Music,
    title: "Spotify focus audio",
    body: "Paste a Spotify track, playlist, or podcast beside your PDF. Audio keeps playing when you hide the dock or read fullscreen — no alt-tabbing.",
    href: "/features/spotify-focus-audio",
    blogHref: "/blog/spotify-focus-audio-while-reading",
    cta: "Focus audio guide",
  },
  {
    icon: Share2,
    title: "Document sharing",
    body: "Share pages with classmates by email — view or edit access, Shared with me in the sidebar, and save an independent copy to your library.",
    href: "/features/document-sharing",
    blogHref: "/blog/share-study-documents",
    cta: "Sharing guide",
  },
] as const;

export function LandingIntegrationsSection() {
  return (
    <section
      className="landing-value-section !pb-12"
      id="integrations"
      aria-labelledby="landing-integrations-heading"
    >
      <RevealOnScroll>
        <div className="landing-value-head">
          <div>
            <div className="landing-kicker">Integrations</div>
            <h2 id="landing-integrations-heading" className="landing-value-title">
              Telegram, Spotify, and sharing — inside the reader
            </h2>
          </div>
          <p className="landing-value-copy">
            Shelf meets you where files and focus already live. Import from chat,
            play focus audio beside the PDF, and share pages without losing your
            private highlights.
          </p>
        </div>
      </RevealOnScroll>
      <div className="landing-value-grid !grid-cols-1 md:!grid-cols-3">
        {INTEGRATIONS.map((item, index) => (
          <RevealOnScroll key={item.title} delay={index * 60}>
            <article className="landing-value-card !min-h-0">
              <div className="landing-value-icon !relative !top-0 !right-0 !mb-3">
                <item.icon />
              </div>
              <h3 className="!mt-0">{item.title}</h3>
              <p>{item.body}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link href={item.href} className="landing-value-mini hover:underline">
                  {item.cta}
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link href={item.blogHref} className="landing-value-mini hover:underline">
                  Blog article
                </Link>
              </div>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
