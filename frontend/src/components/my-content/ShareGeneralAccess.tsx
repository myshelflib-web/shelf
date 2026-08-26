"use client";

import { Link2, Lock } from "lucide-react";

type Props = {
  generalAccess: "restricted" | "link";
  linkPath: string | null;
  copied: boolean;
  onGeneralAccessChange: (value: "restricted" | "link") => void;
  onCopyLink: () => void;
};

export function ShareGeneralAccess({
  generalAccess,
  linkPath,
  copied,
  onGeneralAccessChange,
  onCopyLink,
}: Props) {
  const fullUrl =
    typeof window !== "undefined" && linkPath
      ? `${window.location.origin}${linkPath}`
      : linkPath;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide font-semibold text-[var(--text-muted)] mb-2">
        General access
      </p>
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
          {generalAccess === "link" ? (
            <Link2 className="w-4 h-4" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {generalAccess === "link" ? "Anyone with link" : "Restricted"}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {generalAccess === "link"
              ? "Signed-in users with the link can view."
              : "Only people added above can open this."}
          </p>
        </div>
        <select
          className="h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] px-2 max-w-[11rem]"
          value={generalAccess}
          onChange={(e) =>
            onGeneralAccessChange(e.target.value as "restricted" | "link")
          }
        >
          <option value="restricted">Restricted</option>
          <option value="link">Anyone with link · Can view</option>
        </select>
      </div>
      {generalAccess === "link" && (
        <div className="mt-3 space-y-2">
          {linkPath ? (
            <div className="flex items-center gap-2">
              <div
                className="flex-1 min-w-0 h-9 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--text-secondary)] flex items-center overflow-hidden text-ellipsis whitespace-nowrap select-all"
                title={fullUrl ?? undefined}
              >
                {fullUrl}
              </div>
              <button
                type="button"
                className="shrink-0 h-9 px-3 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                onClick={onCopyLink}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-[var(--text-muted)]">
              Click{" "}
              <strong className="text-[var(--text-secondary)]">Save</strong> to
              create the shareable link, then copy it here.
            </p>
          )}
          {copied && (
            <p className="text-[11px] text-[var(--accent)]">
              Link copied. Anyone signed in to Shelf can open it (view only).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
