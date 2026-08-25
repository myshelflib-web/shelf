"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getNotebookLastRead, hydrateLastReads } from "@/lib/tabViewState";

/** Resume the last page in this notebook, or the empty library if none. */
export default function NotebookHomeRedirect() {
  const router = useRouter();
  const params = useParams();
  useEffect(() => {
    const slug = typeof params.notebook === "string" ? params.notebook : "";
    const local = slug ? getNotebookLastRead(slug) : null;
    if (local?.href) {
      router.replace(local.href);
      return;
    }
    api.myContent
      .getLastRead()
      .then((res) => {
        hydrateLastReads(res);
        const last = slug ? getNotebookLastRead(slug) : null;
        router.replace(last?.href || "/my-content");
      })
      .catch(() => router.replace("/my-content"));
  }, [router, params]);
  return null;
}
