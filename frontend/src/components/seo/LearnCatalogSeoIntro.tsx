import Link from "next/link";

type Crumb = { name: string; href?: string };
type ChildLink = { name: string; href: string };

type LearnCatalogSeoIntroProps = {
  title: string;
  description: string;
  crumbs: Crumb[];
  /** Topic or article children — crawlable internal links. */
  childrenLinks?: ChildLink[];
  childrenLabel?: string;
};

/** Crawlable hub heading + child links (reader UI mounts separately). */
export function LearnCatalogSeoIntro({
  title,
  description,
  crumbs,
  childrenLinks = [],
  childrenLabel = "In this section",
}: LearnCatalogSeoIntroProps) {
  return (
    <article className="learn-article-seo-intro" aria-label="Section summary">
      <nav className="learn-article-seo-breadcrumb" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <span key={`${crumb.name}-${i}`}>
            {i > 0 ? <span aria-hidden> / </span> : null}
            {crumb.href ? (
              <Link href={crumb.href}>{crumb.name}</Link>
            ) : (
              <span>{crumb.name}</span>
            )}
          </span>
        ))}
      </nav>
      <h1 className="learn-article-seo-title">{title}</h1>
      <p className="learn-article-seo-lead">{description}</p>
      {childrenLinks.length > 0 ? (
        <section>
          <h2>{childrenLabel}</h2>
          <ul>
            {childrenLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
