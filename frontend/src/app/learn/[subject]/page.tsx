"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { LearnBrowseWorkspace } from "@/components/learn/LearnBrowseWorkspace";
import { ThinkingIndicator } from "@/components/GreetingAccent";

function SubjectBrowse() {
  const params = useParams<{ subject: string }>();
  return <LearnBrowseWorkspace subjectSlug={params.subject} />;
}

export default function SubjectPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <ThinkingIndicator label="Loading" />
        </div>
      }
    >
      <SubjectBrowse />
    </Suspense>
  );
}
