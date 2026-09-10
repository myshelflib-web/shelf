import type { LegalDocument } from "@/lib/legal";

export function LegalDocumentBody({
  doc,
  hideMeta = false,
}: {
  doc: LegalDocument;
  hideMeta?: boolean;
}) {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">
      {!hideMeta || doc.intro ? (
        <div>
          {!hideMeta ? (
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Effective {doc.effectiveDate} · Last updated {doc.lastUpdated}
            </p>
          ) : null}
          {doc.intro ? <p>{doc.intro}</p> : null}
        </div>
      ) : null}
      {doc.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2.5">
            {section.heading}
          </h2>
          {section.paragraphs?.map((p) => (
            <p key={p.slice(0, 48)} className="mb-2 last:mb-0">
              {p}
            </p>
          ))}
          {section.bullets && section.bullets.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              {section.bullets.map((item) => (
                <li key={item.slice(0, 48)}>{item}</li>
              ))}
            </ul>
          ) : null}
          {section.ordered && section.ordered.length > 0 ? (
            <ol className="list-decimal pl-5 space-y-1.5 mt-2">
              {section.ordered.map((item) => (
                <li key={item.slice(0, 48)}>{item}</li>
              ))}
            </ol>
          ) : null}
        </section>
      ))}
    </div>
  );
}
