"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { LearnBrowseWorkspace } from "@/components/learn/LearnBrowseWorkspace";
import { ThinkingIndicator } from "@/components/GreetingAccent";

function TopicBrowse() {
  const params = useParams<{ subject: string; topic: string }>();
  return (
    <LearnBrowseWorkspace
      subjectSlug={params.subject}
      topicSlug={params.topic}
    />
  );
}

export default function TopicPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <ThinkingIndicator label="Loading" />
        </div>
      }
    >
      <TopicBrowse />
    </Suspense>
  );
}
