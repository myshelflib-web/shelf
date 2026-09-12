import Link from "next/link";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import {
  ALTERNATIVE_TOOLS,
  FEATURE_COMPARISON_ROWS,
  PRICING_VALUE_POINTS,
} from "@/lib/seo/comparisonMatrix";

/** Visible comparison block for /features/shelf-vs-alternatives. */
export function FeatureComparisonSection() {
  return (
    <div className="px-4 sm:px-6 pb-12 max-w-3xl mx-auto space-y-12">
      <RevealOnScroll>
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">
          Features side by side
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
          Shelf is strongest as a combined study stack — not as a clone of any
          single competitor.
        </p>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-[var(--bg-secondary)] text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2.5 font-medium">Capability</th>
                <th className="px-3 py-2.5 font-medium">Shelf</th>
                <th className="px-3 py-2.5 font-medium">Typical alternatives</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON_ROWS.map((row) => (
                <tr
                  key={row.capability}
                  className="border-t border-[var(--border)] align-top"
                >
                  <td className="px-3 py-3 font-medium text-[var(--text-primary)]">
                    {row.capability}
                  </td>
                  <td className="px-3 py-3 text-[var(--text-secondary)]">
                    {row.shelf}
                  </td>
                  <td className="px-3 py-3 text-[var(--text-muted)]">
                    {row.typicalAlternatives}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RevealOnScroll>

      <RevealOnScroll>
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">
          Pricing value
        </h2>
        <ul className="space-y-3">
          {PRICING_VALUE_POINTS.map((point) => (
            <li
              key={point}
              className="feature-card p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] leading-relaxed"
            >
              {point}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Live amounts on{" "}
          <Link href="/subscribe" className="text-[var(--accent)] hover:underline">
            /subscribe
          </Link>
          .
        </p>
      </RevealOnScroll>

      <RevealOnScroll>
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">
          When another tool is enough
        </h2>
        <ul className="space-y-3">
          {ALTERNATIVE_TOOLS.map((tool) => (
            <li
              key={tool.name}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-sm"
            >
              <p className="font-medium text-[var(--text-primary)]">{tool.name}</p>
              <p className="mt-1 text-[var(--text-muted)]">{tool.fit}</p>
              <p className="mt-2 text-[var(--text-secondary)]">
                Shelf edge: {tool.shelfEdge}
              </p>
            </li>
          ))}
        </ul>
      </RevealOnScroll>
    </div>
  );
}
