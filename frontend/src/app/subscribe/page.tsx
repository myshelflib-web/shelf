"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { SHELF_PLANS } from "@/lib/plans";
import {
  captureAffiliateRefFromSearch,
  formatCoinsAsInr,
  getStoredAffiliateRef,
} from "@/lib/affiliateRef";
import { Check, Sparkles, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type BillingChoice = "ONCE" | "MONTHLY" | "YEARLY";

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
          Loading…
        </div>
      }
    >
      <SubscribePageInner />
    </Suspense>
  );
}

function SubscribePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [status, setStatus] = useState<{
    isPremium: boolean;
    priceInr: number;
    planDays: number;
    coinBalance: number;
    subscriptionExpiresAt?: string | null;
    plans?: {
      once: { priceInr: number; planDays: number };
      monthly: { priceInr: number; planDays: number };
      yearly: { priceInr: number; planDays: number };
    };
    recurring?: { interval: string; cancelAtPeriodEnd: boolean } | null;
  } | null>(null);
  const [billing, setBilling] = useState<BillingChoice>("ONCE");
  const [couponCode, setCouponCode] = useState("");
  const [applyCoins, setApplyCoins] = useState(true);
  const [preview, setPreview] = useState<{
    chargeAmount: number;
    couponDiscount: number;
    coinsApplied: number;
    listAmount: number;
  } | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = captureAffiliateRefFromSearch(
      searchParams?.toString() ? `?${searchParams.toString()}` : ""
    );
    setAffiliateCode(fromUrl ?? getStoredAffiliateRef());
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      api.subscription.status().then(setStatus).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (document.getElementById("razorpay-script")) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  const refreshPreview = useCallback(() => {
    if (!user || billing !== "ONCE") {
      setPreview(null);
      return;
    }
    api.subscription
      .preview({
        interval: "ONCE",
        couponCode: couponCode.trim() || undefined,
        applyCoins,
      })
      .then((p) =>
        setPreview({
          chargeAmount: p.chargeAmount,
          couponDiscount: p.couponDiscount,
          coinsApplied: p.coinsApplied,
          listAmount: p.listAmount,
        })
      )
      .catch(() => setPreview(null));
  }, [user, billing, couponCode, applyCoins]);

  useEffect(() => {
    refreshPreview();
  }, [refreshPreview]);

  const finishSuccess = async () => {
    await refreshUser();
    router.push("/my-content");
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setError("");
    setPaying(true);

    try {
      if (!window.Razorpay) {
        throw new Error("Payment gateway failed to load");
      }

      if (billing === "MONTHLY" || billing === "YEARLY") {
        const sub = await api.subscription.createSubscription({
          interval: billing,
          couponCode: couponCode.trim() || undefined,
          affiliateCode: affiliateCode ?? undefined,
        });
        const rzp = new window.Razorpay({
          key: sub.keyId,
          subscription_id: sub.subscriptionId,
          name: sub.name,
          description: sub.description,
          prefill: sub.prefill,
          theme: { color: "#6b8cae" },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_subscription_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await api.subscription.verifySubscription({
                subscriptionId: response.razorpay_subscription_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              await finishSuccess();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Payment verification failed"
              );
            } finally {
              setPaying(false);
            }
          },
          modal: { ondismiss: () => setPaying(false) },
        });
        rzp.open();
        return;
      }

      const order = await api.subscription.createOrder({
        couponCode: couponCode.trim() || undefined,
        affiliateCode: affiliateCode ?? undefined,
        applyCoins,
      });

      if (order.freeActivation) {
        await finishSuccess();
        setPaying(false);
        return;
      }

      if (!order.orderId || !order.keyId) {
        throw new Error("Could not start payment");
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: "#6b8cae" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await api.subscription.verify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            await finishSuccess();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Payment verification failed"
            );
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setPaying(false);
    }
  };

  const plans = status?.plans;
  const oncePrice = plans?.once.priceInr ?? status?.priceInr ?? SHELF_PLANS.premium.priceInr;
  const monthlyPrice = plans?.monthly.priceInr ?? 99;
  const yearlyPrice = plans?.yearly.priceInr ?? oncePrice;
  const displayPrice =
    billing === "MONTHLY"
      ? monthlyPrice
      : billing === "YEARLY"
        ? yearlyPrice
        : preview
          ? preview.chargeAmount / 100
          : oncePrice;
  const periodLabel =
    billing === "MONTHLY" ? "month" : billing === "YEARLY" ? "year" : `${status?.planDays ?? SHELF_PLANS.premium.planDays} days`;
  const isPremium = status?.isPremium ?? user?.plan === "PREMIUM";
  const coinBalance = status?.coinBalance ?? user?.coinBalance ?? 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Sparkles className="w-9 h-9 text-[var(--accent)] mx-auto mb-3" />
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
              Plans
            </h1>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Start free with your own library. Upgrade when you need more storage
              and Study AI tokens.
            </p>
          </div>

          {isPremium && user && (
            <div className="mb-8 p-5 rounded-xl border border-[var(--accent)] bg-[var(--accent-subtle)] text-center">
              <p className="font-semibold mb-1">You&apos;re on Premium</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {status?.subscriptionExpiresAt
                  ? `Active until ${new Date(status.subscriptionExpiresAt).toLocaleDateString()}`
                  : "Full access is active on your account."}
                {status?.recurring
                  ? ` · Recurring ${status.recurring.interval.toLowerCase()}${
                      status.recurring.cancelAtPeriodEnd ? " (cancels at period end)" : ""
                    }`
                  : ""}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                You can renew below to extend your access. Coin credit:{" "}
                {formatCoinsAsInr(coinBalance)}.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
              <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
                {SHELF_PLANS.free.name}
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{SHELF_PLANS.free.priceLabel}</span>
                <span className="text-[var(--text-muted)] text-sm ml-1">
                  {SHELF_PLANS.free.periodLabel}
                </span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                <li className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">Storage:</span>{" "}
                  {SHELF_PLANS.free.storageLabel}
                </li>
                <li className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">Study AI:</span>{" "}
                  {SHELF_PLANS.free.tokensLabel}
                </li>
                {SHELF_PLANS.free.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {user && !isPremium ? (
                <p className="text-sm text-center text-[var(--text-muted)] py-2.5 rounded-full border border-[var(--border)]">
                  Your current plan
                </p>
              ) : (
                <Link
                  href={user ? "/my-content" : "/login"}
                  className="btn-secondary w-full justify-center"
                >
                  {user ? "Continue on Free" : "Sign in to start free"}
                </Link>
              )}
            </div>

            <div className="p-6 rounded-xl border border-[var(--accent)] bg-[var(--bg-secondary)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 text-[11px] font-medium bg-[var(--accent)] text-white rounded-bl-lg">
                Popular
              </div>
              <p className="text-sm font-medium text-[var(--accent)] mb-1">
                {SHELF_PLANS.premium.name}
              </p>
              <div className="mb-3 flex gap-1 p-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                {(
                  [
                    ["ONCE", "One-time"],
                    ["MONTHLY", "Monthly"],
                    ["YEARLY", "Yearly"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBilling(id)}
                    className={`flex-1 text-xs py-1.5 rounded-md transition ${
                      billing === id
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  ₹{Number(displayPrice).toFixed(displayPrice % 1 ? 2 : 0)}
                </span>
                <span className="text-[var(--text-muted)] text-sm ml-1">
                  / {periodLabel}
                </span>
                {billing !== "ONCE" && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    UPI Autopay mandate — cancel anytime from Settings later.
                  </p>
                )}
              </div>
              <ul className="space-y-2.5 mb-4 flex-1">
                <li className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">Storage:</span>{" "}
                  {SHELF_PLANS.premium.storageLabel}
                </li>
                <li className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">Study AI:</span>{" "}
                  {SHELF_PLANS.premium.tokensLabel}
                </li>
                {SHELF_PLANS.premium.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {user && (
                <div className="space-y-2 mb-4">
                  <label className="block text-xs text-[var(--text-muted)]">
                    Coupon code
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onBlur={refreshPreview}
                      placeholder="Optional"
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] font-mono"
                    />
                  </label>
                  {billing === "ONCE" && coinBalance > 0 && (
                    <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={applyCoins}
                        onChange={(e) => setApplyCoins(e.target.checked)}
                      />
                      Apply coin credit ({formatCoinsAsInr(coinBalance)})
                    </label>
                  )}
                  {preview && billing === "ONCE" && (preview.couponDiscount > 0 || preview.coinsApplied > 0) && (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      List ₹{(preview.listAmount / 100).toFixed(0)}
                      {preview.couponDiscount > 0
                        ? ` − coupon ₹${(preview.couponDiscount / 100).toFixed(2)}`
                        : ""}
                      {preview.coinsApplied > 0
                        ? ` − coins ₹${(preview.coinsApplied / 100).toFixed(2)}`
                        : ""}
                    </p>
                  )}
                  {affiliateCode && (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Referral: {affiliateCode}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg mb-3">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubscribe}
                disabled={paying || (user ? !scriptLoaded : false)}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </>
                ) : user ? (
                  isPremium ? "Extend Premium" : "Upgrade to Premium"
                ) : (
                  "Sign in to upgrade"
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-center text-[var(--text-muted)]">
            Secure payment via Razorpay. One-time or UPI Autopay (monthly/yearly).
            Share your affiliate link from Settings to earn coin credit.
          </p>
        </div>
      </main>

      {!user && !authLoading && <MarketingFooter />}
    </div>
  );
}
