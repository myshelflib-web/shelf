"use client";

import { Upload } from "lucide-react";
import { DashboardAddMaterialSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { useAddContent } from "@/components/my-content/MyContentAddProvider";

export function DashboardAddMaterial({ loading = false }: { loading?: boolean }) {
  const { openAdd } = useAddContent();
  if (loading) return <DashboardAddMaterialSkeleton />;

  return (
    <div className="mt-2.5 flex items-center">
      <button
        type="button"
        onClick={() => openAdd({ kind: "page" })}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--accent)] hover:underline px-0.5 py-1.5"
      >
        <Upload className="w-3.5 h-3.5" strokeWidth={1.8} />
        Add material
      </button>
      <span className="hidden sm:inline text-[11px] text-[var(--text-muted)] ml-2">
        Upload a file, add a URL or create a folder
      </span>
    </div>
  );
}
