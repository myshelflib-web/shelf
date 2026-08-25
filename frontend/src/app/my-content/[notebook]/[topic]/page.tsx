"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getNotebookLastRead, hydrateLastReads } from "@/lib/tabViewState";

/** Resume the last page in this topic, or the empty library if none. */
export default function TopicHomeRedirect() {
  const router = useRouter();
  const params = useParams();
  useEffect(() => {
    const notebook =
      typeof params.notebook === "string" ? params.notebook : "";
    const topic = typeof params.topic === "string" ? params.topic : "";
    const local =
      notebook && topic ? getNotebookLastRead(notebook, topic) : null;
    if (local?.href) {
      router.replace(local.href);
      return;
    }
    api.myContent
      .getLastRead()
      .then((res) => {
        hydrateLastReads(res);
        const last =
          notebook && topic ? getNotebookLastRead(notebook, topic) : null;
        router.replace(last?.href || "/my-content");
      })
      .catch(() => router.replace("/my-content"));
  }, [router, params]);
  return null;
}
