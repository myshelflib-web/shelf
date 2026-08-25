"use client";

import { MyContentAddProvider } from "@/components/my-content/MyContentAddProvider";

export default function MyContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MyContentAddProvider>{children}</MyContentAddProvider>;
}
