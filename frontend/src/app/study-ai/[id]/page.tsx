"use client";

import { useParams } from "next/navigation";
import { StudyAIWorkspace } from "@/components/study-ai/StudyAIWorkspace";

export default function StudyAIThreadPage() {
  const params = useParams<{ id: string }>();
  return <StudyAIWorkspace threadId={params.id} />;
}
