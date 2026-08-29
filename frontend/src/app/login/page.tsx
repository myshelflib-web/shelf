"use client";

import { Header } from "@/components/Header";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center px-4">
        <LoginForm />
      </main>
    </div>
  );
}
