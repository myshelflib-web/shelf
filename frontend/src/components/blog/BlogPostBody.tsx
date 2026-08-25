import type { BlogPost } from "@/lib/blog";

export function BlogPostBody({ post }: { post: BlogPost }) {
  return (
    <div className="blog-prose">
      {post.heroIllustrationUrl && (
        <figure className="blog-figure blog-figure-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.heroIllustrationUrl}
            alt=""
            className="w-full h-auto rounded-xl border border-[var(--border)]"
          />
        </figure>
      )}
      {post.sections.map((section, i) => (
        <section key={i} className="mb-8 last:mb-0">
          {section.heading && <h2>{section.heading}</h2>}
          {section.illustrationUrl && (
            <figure className="blog-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={section.illustrationUrl}
                alt=""
                className="w-full max-w-lg h-auto rounded-lg border border-[var(--border-subtle)]"
                loading="lazy"
              />
            </figure>
          )}
          {section.paragraphs.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
          {section.bullets && section.bullets.length > 0 && (
            <ul>
              {section.bullets.map((item, k) => (
                <li key={k}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
