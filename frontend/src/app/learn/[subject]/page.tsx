"use client";

import { useParams } from "next/navigation";
import { LearnBrowseWorkspace } from "@/components/learn/LearnBrowseWorkspace";

export default function SubjectPage() {
  const params = useParams<{ subject: string }>();
  return <LearnBrowseWorkspace subjectSlug={params.subject} />;
}
