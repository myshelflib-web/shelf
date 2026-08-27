"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { LivelyLine } from "@/components/LivelyLine";
import { AccountNav } from "@/components/AccountNav";
import { useAuth } from "@/hooks/useAuth";
import { useAppDialog } from "@/hooks/useAppDialog";
import { api } from "@/lib/api";
import { avatarSrc } from "@/lib/avatar";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser, logout } = useAuth();
  const { confirm } = useAppDialog();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
        Loading...
      </div>
    );
  }

  const preview = avatarSrc(user);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const payload: Parameters<typeof api.auth.updateMe>[0] = {
        name: name.trim(),
      };
      if (avatarUrl.trim()) payload.avatarUrl = avatarUrl.trim();
      if (newPassword) {
        if (user.hasPassword) payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      await api.auth.updateMe(payload);
      await refreshUser();
      setCurrentPassword("");
      setNewPassword("");
      setAvatarUrl("");
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const onAvatarFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setMessage("");
    setUploading(true);
    try {
      await api.auth.uploadAvatar(file);
      await refreshUser();
      setAvatarUrl("");
      setMessage("Picture updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAccount = async () => {
    if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      setError("Type your email exactly to confirm deletion.");
      return;
    }
    const ok = await confirm({
      title: "Delete account",
      message:
        "This permanently deletes your account and library. This cannot be undone.",
      confirmLabel: "Delete account",
      danger: true,
    });
    if (!ok) {
      return;
    }
    setError("");
    setDeleting(true);
    try {
      await api.auth.deleteMe();
      logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <Header />
      <main className="flex-1 px-5 sm:px-6 py-8 max-w-xl mx-auto w-full">
        <h1 className="page-title mb-1">Profile</h1>
        <LivelyLine surface="profile" className="page-subtitle mb-4" />
        <AccountNav current="profile" />

        <form onSubmit={save} className="space-y-6">
          <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
            <h2 className="text-sm font-semibold">Details</h2>
            <div className="flex items-center gap-4">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xl font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <label className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] cursor-pointer hover:border-[var(--accent)]">
                  {uploading ? "Uploading…" : "Upload picture"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => onAvatarFile(e.target.files?.[0])}
                  />
                </label>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  JPEG, PNG, WebP, or GIF · up to 2 MB
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First and last name"
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                The dashboard greets you by your first name only.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                value={user.email}
                disabled
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Picture URL (optional)
              </label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </section>

          {user.hasPassword ? (
            <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
              <h2 className="text-sm font-semibold">Password</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Current password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  Leave blank to keep your current password.
                </p>
              </div>
            </section>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              This account uses Google sign-in, so there is no password to change.
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-[var(--accent)]">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>

        <section className="mt-10 p-5 rounded-xl border border-[var(--border)] space-y-3">
          <h2 className="text-sm font-semibold text-red-400">Delete account</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Permanently removes your collections, chats, and profile. Type your email to confirm.
          </p>
          <input
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={user.email}
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-red-500/50"
          />
          <button
            type="button"
            disabled={deleting}
            onClick={() => void removeAccount()}
            className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </section>
      </main>
    </div>
  );
}
