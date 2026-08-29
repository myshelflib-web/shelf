"use client";

import { MyContentAddProvider } from "@/components/my-content/MyContentAddProvider";
import { OnboardingRedirect } from "@/components/onboarding/OnboardingRedirect";

export default function MyContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MyContentAddProvider>
      <OnboardingRedirect />
      {children}
    </MyContentAddProvider>
  );
}
