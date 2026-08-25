"use client";

import { MyContentAddProvider } from "@/components/my-content/MyContentAddProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MyContentAddProvider>{children}</MyContentAddProvider>;
}
