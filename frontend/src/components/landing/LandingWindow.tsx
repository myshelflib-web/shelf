import { ReactNode } from "react";

export function LandingWindow({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`landing-window ${className}`}>
      <div className="landing-window-bar">
        <span className="landing-dot landing-dot-red" />
        <span className="landing-dot landing-dot-yellow" />
        <span className="landing-dot landing-dot-green" />
        <span className="ml-2 text-[11px] text-[var(--text-muted)] truncate">
          {title}
        </span>
      </div>
      <div className="landing-window-body">{children}</div>
    </div>
  );
}
