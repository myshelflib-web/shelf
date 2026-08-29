"use client";

import { Check, ArrowRight } from "lucide-react";
import { SHELF_PLANS } from "@/lib/plans";

type OnboardingPlanStepProps = {
  saving: boolean;
  onContinueFree: () => void;
  onUpgrade: () => void;
};

export function OnboardingPlanStep({
  saving,
  onContinueFree,
  onUpgrade,
}: OnboardingPlanStepProps) {
  return (
    <>
      <p className="onboarding-step-label">Step 3 of 3</p>
      <h1 className="onboarding-title">Choose how you&apos;d like to start</h1>
      <p className="onboarding-lead">
        Free is fully usable from day one. Upgrade anytime when you need more
        library space and Study AI — you can change this later on Plans.
      </p>

      <div className="onboarding-plan-grid">
        <div className="onboarding-plan-card">
          <p className="onboarding-plan-name">{SHELF_PLANS.free.name}</p>
          <p className="onboarding-plan-price">
            {SHELF_PLANS.free.priceLabel}
            <span> {SHELF_PLANS.free.periodLabel}</span>
          </p>
          <p className="onboarding-plan-tagline">{SHELF_PLANS.free.tagline}</p>
          <ul className="onboarding-plan-features">
            {SHELF_PLANS.free.features.slice(0, 5).map((f) => (
              <li key={f}>
                <Check strokeWidth={2.25} aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="onboarding-plan-card onboarding-plan-card-premium">
          <p className="onboarding-plan-name">{SHELF_PLANS.premium.name}</p>
          <p className="onboarding-plan-price">
            ₹{SHELF_PLANS.premium.priceInr}
            <span> / year</span>
          </p>
          <p className="onboarding-plan-tagline">{SHELF_PLANS.premium.tagline}</p>
          <ul className="onboarding-plan-features">
            {SHELF_PLANS.premium.features.slice(0, 5).map((f) => (
              <li key={f}>
                <Check strokeWidth={2.25} aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="onboarding-actions">
        <button
          type="button"
          disabled={saving}
          className="onboarding-btn onboarding-btn-primary"
          onClick={onContinueFree}
        >
          {saving ? "Saving…" : "Continue on Free"}
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={saving}
          className="onboarding-btn"
          onClick={onUpgrade}
        >
          Upgrade to Premium
        </button>
        <button
          type="button"
          disabled={saving}
          className="onboarding-btn onboarding-btn-ghost"
          onClick={onContinueFree}
        >
          Skip for now
        </button>
      </div>
    </>
  );
}
