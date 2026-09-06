"use client";

import { Suspense } from "react";
import {
  LearnBrowseShellFallback,
  LearnBrowseWorkspace,
} from "@/components/learn/LearnBrowseWorkspace";

export default function LearnIndexPage() {
  return (
    <Suspense fallback={<LearnBrowseShellFallback />}>
      <LearnBrowseWorkspace />
    </Suspense>
  );
}
