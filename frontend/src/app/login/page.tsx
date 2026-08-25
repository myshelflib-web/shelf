"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { ShelfLogo } from "@/components/ShelfLogo";
import { ThinkingIndicator } from "@/components/GreetingAccent";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/my-content";
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const { login, register, user, loading: authLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return <ThinkingIndicator label="Loading" />;
  }

  if (user) {
    router.replace(nextPath);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <ShelfLogo size={40} />
        </div>
        <h1 className="text-2xl font-bold">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {isRegister
            ? "Create your study library"
            : "Sign in to continue learning"}
        </p>
      </div>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--bg-secondary)] px-2 text-[var(--text-muted)]">
              or continue with
            </span>
          </div>
        </div>

        <GoogleSignInButton onError={setError} redirectTo={nextPath} />
      </div>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
          className="text-[var(--accent)] hover:underline"
        >
          {isRegister ? "Sign In" : "Register"}
        </button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <Suspense fallback={<ThinkingIndicator label="Loading" />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
