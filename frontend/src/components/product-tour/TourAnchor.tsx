"use client";

import type { ReactNode } from "react";

/** Marks a control as a product-tour target via `data-tour-id`. */
export function TourAnchor({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span data-tour-id={id} className={className ?? "contents"}>
      {children}
    </span>
  );
}
