"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MarketingFooter } from "@/components/MarketingFooter";
import { SubscribePremiumCard } from "@/components/subscribe/SubscribePremiumCard";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { SHELF_PLANS, PRICING_FALLBACK } from "@/lib/plans";
import {
  captureAffiliateRefFromSearch,
  formatCoinsAsInr,
  getStoredAffiliateRef,
} from "@/lib/affiliateRef";
import { Check, Sparkles } from "lucide-react";

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
  const [couponCode, setCouponCode] = useState("");
  const [applyCoins, setApplyCoins] = useState(true);
  const [preview, setPreview] = useState<{
    chargeAmount: number;
    couponDiscount: number;
    coinsApplied: number;
    listAmount: number;
  } | null>(null);
  const [payingInterval, setPayingInterval] = useState<BillingChoice | null>(null);
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
    if (!user) {
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
  }, [user, couponCode, applyCoins]);

  useEffect(() => {
    refreshPreview();
  }, [refreshPreview]);

  const finishSuccess = async () => {
    await refreshUser();
    router.push("/my-content");
  };

  const handleSubscribe = async (billing: BillingChoice) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setError("");
    setPayingInterval(billing);

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
              setPayingInterval(null);
            }
          },
          modal: { ondismiss: () => setPayingInterval(null) },
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
        setPayingInterval(null);
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
            setPayingInterval(null);
          }
        },
        modal: { ondismiss: () => setPayingInterval(null) },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setPayingInterval(null);
    }
  };

  const plans = status?.plans;
  const oncePrice = plans?.once.priceInr ?? status?.priceInr ?? SHELF_PLANS.premium.priceInr;
  const monthlyPrice = plans?.monthly.priceInr ?? PRICING_FALLBACK.monthlyInr;
  const yearlyPrice = plans?.yearly.priceInr ?? oncePrice;
  const onceDisplayPrice = preview ? preview.chargeAmount / 100 : oncePrice;
  const isPremium = status?.isPremium ?? user?.plan === "PREMIUM";
  const coinBalance = status?.coinBalance ?? user?.coinBalance ?? 0;
  const premiumFeatures = SHELF_PLANS.premium.features;
  const billingMeta = SHELF_PLANS.premium.billingOptions;

  const paidCards: {
    interval: BillingChoice;
    name: string;
    tagline: string;
    priceLabel: string;
    periodLabel: string;
    note: string;
    badge?: string;
    buttonLabel: string;
  }[] = [
    {
      interval: "MONTHLY",
      name: billingMeta.monthly.name,
      tagline: billingMeta.monthly.tagline,
      priceLabel: `₹${monthlyPrice}`,
      periodLabel: billingMeta.monthly.periodLabel,
      note: billingMeta.monthly.note,
      buttonLabel: user ? (isPremium ? "Switch to monthly" : "Subscribe monthly") : "Sign in to subscribe",
    },
    {
      interval: "YEARLY",
      name: billingMeta.yearly.name,
      tagline: billingMeta.yearly.tagline,
      priceLabel: `₹${yearlyPrice}`,
      periodLabel: billingMeta.yearly.periodLabel,
      note: billingMeta.yearly.note,
      badge: billingMeta.yearly.badge,
      buttonLabel: user ? (isPremium ? "Switch to yearly" : "Subscribe yearly") : "Sign in to subscribe",
    },
    {
      interval: "ONCE",
      name: billingMeta.once.name,
      tagline: billingMeta.once.tagline,
      priceLabel: `₹${Number(onceDisplayPrice).toFixed(onceDisplayPrice % 1 ? 2 : 0)}`,
      periodLabel: `${status?.planDays ?? SHELF_PLANS.premium.planDays} days`,
      note: billingMeta.once.note,
      buttonLabel: user ? (isPremium ? "Extend one year" : "Pay once") : "Sign in to upgrade",
    },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Sparkles className="w-9 h-9 text-[var(--accent)] mx-auto mb-3" />
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
              {SHELF_PLANS.page.title}
            </h1>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              {SHELF_PLANS.page.intro}
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
                Renew or switch billing below. Coin credit: {formatCoinsAsInr(coinBalance)}.
              </p>
            </div>
          )}

          <div className="mb-8 p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
            <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
              {SHELF_PLANS.free.name}
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              {SHELF_PLANS.free.tagline}
            </p>
            <div className="mb-3">
              <span className="text-3xl font-bold">{SHELF_PLANS.free.priceLabel}</span>
              <span className="text-[var(--text-muted)] text-sm ml-1">
                {SHELF_PLANS.free.periodLabel}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5 max-w-3xl">
              {SHELF_PLANS.free.description}
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 mb-6">
              {SHELF_PLANS.free.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {user && !isPremium ? (
              <p className="text-sm text-center text-[var(--text-muted)] py-2.5 rounded-full border border-[var(--border)] max-w-xs">
                Your current plan
              </p>
            ) : (
              <Link
                href={user ? "/my-content" : "/login"}
                className="btn-secondary inline-flex justify-center max-w-xs"
              >
                {user ? "Continue on Free" : "Sign in to start free"}
              </Link>
            )}
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-1">{SHELF_PLANS.premium.name}</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-3xl">
              {SHELF_PLANS.premium.description}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg mb-4">
              {error}
            </p>
          )}

          <div className="grid md:grid-cols-3 gap-5 mb-6">
            {paidCards.map((card) => (
              <SubscribePremiumCard
                key={card.interval}
                name={card.name}
                tagline={card.tagline}
                priceLabel={card.priceLabel}
                periodLabel={card.periodLabel}
                note={card.note}
                badge={card.badge}
                features={premiumFeatures}
                buttonLabel={card.buttonLabel}
                paying={payingInterval === card.interval}
                disabled={payingInterval !== null || (user ? !scriptLoaded : false)}
                onSubscribe={() => handleSubscribe(card.interval)}
              />
            ))}
          </div>

          {user && (
            <div className="mb-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-2 max-w-xl">
              <label className="block text-xs text-[var(--text-muted)]">
                Coupon code (all paid plans)
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onBlur={refreshPreview}
                  placeholder="Optional"
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] font-mono"
                />
              </label>
              {coinBalance > 0 && (
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={applyCoins}
                    onChange={(e) => setApplyCoins(e.target.checked)}
                  />
                  Apply coin credit on one-time plan ({formatCoinsAsInr(coinBalance)})
                </label>
              )}
              {preview && (preview.couponDiscount > 0 || preview.coinsApplied > 0) && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  One-time list ₹{(preview.listAmount / 100).toFixed(0)}
                  {preview.couponDiscount > 0
                    ? ` − coupon ₹${(preview.couponDiscount / 100).toFixed(2)}`
                    : ""}
                  {preview.coinsApplied > 0
                    ? ` − coins ₹${(preview.coinsApplied / 100).toFixed(2)}`
                    : ""}
                </p>
              )}
              {affiliateCode && (
                <p className="text-[11px] text-[var(--text-muted)]">Referral: {affiliateCode}</p>
              )}
            </div>
          )}

          <p className="text-xs text-center text-[var(--text-muted)]">
            {SHELF_PLANS.page.footnote} Secure payment via Razorpay. Monthly and yearly use
            UPI Autopay. Share your affiliate link from Settings to earn coin credit.
          </p>
        </div>
      </main>

      {!user && !authLoading && <MarketingFooter />}
    </div>
  );
}
