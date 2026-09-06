"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import {
  LearnBrowseShellFallback,
  LearnBrowseWorkspace,
} from "@/components/learn/LearnBrowseWorkspace";

function SubjectBrowse() {
  const params = useParams<{ subject: string }>();
  return <LearnBrowseWorkspace subjectSlug={params.subject} />;
}

export default function SubjectPage() {
  return (
    <Suspense fallback={<LearnBrowseShellFallback />}>
      <SubjectBrowse />
    </Suspense>
  );
}
