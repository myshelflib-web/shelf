"use client";

import { useParams } from "next/navigation";
import { PersonalPageReader } from "@/components/my-content/PersonalPageReader";

export default function NotebookFileReaderPage() {
  const params = useParams<{ notebook: string; page: string }>();
  return (
    <PersonalPageReader
      scope={{
        kind: "notebook-file",
        notebookSlug: params.notebook,
        pageSlug: params.page,
      }}
    />
  );
}
