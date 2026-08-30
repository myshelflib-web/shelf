"use client";

import { useParams } from "next/navigation";
import { LearnBrowseWorkspace } from "@/components/learn/LearnBrowseWorkspace";

export default function TopicPage() {
  const params = useParams<{ subject: string; topic: string }>();
  return (
    <LearnBrowseWorkspace
      subjectSlug={params.subject}
      topicSlug={params.topic}
    />
  );
}
