"use client";

import { Header } from "@/components/Header";
import { LoginForm } from "@/components/LoginForm";
import { usePreferAppChrome } from "@/hooks/usePreferAppChrome";

export default function LoginPage() {
  const appChrome = usePreferAppChrome();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      {!appChrome ? <Header /> : null}
      <main
        className={`flex-1 min-h-0 overflow-y-auto flex justify-center px-5 ${
          appChrome
            ? "items-stretch pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            : "items-center px-4"
        }`}
      >
        <LoginForm appShell={appChrome} />
      </main>
    </div>
  );
}
