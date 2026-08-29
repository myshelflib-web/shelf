"use client";

import { useState, type ReactNode } from "react";
import { StudyShareSheet } from "@/components/study-share/StudyShareSheet";

export function StudyShareLauncher({
  renderTrigger,
}: {
  renderTrigger: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {renderTrigger(() => setOpen(true))}
      <StudyShareSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
