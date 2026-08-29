"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { SHELF_PLANS, PRICING_FALLBACK } from "@/lib/plans";
import {
  captureAffiliateRefFromSearch,
  formatCoinsAsInr,
  getStoredAffiliateRef,
} from "@/lib/affiliateRef";
import { GreetingDots } from "@/components/GreetingAccent";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type BillingChoice = "MONTHLY" | "YEARLY";

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
  const { user, refreshUser } = useAuth();
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
  const [billing, setBilling] = useState<BillingChoice>("YEARLY");
  const [couponCode, setCouponCode] = useState("");
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

  const finishSuccess = async () => {
    await refreshUser();
    const next = searchParams?.get("next");
    const dest =
      next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/subscribe")
        ? next
        : "/my-content";
    router.push(dest);
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
        theme: { color: "#625bc4" },
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setPaying(false);
    }
  };

  const plans = status?.plans;
  const yearlyFallback =
    plans?.yearly.priceInr ??
    plans?.once.priceInr ??
    status?.priceInr ??
    SHELF_PLANS.premium.priceInr;
  const monthlyPrice = plans?.monthly.priceInr ?? PRICING_FALLBACK.monthlyInr;
  const yearlyPrice = yearlyFallback;
  const displayPrice = billing === "MONTHLY" ? monthlyPrice : yearlyPrice;
  const periodLabel = billing === "MONTHLY" ? "month" : "year";
  const isPremium = status?.isPremium ?? user?.plan === "PREMIUM";
  const coinBalance = status?.coinBalance ?? user?.coinBalance ?? 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />

      <main className="plans-page flex-1 min-h-0 overflow-hidden">
        <div className="plans-page-inner">
          <header className="plans-hero">
            <div className="plans-kicker">
              <Heart className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden />
              {SHELF_PLANS.page.kicker}
            </div>
            <h1 className="plans-hero-title">
              {SHELF_PLANS.page.title}
              <GreetingDots />
            </h1>
            <p className="plans-lead">{SHELF_PLANS.page.intro}</p>
          </header>

          {isPremium && user ? (
            <div className="plans-status">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                You&apos;re on Premium
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {status?.subscriptionExpiresAt
                  ? `Active until ${new Date(status.subscriptionExpiresAt).toLocaleDateString()}`
                  : "Full access is active on your account."}
                {status?.recurring
                  ? ` · Recurring ${status.recurring.interval.toLowerCase()}${
                      status.recurring.cancelAtPeriodEnd
                        ? " (cancels at period end)"
                        : ""
                    }`
                  : ""}
                {" · "}
                Coin credit: {formatCoinsAsInr(coinBalance)}
              </p>
            </div>
          ) : null}

          <div className="plans-grid">
            <article className="plans-card">
              <p className="plans-card-label">{SHELF_PLANS.free.name}</p>
              <p className="plans-card-tagline">{SHELF_PLANS.free.tagline}</p>
              <div className="plans-price">
                <span className="plans-price-amount">{SHELF_PLANS.free.priceLabel}</span>
                <span className="plans-price-period">{SHELF_PLANS.free.periodLabel}</span>
              </div>
              <p className="plans-card-desc">{SHELF_PLANS.free.description}</p>
              <ul className="plans-features">
                {SHELF_PLANS.free.features.map((f) => (
                  <li key={f}>
                    <Check strokeWidth={2.25} aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="plans-card-actions">
                {user && !isPremium ? (
                  <p className="text-center text-xs text-[var(--text-muted)] py-2 rounded-lg border border-[var(--border)]">
                    Your current plan
                  </p>
                ) : (
                  <Link
                    href={user ? "/my-content" : "/login"}
                    className="landing-btn w-full"
                  >
                    {user ? "Continue on Free" : "Sign in to start free"}
                  </Link>
                )}
              </div>
            </article>

            <article className="plans-card plans-card-premium">
              <span className="plans-badge">Popular</span>
              <p className="plans-card-label">{SHELF_PLANS.premium.name}</p>
              <p className="plans-card-tagline">{SHELF_PLANS.premium.tagline}</p>
              <div className="plans-billing" role="group" aria-label="Billing period">
                {(
                  [
                    ["MONTHLY", "Monthly"],
                    ["YEARLY", "Yearly"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={billing === id}
                    onClick={() => setBilling(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="plans-price">
                <span className="plans-price-amount">₹{displayPrice}</span>
                <span className="plans-price-period">/ {periodLabel}</span>
              </div>
              <p className="plans-billing-note">
                UPI Autopay — cancel anytime from Settings
              </p>
              <p className="plans-card-desc">{SHELF_PLANS.premium.description}</p>
              <ul className="plans-features">
                {SHELF_PLANS.premium.features.map((f) => (
                  <li key={f}>
                    <Check strokeWidth={2.25} aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="plans-card-actions">
                {user ? (
                  <label className="plans-coupon block text-[10px] text-[var(--text-muted)]">
                    Coupon code
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Optional"
                    />
                  </label>
                ) : null}
                {affiliateCode ? (
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Referral: {affiliateCode}
                  </p>
                ) : null}
                {error ? (
                  <p className="text-xs text-red-500 bg-red-500/10 px-2 py-1.5 rounded-lg">
                    {error}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={paying || (user ? !scriptLoaded : false)}
                  className="landing-btn landing-btn-primary w-full disabled:opacity-50"
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
            </article>
          </div>

          <p className="plans-footnote">{SHELF_PLANS.page.footnote}</p>
        </div>
      </main>
    </div>
  );
}
