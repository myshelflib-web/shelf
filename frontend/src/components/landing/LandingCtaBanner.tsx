import Link from "next/link";
import { RevealOnScroll } from "@/components/RevealOnScroll";

export function LandingCtaBanner({
  title,
  copy,
  buttonLabel = "Start my Shelf",
  buttonHref = "/login",
}: {
  title: string;
  copy: string;
  buttonLabel?: string;
  buttonHref?: string;
}) {
  return (
    <section className="landing-cta-section">
      <RevealOnScroll>
        <div className="landing-cta-banner">
          <div className="landing-cta-text">
            <div className="landing-cta-title">{title}</div>
            <div className="landing-cta-copy">{copy}</div>
          </div>
          <Link href={buttonHref} className="landing-btn landing-btn-primary shrink-0">
            {buttonLabel}
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  );
}
