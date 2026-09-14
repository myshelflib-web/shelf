"use client";

import { useParams } from "next/navigation";
import { LearnBrowseWorkspace } from "@/components/learn/LearnBrowseWorkspace";

export function TopicBrowseClient() {
  const params = useParams<{ subject: string; topic: string }>();
  return (
    <LearnBrowseWorkspace
      subjectSlug={params.subject}
      topicSlug={params.topic}
    />
  );
}
