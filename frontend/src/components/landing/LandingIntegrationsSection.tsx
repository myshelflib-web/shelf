import Link from "next/link";
import { ArrowRight, Music, Send, Share2 } from "lucide-react";
import { RevealOnScroll } from "@/components/RevealOnScroll";

const INTEGRATIONS = [
  {
    icon: Send,
    title: "Telegram import & send",
    body: "Forward coaching PDFs from Telegram to the Shelf bot, then send a library PDF back from Share. Same reader, highlights, and Study AI as in-app uploads.",
    href: "/features/telegram-pdf-import",
    blogHref: "/blog/telegram-save-pdfs",
    cta: "Telegram PDF guide",
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
    body: "Share pages with classmates by email — view or edit access, Shared with me in the sidebar, and send a PDF back to Telegram from Share.",
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
            Shelf meets you where files and focus already live. Import from
            Telegram, send a PDF back, play focus audio beside the reader, and
            share pages without losing your private highlights.
          </p>
        </div>
      </RevealOnScroll>
      <div className="landing-value-grid !grid-cols-1 md:!grid-cols-3">
        {INTEGRATIONS.map((item, index) => (
          <RevealOnScroll key={item.title} delay={index * 60}>
            <article className="landing-value-card !min-h-0">
              <div className="landing-value-card-head">
                <item.icon aria-hidden />
                <h3>{item.title}</h3>
              </div>
              <p>{item.body}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                <Link href={item.href} className="landing-value-link inline-flex items-center gap-1">
                  {item.cta}
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link href={item.blogHref} className="landing-value-link">
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
