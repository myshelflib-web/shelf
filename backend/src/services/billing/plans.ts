export type PlanInterval = "ONCE" | "MONTHLY" | "YEARLY";

export type BillingPlan = {
  interval: PlanInterval;
  amountPaise: number;
  planDays: number;
  label: string;
  periodLabel: string;
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** One-time / yearly list prices — monthly & yearly recurring use separate env. */
export function getBillingPlans(): Record<PlanInterval, BillingPlan> {
  const onceAmount = envInt("SUBSCRIPTION_AMOUNT_PAISE", 99900);
  const onceDays = envInt("SUBSCRIPTION_DAYS", 365);
  const monthlyAmount = envInt("SUBSCRIPTION_MONTHLY_AMOUNT_PAISE", 9900);
  const yearlyAmount = envInt("SUBSCRIPTION_YEARLY_AMOUNT_PAISE", onceAmount);

  return {
    ONCE: {
      interval: "ONCE",
      amountPaise: onceAmount,
      planDays: onceDays,
      label: "Premium",
      periodLabel: `${onceDays} days`,
    },
    MONTHLY: {
      interval: "MONTHLY",
      amountPaise: monthlyAmount,
      planDays: 30,
      label: "Premium Monthly",
      periodLabel: "month",
    },
    YEARLY: {
      interval: "YEARLY",
      amountPaise: yearlyAmount,
      planDays: 365,
      label: "Premium Yearly",
      periodLabel: "year",
    },
  };
}

export function resolvePlan(interval: string | undefined): BillingPlan {
  const plans = getBillingPlans();
  const key = (interval ?? "ONCE").toUpperCase() as PlanInterval;
  return plans[key] ?? plans.ONCE;
}

export function affiliateCommissionBps(): number {
  return envInt("AFFILIATE_COMMISSION_BPS", 1000); // 10%
}

export function affiliateCookieDays(): number {
  return envInt("AFFILIATE_ATTRIBUTION_DAYS", 30);
}
