"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { ReadingGoalPicker } from "@/components/dashboard/ReadingGoalPicker";
import { ShelfLogo } from "@/components/ShelfLogo";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { markOnboardingComplete } from "@/lib/onboarding";
import { destinationAfterOnboarding, destinationAfterSignIn } from "@/lib/postAuthNavigation";
import { getReadingGoalMinutes, setReadingGoalMinutes } from "@/lib/readingStats";
import { STUDY_GOAL_GROUPS, STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import { StudyGoal } from "@/types";
import { OnboardingPlanStep } from "@/components/onboarding/OnboardingPlanStep";

const STEPS = ["welcome", "goal", "optional", "plan"] as const;

const GOAL_OPTIONS: StudyGoal[] = STUDY_GOAL_GROUPS.flatMap((g) => g.options);

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/my-content";
  if (raw.startsWith("/onboarding") || raw.startsWith("/login") || raw.startsWith("/subscribe")) {
    return "/my-content";
  }
  return raw;
}

export function OnboardingWizard({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [studyGoal, setStudyGoal] = useState<StudyGoal>("GENERAL");
  const [readingGoalMin, setReadingGoalMin] = useState(() => getReadingGoalMinutes());
  const [saving, setSaving] = useState(false);
  const completedRef = useRef(false);

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "there";

  useEffect(() => {
    track(AnalyticsEvents.onboardingStepViewed, {
      step: STEPS[step] ?? String(step),
      stepIndex: step,
    });
  }, [step]);

  useEffect(() => {
    const onLeave = () => {
      if (completedRef.current || step === 0) return;
      track(AnalyticsEvents.onboardingAbandoned, {
        step: STEPS[step] ?? String(step),
        stepIndex: step,
      });
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [step]);

  const finish = async (opts?: { saveOptional?: boolean }) => {
    if (!user) return;
    setSaving(true);
    try {
      if (studyGoal !== "GENERAL") {
        await api.auth.updateMe({ studyGoal });
      }
      if (opts?.saveOptional) {
        setReadingGoalMinutes(readingGoalMin);
      }
      await refreshUser();
      markOnboardingComplete(user.id);
      completedRef.current = true;
      track(AnalyticsEvents.onboardingCompleted, {
        studyGoal,
        chosePremium: false,
      });
      router.replace(await destinationAfterOnboarding(nextPath, studyGoal));
    } catch {
      markOnboardingComplete(user.id);
      completedRef.current = true;
      track(AnalyticsEvents.onboardingCompleted, {
        studyGoal,
        chosePremium: false,
        hadError: true,
      });
      router.replace(await destinationAfterOnboarding(nextPath, studyGoal));
    } finally {
      setSaving(false);
    }
  };

  const skipAll = () => {
    if (!user || saving) return;
    markOnboardingComplete(user.id);
    completedRef.current = true;
    track(AnalyticsEvents.onboardingSkipped, {
      step: STEPS[step] ?? String(step),
      stepIndex: step,
    });
    void destinationAfterSignIn(nextPath).then((href) => {
      router.replace(href);
    });
  };

  const goToPremium = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      if (studyGoal !== "GENERAL") {
        await api.auth.updateMe({ studyGoal });
      }
      setReadingGoalMinutes(readingGoalMin);
      await refreshUser();
      markOnboardingComplete(user.id);
      completedRef.current = true;
      track(AnalyticsEvents.onboardingCompleted, {
        studyGoal,
        chosePremium: true,
      });
      const dest = await destinationAfterOnboarding(nextPath, studyGoal);
      router.replace(`/subscribe?next=${encodeURIComponent(dest)}`);
    } catch {
      markOnboardingComplete(user.id);
      completedRef.current = true;
      track(AnalyticsEvents.onboardingCompleted, {
        studyGoal,
        chosePremium: true,
        hadError: true,
      });
      const dest = await destinationAfterOnboarding(nextPath, studyGoal);
      router.replace(`/subscribe?next=${encodeURIComponent(dest)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-shell">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShelfLogo size={28} />
          <span className="text-sm font-semibold tracking-tight">Shelf</span>
        </div>
        <button
          type="button"
          onClick={skipAll}
          disabled={saving}
          className="onboarding-skip"
        >
          Skip for now
        </button>
      </div>

      <div className="onboarding-card">
        {step === 0 && (
          <>
            <p className="onboarding-kicker">Welcome</p>
            <h1 className="onboarding-title">Hi {firstName}, glad you&apos;re here</h1>
            <p className="onboarding-lead">
              Shelf is your personal study library — upload PDFs, highlight as you
              read, ask Study AI from your notes, and plan revision on a calendar.
              A quick setup helps us tailor Study AI; everything is optional and
              editable later.
            </p>
            <div className="mt-5 p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--lp-accent-border)] text-sm text-[var(--text-secondary)] flex gap-3">
              <Sparkles className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
              <span>
                You can change your study goal, reading target, and theme anytime
                in <Link href="/settings">Settings</Link>.
              </span>
            </div>
            <div className="onboarding-actions">
              <button
                type="button"
                className="onboarding-btn onboarding-btn-primary"
                onClick={() => setStep(1)}
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="onboarding-step-label">Step 1 of 3</p>
            <h1 className="onboarding-title">What are you studying for?</h1>
            <p className="onboarding-lead">
              Study AI uses this to stay on syllabus and exam style. Choose a track,
              or keep General if you&apos;re exploring.
            </p>
            <div className="onboarding-section !mt-4 !pt-0 !border-0">
              <div className="onboarding-goal-grid" role="group" aria-label="Study goal">
                {GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    className={`onboarding-goal-pill${
                      studyGoal === goal ? " onboarding-goal-pill-active" : ""
                    }`}
                    onClick={() => setStudyGoal(goal)}
                  >
                    {STUDY_GOAL_LABELS[goal]}
                  </button>
                ))}
              </div>
            </div>
            <div className="onboarding-actions">
              <button
                type="button"
                className="onboarding-btn onboarding-btn-primary"
                onClick={() => setStep(2)}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="onboarding-btn onboarding-btn-ghost"
                onClick={() => setStep(2)}
              >
                Skip — keep General
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="onboarding-step-label">Step 2 of 3</p>
            <h1 className="onboarding-title">A few nice-to-haves</h1>
            <p className="onboarding-lead">
              Optional preferences you can skip — we&apos;ll use sensible defaults.
            </p>

            <div className="onboarding-section">
              <h2>
                Daily reading goal
                <span className="onboarding-optional-tag">Optional</span>
              </h2>
              <p>Shown on your dashboard reading ring.</p>
              <ReadingGoalPicker
                value={readingGoalMin}
                onChange={setReadingGoalMin}
              />
            </div>

            <div className="onboarding-section">
              <h2>
                Appearance
                <span className="onboarding-optional-tag">Optional</span>
              </h2>
              <p>Pick light or dark — same as the header toggle later.</p>
              <div className="flex gap-2">
                {(["light", "dark"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`onboarding-goal-pill capitalize${
                      theme === mode ? " onboarding-goal-pill-active" : ""
                    }`}
                    onClick={() => setTheme(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-actions">
              <button
                type="button"
                disabled={saving}
                className="onboarding-btn onboarding-btn-primary"
                onClick={() => {
                  if (readingGoalMin) setReadingGoalMinutes(readingGoalMin);
                  setStep(3);
                }}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={saving}
                className="onboarding-btn onboarding-btn-ghost"
                onClick={() => setStep(3)}
              >
                Skip optional
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <OnboardingPlanStep
            saving={saving}
            onContinueFree={() => void finish({ saveOptional: true })}
            onUpgrade={() => void goToPremium()}
          />
        )}

        <div className="onboarding-progress" aria-hidden>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-progress-dot${
                i <= step ? " onboarding-progress-dot-active" : ""
              }`}
            />
          ))}
        </div>
      </div>

      <p className="onboarding-footnote">
        You can update study goal, reading target, Telegram, and more in{" "}
        <Link href="/settings">Settings</Link> whenever you like.
      </p>
    </div>
  );
}

export { safeNextPath };
