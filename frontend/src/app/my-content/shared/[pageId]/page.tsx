"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PersonalPageReader } from "@/components/my-content/PersonalPageReader";

function SharedPageReaderInner() {
  const params = useParams<{ pageId: string }>();
  const search = useSearchParams();
  const linkToken = search.get("t") ?? undefined;
  return (
    <PersonalPageReader
      scope={{
        kind: "shared",
        pageId: params.pageId,
        ...(linkToken ? { linkToken } : {}),
      }}
    />
  );
}

export default function SharedPageReaderPage() {
  return (
    <Suspense fallback={null}>
      <SharedPageReaderInner />
    </Suspense>
  );
}
