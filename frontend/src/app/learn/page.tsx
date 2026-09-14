import { Suspense } from "react";
import {
  LearnBrowseShellFallback,
  LearnBrowseWorkspace,
} from "@/components/learn/LearnBrowseWorkspace";
import { LearnHubSeoIntro } from "@/components/seo/LearnHubSeoIntro";
import { LearnSeoMain, LearnSeoShell } from "@/components/seo/LearnSeoShell";

export default function LearnIndexPage() {
  return (
    <LearnSeoShell>
      <LearnHubSeoIntro />
      <LearnSeoMain>
        <Suspense fallback={<LearnBrowseShellFallback />}>
          <LearnBrowseWorkspace />
        </Suspense>
      </LearnSeoMain>
    </LearnSeoShell>
  );
}
