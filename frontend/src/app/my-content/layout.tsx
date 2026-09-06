"use client";

import { MyContentAddProvider } from "@/components/my-content/MyContentAddProvider";
import { OnboardingRedirect } from "@/components/onboarding/OnboardingRedirect";
import { WritingAssistHost } from "@/components/writing-assist/WritingAssistHost";

export default function MyContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MyContentAddProvider>
      <OnboardingRedirect />
      {children}
      <WritingAssistHost />
    </MyContentAddProvider>
  );
}
