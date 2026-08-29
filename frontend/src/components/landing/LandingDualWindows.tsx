import { ReactNode } from "react";
import { LandingWindow } from "./LandingWindow";

/** Back window + overlapping front panel — matches Study AI showcase style. */
export function LandingDualWindows({
  backTitle,
  back,
  frontTitle,
  front,
  frontWide = false,
}: {
  backTitle: string;
  back: ReactNode;
  frontTitle: string;
  front: ReactNode;
  /** Wider front panel for text-heavy previews. */
  frontWide?: boolean;
}) {
  return (
    <div className="landing-dual-windows">
      <LandingWindow title={backTitle} className="landing-dual-windows-back">
        {back}
      </LandingWindow>
      <div
        className={`landing-floating-panel landing-dual-windows-front${
          frontWide ? " landing-dual-windows-front-wide" : ""
        }`}
      >
        <LandingWindow title={frontTitle}>{front}</LandingWindow>
      </div>
    </div>
  );
}
