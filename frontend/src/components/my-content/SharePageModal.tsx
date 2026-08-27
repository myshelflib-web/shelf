"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Share2, X } from "lucide-react";
import { api } from "@/lib/api";
import { avatarSrc } from "@/lib/avatar";
import { ShareGeneralAccess } from "@/components/my-content/ShareGeneralAccess";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

export type ShareRole = "view" | "edit";

type SharePerson = {
  id?: string;
  email: string;
  role: ShareRole;
  pending?: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
};

type LookupUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  onShelf: boolean;
};

type Props = {
  open: boolean;
  pageId: string;
  pageTitle: string;
  onClose: () => void;
};

function initialFromName(name: string) {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

export function SharePageModal({ open, pageId, pageTitle, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<{
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null>(null);
  const [people, setPeople] = useState<SharePerson[]>([]);
  const [generalAccess, setGeneralAccess] = useState<"restricted" | "link">(
    "restricted"
  );
  const [linkPath, setLinkPath] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LookupUser[]>([]);
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.myContent.listShares(pageId);
      setOwner(data.owner);
      setPeople(
        data.shares.map((s) => ({
          id: s.id,
          email: s.email,
          role: s.role,
          pending: s.pending,
          user: s.user,
        }))
      );
      setGeneralAccess(data.generalAccess);
      setLinkPath(data.linkPath);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load shares");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = window.setTimeout(() => {
      void api.myContent
        .lookupUsers(query.trim())
        .then((r) => setSuggestions(r.users))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => window.clearTimeout(t);
  }, [open, query]);

  const copyUrl = useCallback(async (path: string) => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      return true;
    } catch {
      setError("Could not copy link — select and copy it manually");
      return false;
    }
  }, []);

  if (!open) return null;

  const addPerson = (email: string, from?: LookupUser) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    if (owner && normalized === owner.email.toLowerCase()) {
      setError("You already own this file");
      return;
    }
    if (people.some((p) => p.email.toLowerCase() === normalized)) {
      setError("Already added");
      return;
    }
    setPeople((prev) => [
      ...prev,
      {
        email: normalized,
        role: "view",
        pending: !from,
        user: from
          ? {
              id: from.id,
              name: from.name,
              email: from.email,
              avatarUrl: from.avatarUrl,
            }
          : null,
      },
    ]);
    setQuery("");
    setSuggestions([]);
    setError(null);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = await api.myContent.saveShares(pageId, {
        people: people.map((p) => ({ email: p.email, role: p.role })),
        generalAccess,
      });
      setPeople(
        data.shares.map((s) => ({
          id: s.id,
          email: s.email,
          role: s.role,
          pending: s.pending,
          user: s.user,
        }))
      );
      setGeneralAccess(data.generalAccess);
      setLinkPath(data.linkPath);
      setDirty(false);
      // Keep modal open when enabling a link so the URL is visible to copy.
      if (data.generalAccess === "link" && data.linkPath) {
        await copyUrl(data.linkPath);
        return;
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!linkPath) return;
    await copyUrl(linkPath);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-labelledby="share-modal-title"
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="min-w-0">
            <h2
              id="share-modal-title"
              className="text-lg font-semibold text-[var(--text-primary)] truncate"
            >
              Share “{pageTitle}”
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Invite Shelf users by name or email, or enable a view-only link.
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-[var(--text-muted)] mb-2">
              People
            </p>
            <div className="relative">
              <div className="flex items-center gap-2 h-10 px-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-light)]">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPerson(query);
                    }
                  }}
                  placeholder="Search name or email"
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold px-2.5 py-1.5"
                  onClick={() => addPerson(query)}
                >
                  Add
                </button>
              </div>
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl p-1">
                  {suggestions.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-[var(--bg-secondary)]"
                      onClick={() => addPerson(u.email, u)}
                    >
                      <span className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[10px] font-semibold text-[var(--text-secondary)] overflow-hidden">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarSrc({
                              id: u.id,
                              name: u.name,
                              avatarUrl: u.avatarUrl,
                            })!}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initialFromName(u.name)
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-[var(--text-primary)] truncate">
                          {u.name}
                        </span>
                        <span className="block text-[10px] text-[var(--text-muted)] truncate">
                          {u.email}
                        </span>
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
                        On Shelf
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-1">
            {loading ? (
              <p className="text-xs text-[var(--text-muted)] py-2">Loading…</p>
            ) : (
              <>
                {owner && (
                  <div className="flex items-center gap-2.5 min-h-11">
                    <span className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[11px] font-semibold text-[var(--text-secondary)] overflow-hidden shrink-0">
                      {owner.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarSrc({
                            id: owner.id,
                            name: owner.name,
                            avatarUrl: owner.avatarUrl,
                          })!}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initialFromName(owner.name)
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {owner.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {owner.email}
                      </p>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] px-2">
                      Owner
                    </span>
                  </div>
                )}
                {people.map((p) => (
                  <div key={p.email} className="flex items-center gap-2.5 min-h-11">
                    <span className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[11px] font-semibold text-[var(--text-secondary)] overflow-hidden shrink-0">
                      {p.user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarSrc({
                            id: p.user.id,
                            name: p.user.name,
                            avatarUrl: p.user.avatarUrl,
                          })!}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initialFromName(p.user?.name ?? p.email)
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {p.user?.name ?? p.email}
                        {p.pending && (
                          <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[rgba(196,160,122,0.18)] text-[#c4a07a]">
                            Pending
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {p.email}
                      </p>
                    </div>
                    <ShelfSelect
                      compact
                      className="h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] px-2"
                      value={p.role}
                      options={[
                        { value: "view", label: "Can view" },
                        { value: "edit", label: "Can edit" },
                        { value: "remove", label: "Remove access" },
                      ]}
                      aria-label={`Access for ${p.email}`}
                      onChange={(v) => {
                        if (v === "remove") {
                          setPeople((prev) =>
                            prev.filter((x) => x.email !== p.email)
                          );
                          setDirty(true);
                          return;
                        }
                        setPeople((prev) =>
                          prev.map((x) =>
                            x.email === p.email ? { ...x, role: v as ShareRole } : x
                          )
                        );
                        setDirty(true);
                      }}
                    />
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="h-px bg-[var(--border)]" />

          <ShareGeneralAccess
            generalAccess={generalAccess}
            linkPath={linkPath}
            copied={copied}
            onGeneralAccessChange={(value) => {
              setGeneralAccess(value);
              setDirty(true);
            }}
            onCopyLink={() => void copyLink()}
          />
        </div>

        <div className="flex items-center gap-2 px-5 py-3.5 border-t border-[var(--border)]">
          {dirty ? (
            <span className="text-[11px] text-[#c4a07a]">Unsaved changes</span>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)] flex-1 flex items-center gap-1.5 min-w-0">
              <Share2 className="w-3 h-3 shrink-0" />
              <span className="truncate">
                Named users can view or edit. Link access is view-only.
              </span>
            </span>
          )}
          <div className="flex-1" />
          <button
            type="button"
            className="h-8 px-3 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            onClick={onClose}
          >
            {linkPath && generalAccess === "link" && !dirty ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            className="h-8 px-3 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold disabled:opacity-50"
            disabled={
              saving ||
              loading ||
              (!dirty && !(generalAccess === "link" && !linkPath))
            }
            onClick={() => void save()}
          >
            {saving
              ? "Saving…"
              : generalAccess === "link" && !linkPath
                ? "Save & create link"
                : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
