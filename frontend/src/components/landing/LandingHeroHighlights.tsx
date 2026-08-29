import {
  CalendarDays,
  FolderOpen,
  Layers,
  ListChecks,
  NotebookPen,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const FEATURES: { icon: LucideIcon; label: string }[] = [
  { icon: FolderOpen, label: "Library" },
  { icon: NotebookPen, label: "Notebooks" },
  { icon: Layers, label: "Tabs & split" },
  { icon: Sparkles, label: "Study AI" },
  { icon: ListChecks, label: "Quiz" },
  { icon: CalendarDays, label: "Planner" },
];

export function LandingHeroHighlights() {
  return (
    <div className="landing-hero-foot">
      <ul className="landing-hero-features" aria-label="What you get with Shelf">
        {FEATURES.map(({ icon: Icon, label }) => (
          <li key={label} className="landing-hero-feature">
            <Icon strokeWidth={1.75} aria-hidden />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
