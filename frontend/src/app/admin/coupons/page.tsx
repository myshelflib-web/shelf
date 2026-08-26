"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCoinsAsInr } from "@/lib/affiliateRef";
import clsx from "clsx";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  maxUses: number | null;
  maxUsesPerUser: number;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  minAmount: number | null;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [affiliates, setAffiliates] = useState<
    {
      code: string;
      user: { name: string; email: string; coinBalance: number };
      totalEarnedCoins: number;
      referralCount: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT" as "PERCENT" | "FIXED",
    value: "20",
    maxUses: "",
    maxUsesPerUser: "1",
    validUntil: "",
    minAmount: "",
  });
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([api.adminCoupons.list(), api.adminCoupons.affiliates()])
      .then(([c, a]) => {
        setCoupons(c.coupons);
        setAffiliates(a.affiliates);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const value =
        form.type === "PERCENT"
          ? Number(form.value)
          : Math.round(Number(form.value) * 100);
      await api.adminCoupons.create({
        code: form.code,
        type: form.type,
        value,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : 1,
        validUntil: form.validUntil
          ? new Date(form.validUntil).toISOString()
          : null,
        minAmount: form.minAmount
          ? Math.round(Number(form.minAmount) * 100)
          : null,
      });
      setForm({
        code: "",
        type: "PERCENT",
        value: "20",
        maxUses: "",
        maxUsesPerUser: "1",
        validUntil: "",
        minAmount: "",
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create coupon");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      if (c.active) await api.adminCoupons.deactivate(c.id);
      else await api.adminCoupons.update(c.id, { active: true });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Coupons & affiliates</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Create discount codes and review affiliate coin earnings.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <section className="rounded-xl border border-[var(--border)] p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New coupon
        </h2>
        <form onSubmit={onCreate} className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs space-y-1">
            <span className="text-[var(--text-muted)]">Code</span>
            <input
              required
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm font-mono"
              placeholder="SHELF20"
            />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-[var(--text-muted)]">Type</span>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as "PERCENT" | "FIXED",
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm"
            >
              <option value="PERCENT">Percent off</option>
              <option value="FIXED">Fixed ₹ off</option>
            </select>
          </label>
          <label className="text-xs space-y-1">
            <span className="text-[var(--text-muted)]">
              {form.type === "PERCENT" ? "Percent (1–100)" : "Amount (₹)"}
            </span>
            <input
              required
              type="number"
              min={1}
              step={form.type === "PERCENT" ? 1 : 0.01}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm"
            />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-[var(--text-muted)]">Max total uses (blank = ∞)</span>
            <input
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm"
            />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-[var(--text-muted)]">Max uses per user</span>
            <input
              type="number"
              min={0}
              value={form.maxUsesPerUser}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxUsesPerUser: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm"
            />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-[var(--text-muted)]">Valid until</span>
            <input
              type="date"
              value={form.validUntil}
              onChange={(e) =>
                setForm((f) => ({ ...f, validUntil: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm"
            />
          </label>
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="text-[var(--text-muted)]">Min order ₹ (optional)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={form.minAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, minAmount: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={creating}
            className="btn-primary sm:col-span-2 justify-center disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create coupon"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Coupons</h2>
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No coupons yet.</p>
        ) : (
          <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <span className="font-mono font-medium">{c.code}</span>
                <span className="text-[var(--text-muted)]">
                  {c.type === "PERCENT"
                    ? `${c.value}% off`
                    : `₹${(c.value / 100).toFixed(0)} off`}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  used {c.usedCount}
                  {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                </span>
                {c.validUntil && (
                  <span className="text-xs text-[var(--text-muted)]">
                    until {new Date(c.validUntil).toLocaleDateString()}
                  </span>
                )}
                <span
                  className={clsx(
                    "text-xs px-2 py-0.5 rounded-full",
                    c.active
                      ? "bg-green-500/10 text-green-500"
                      : "bg-gray-500/10 text-gray-400"
                  )}
                >
                  {c.active ? "Active" : "Off"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleActive(c)}
                  className="ml-auto text-[var(--accent)] inline-flex items-center gap-1 text-xs"
                >
                  {c.active ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                  {c.active ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Affiliates</h2>
        {affiliates.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No affiliates yet.</p>
        ) : (
          <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {affiliates.map((a) => (
              <div
                key={a.code}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <span className="font-mono">{a.code}</span>
                <span className="truncate">{a.user.name}</span>
                <span className="text-xs text-[var(--text-muted)] truncate">
                  {a.user.email}
                </span>
                <span className="text-xs text-[var(--text-muted)] ml-auto">
                  {a.referralCount} refs · earned{" "}
                  {formatCoinsAsInr(a.totalEarnedCoins)} · balance{" "}
                  {formatCoinsAsInr(a.user.coinBalance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
