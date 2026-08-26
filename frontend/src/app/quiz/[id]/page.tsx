"use client";

import { useParams } from "next/navigation";
import { QuizWorkspace } from "@/components/quiz/QuizWorkspace";

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  return <QuizWorkspace quizId={params.id} />;
}
