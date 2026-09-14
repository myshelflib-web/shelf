"use client";

import { useParams } from "next/navigation";
import { LearnBrowseWorkspace } from "@/components/learn/LearnBrowseWorkspace";

export function SubjectBrowseClient() {
  const params = useParams<{ subject: string }>();
  return <LearnBrowseWorkspace subjectSlug={params.subject} />;
}
