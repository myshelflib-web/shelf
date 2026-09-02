"use client";

import { useEffect, useRef, useState } from "react";
import { getDisplayFirstName } from "@/lib/greeting";
import { useLivelyGreeting } from "@/hooks/useLivelyCopy";
import { GreetingAccent, GreetingDots } from "./GreetingAccent";

interface GreetingBlockProps {
  name: string;
  size?: "sm" | "md" | "lg" | "hero";
  align?: "left" | "center";
  className?: string;
  showAccent?: boolean;
  animatedDots?: boolean;
  showSubtitle?: boolean;
}

export function GreetingBlock({
  name,
  size = "lg",
  align = "center",
  className = "",
  showAccent = true,
  animatedDots = false,
  showSubtitle = true,
}: GreetingBlockProps) {
  const rowAlign =
    align === "center" ? "items-center text-center" : "items-start text-left";
  const maxNameLength = 20;
  const firstName = getDisplayFirstName(name, maxNameLength);
  const isTrimmed = firstName.length > 16;
  const { salutation, subtitle } = useLivelyGreeting();
  const [shownSalutation, setShownSalutation] = useState(salutation);
  const [salutationIn, setSalutationIn] = useState(true);
  const allowFade = useRef(false);

  useEffect(() => {
    if (salutation === shownSalutation) {
      allowFade.current = true;
      return;
    }
    if (!allowFade.current) {
      setShownSalutation(salutation);
      setSalutationIn(true);
      allowFade.current = true;
      return;
    }
    setSalutationIn(false);
    const id = window.setTimeout(() => {
      setShownSalutation(salutation);
      setSalutationIn(true);
    }, 160);
    return () => window.clearTimeout(id);
  }, [salutation, shownSalutation]);

  const titleClass =
    size === "hero"
      ? "greeting-shine greeting-hero text-4xl sm:text-5xl tracking-tight leading-tight"
      : size === "lg"
        ? "text-2xl sm:text-3xl tracking-tight leading-tight"
        : size === "sm"
          ? "text-[13px] sm:text-sm tracking-tight leading-snug"
          : "text-xl sm:text-2xl tracking-tight leading-tight";

  return (
    <div
      className={`flex flex-col ${showSubtitle ? "gap-2" : "gap-0"} max-w-full ${rowAlign} ${className}`}
    >
      <div className="inline-flex flex-row flex-wrap items-baseline gap-1 sm:gap-1.5 overflow-visible">
        <p title={isTrimmed ? firstName : undefined} className={titleClass}>
          <span
            className={`greeting-salutation lively-line ${salutationIn ? "lively-line-in" : "lively-line-out"}`}
          >
            {shownSalutation},
          </span>{" "}
          <span className="greeting-name inline-flex items-baseline gap-0">
            {firstName}
            {animatedDots && (
              <GreetingDots className="text-[var(--text-muted)]" />
            )}
          </span>
        </p>
        {showAccent && !animatedDots && (
          <GreetingAccent
            size={size === "lg" || size === "hero" ? "lg" : "md"}
            className="shrink-0"
          />
        )}
      </div>
      {showSubtitle && (
        <p className="text-[13px] text-[var(--text-muted)] lively-line lively-line-in">
          {subtitle}
        </p>
      )}
    </div>
  );
}
