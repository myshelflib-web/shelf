"use client";

import { Suspense } from "react";
import { LearnBrowseWorkspace } from "@/components/learn/LearnBrowseWorkspace";
import { ThinkingIndicator } from "@/components/GreetingAccent";

export default function LearnIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <ThinkingIndicator label="Loading" />
        </div>
      }
    >
      <LearnBrowseWorkspace />
    </Suspense>
  );
}
