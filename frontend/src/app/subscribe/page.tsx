"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MarketingFooter } from "@/components/MarketingFooter";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { SHELF_PLANS } from "@/lib/plans";
import { Check, Sparkles, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export default function SubscribePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [status, setStatus] = useState<{
    isPremium: boolean;
    priceInr: number;
    planDays: number;
    subscriptionExpiresAt?: string | null;
  } | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

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

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setError("");
    setPaying(true);

    try {
      const order = await api.subscription.createOrder();

      if (!window.Razorpay) {
        throw new Error("Payment gateway failed to load");
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
            await refreshUser();
            router.push("/my-content");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setPaying(false);
    }
  };

  const premiumPrice = status?.priceInr ?? SHELF_PLANS.premium.priceInr;
  const premiumDays = status?.planDays ?? SHELF_PLANS.premium.planDays;
  const isPremium = status?.isPremium ?? user?.plan === "PREMIUM";

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-12 sm:py-16">
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
              <div className="mb-4">
                <span className="text-3xl font-bold">₹{premiumPrice}</span>
                <span className="text-[var(--text-muted)] text-sm ml-1">
                  / {premiumDays} days
                </span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
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

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg mb-3">
                  {error}
                </p>
              )}

              {isPremium ? (
                <Link href="/dashboard" className="btn-primary w-full justify-center">
                  Go to dashboard
                </Link>
              ) : (
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
                    "Upgrade to Premium"
                  ) : (
                    "Sign in to upgrade"
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-center text-[var(--text-muted)]">
            Secure payment via Razorpay. UPI, cards, and net banking accepted.
          </p>
        </div>
      </main>

      {!user && !authLoading && <MarketingFooter />}
    </div>
  );
}
