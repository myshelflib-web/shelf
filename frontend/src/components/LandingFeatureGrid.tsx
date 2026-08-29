import { RevealOnScroll } from "@/components/RevealOnScroll";
import { MARKETING_FEATURES } from "@/lib/marketing";

export function LandingFeatureGrid({
  title = "Everything in one place",
  variant,
}: {
  title?: string;
  variant?: "landing";
}) {
  if (variant === "landing") {
    return (
      <section className="landing-features-section">
        <RevealOnScroll>
          <div className="landing-kicker">Full feature set</div>
          <div className="landing-value-title">{title}</div>
          <p className="landing-value-copy mt-2">
            Reader workspace, YouTube lectures, Study AI, quiz, planner, Telegram
            import and send, Spotify focus audio, sharing, and offline PWA — one
            calm surface for your own material.
          </p>
        </RevealOnScroll>
        <div className="landing-feature-grid">
          {MARKETING_FEATURES.map((feature, index) => (
            <RevealOnScroll key={feature.title} delay={index * 40}>
              <article className="landing-feature-card h-full">
                <feature.icon />
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6 pb-20 max-w-5xl mx-auto">
      <RevealOnScroll>
        <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-center sm:text-left">
          {title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-8 text-center sm:text-left max-w-2xl">
          A calm workspace for your own material — upload, read, ask, and plan without
          switching apps.
        </p>
      </RevealOnScroll>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MARKETING_FEATURES.map((feature, index) => (
          <RevealOnScroll key={feature.title} delay={index * 60}>
            <article className="feature-card h-full p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
              <feature.icon className="feature-icon w-5 h-5 text-[var(--accent)] mb-3" />
              <h3 className="font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {feature.body}
              </p>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
