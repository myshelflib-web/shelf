"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import {
  LearnBrowseShellFallback,
  LearnBrowseWorkspace,
} from "@/components/learn/LearnBrowseWorkspace";

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
    <Suspense fallback={<LearnBrowseShellFallback />}>
      <TopicBrowse />
    </Suspense>
  );
}
