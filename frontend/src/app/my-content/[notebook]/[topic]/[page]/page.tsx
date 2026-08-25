"use client";

import { useParams } from "next/navigation";
import { PersonalPageReader } from "@/components/my-content/PersonalPageReader";

export default function MyContentReaderPage() {
  const params = useParams<{ notebook: string; topic: string; page: string }>();
  return (
    <PersonalPageReader
      scope={{
        kind: "topic",
        notebookSlug: params.notebook,
        topicSlug: params.topic,
        pageSlug: params.page,
      }}
    />
  );
}
