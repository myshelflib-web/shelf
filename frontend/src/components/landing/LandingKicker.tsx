import type { ReactNode } from "react";

export function LandingKicker({
  index,
  children,
  className = "",
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`landing-kicker ${className}`.trim()}>
      {index ? (
        <span className="landing-kicker-num" aria-hidden>
          {index}
        </span>
      ) : null}
      {children}
    </div>
  );
}
