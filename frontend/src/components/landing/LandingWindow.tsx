import { ReactNode } from "react";

/** App-style panel chrome for landing mockups (not macOS traffic lights). */
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
    <div className={`landing-window landing-app-preview ${className}`}>
      <div className="landing-window-bar">
        <span className="landing-window-title">{title}</span>
      </div>
      <div className="landing-window-body">{children}</div>
    </div>
  );
}
