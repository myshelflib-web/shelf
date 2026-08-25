"use client";

import { useParams } from "next/navigation";
import { PersonalPageReader } from "@/components/my-content/PersonalPageReader";

export default function RootFileReaderPage() {
  const params = useParams<{ page: string }>();
  return (
    <PersonalPageReader
      scope={{ kind: "root-file", pageSlug: params.page }}
    />
  );
}
