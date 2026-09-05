"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SocialLinks } from "@/components/SocialLinks";
import { Mail, MessageSquare, Share2 } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    const subject = encodeURIComponent(`Shelf contact from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    window.location.href = `mailto:hello@shelf.study?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-16 sm:py-20 max-w-2xl mx-auto w-full">
        <RevealOnScroll>
          <p className="text-sm font-medium text-[var(--accent)] mb-3 tracking-wide uppercase">
            Contact
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
            Talk to us
          </h1>
          <p className="text-[var(--text-secondary)] mb-10 leading-relaxed">
            Questions about Shelf, billing, or your account? Send a note — we read
            every message.
          </p>
        </RevealOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 items-stretch">
          <RevealOnScroll delay={60} className="h-full">
            <div className="feature-card h-full p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
              <div className="flex items-center gap-2.5 mb-2">
                <Mail className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
                <p className="font-medium">Email</p>
              </div>
              <a
                href="mailto:myshelflib@gmail.com"
                className="text-sm text-[var(--accent)] hover:underline mt-auto"
              >
                myshelflib@gmail.com
              </a>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={120} className="h-full">
            <div className="feature-card h-full p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
              <div className="flex items-center gap-2.5 mb-2">
                <MessageSquare className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
                <p className="font-medium">Support</p>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-auto">
                Account, uploads, and Study AI help — usually within 1–2 business days.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={180} className="h-full">
            <div className="feature-card h-full p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
              <div className="flex items-center gap-2.5 mb-2">
                <Share2 className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
                <p className="font-medium">Follow</p>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Instagram, YouTube, and LinkedIn.
              </p>
              <div className="mt-auto">
                <SocialLinks />
              </div>
            </div>
          </RevealOnScroll>
        </div>

        <RevealOnScroll delay={240}>
          <form
            onSubmit={onSubmit}
            className="space-y-4 p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Name
              </label>
              <input
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm resize-y"
              />
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Send message
            </button>
            {sent && (
              <p className="text-sm text-[var(--text-secondary)]">
                Opening your email app… or write directly to{" "}
                <a href="mailto:myshelflib@gmail.com" className="text-[var(--accent)]">
                  myshelflib@gmail.com
                </a>
                .
              </p>
            )}
          </form>
        </RevealOnScroll>

        <p className="text-sm text-[var(--text-muted)] mt-8 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
