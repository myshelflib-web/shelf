"use client";

import { useParams } from "next/navigation";
import { LearnReaderWorkspace } from "@/components/learn/LearnReaderWorkspace";
import { learnScope } from "@/lib/learnContent";

export default function ArticlePage() {
  const params = useParams<{
    subject: string;
    topic: string;
    article: string;
  }>();

  return (
    <LearnReaderWorkspace
      scope={learnScope(params.subject, params.topic, params.article)}
    />
  );
}
