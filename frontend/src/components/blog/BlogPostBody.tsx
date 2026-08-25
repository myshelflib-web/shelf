"use client";

import type { BlogPost } from "@/lib/blog";
import { BlogVisual } from "@/components/blog/BlogVisuals";
import {
  heroVisualForSlug,
  sectionVisualForSlug,
} from "@/lib/blog/blogVisualMap";

function SectionProse({
  section,
}: {
  section: BlogPost["sections"][number];
}) {
  return (
    <div className="blog-prose">
      {section.heading && <h2>{section.heading}</h2>}
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
    </div>
  );
}

export function BlogPostBody({ post }: { post: BlogPost }) {
  const heroVisual = heroVisualForSlug(post.slug);

  return (
    <div className="blog-article-body">
      {(heroVisual || post.heroIllustrationUrl) && (
        <div className="blog-hero-showcase mb-14 sm:mb-16">
          {heroVisual ? (
            <BlogVisual id={heroVisual} />
          ) : (
            post.heroIllustrationUrl && (
              <figure className="blog-figure blog-figure-hero">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.heroIllustrationUrl}
                  alt=""
                  className="w-full h-auto rounded-xl border border-[var(--border)]"
                />
              </figure>
            )
          )}
        </div>
      )}

      {post.sections.map((section, i) => {
        const visual = sectionVisualForSlug(post.slug, i);
        const reverse = i % 2 === 1;

        if (!visual) {
          return (
            <section key={i} className="blog-section-stack mb-12 last:mb-0">
              <SectionProse section={section} />
              {section.illustrationUrl && (
                <figure className="blog-figure mt-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={section.illustrationUrl}
                    alt=""
                    className="w-full max-w-lg h-auto rounded-lg border border-[var(--border-subtle)]"
                    loading="lazy"
                  />
                </figure>
              )}
            </section>
          );
        }

        return (
          <section
            key={i}
            className="blog-section-showcase mb-14 sm:mb-16 last:mb-0"
          >
            <div
              className={`blog-section-grid landing-showcase ${
                reverse ? "blog-section-grid-reverse" : ""
              }`}
            >
              <SectionProse section={section} />
              <div className="blog-section-visual">
                <BlogVisual id={visual} />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
