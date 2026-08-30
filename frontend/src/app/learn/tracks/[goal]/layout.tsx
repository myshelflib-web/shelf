import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearnTrackJsonLd } from "@/components/seo/LearnTrackJsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  LEARN_TRACK_SEO,
  goalFromTrackSlug,
  learnTrackPath,
} from "@/lib/seo/learnTrackSeo";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ goal: string }>;
};

async function fetchTrackSubjects(goal: string) {
  try {
    const res = await fetch(`${API_URL}/api/subjects?studyGoal=${goal}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      subjects?: Array<{
        name: string;
        slug: string;
        topics: Array<{ title: string; slug: string }>;
      }>;
    };
    return data.subjects ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: Pick<LayoutProps, "params">): Promise<Metadata> {
  const { goal: slug } = await params;
  const goal = goalFromTrackSlug(slug);
  if (!goal) {
    return buildPageMetadata({
      title: "Study track — Shelf Learn",
      description: "Free exam curriculum packs on Shelf Learn.",
      path: "/learn",
    });
  }

  const seo = LEARN_TRACK_SEO[goal];
  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: learnTrackPath(goal),
    keywords: seo.keywords,
  });
}

export default async function LearnTrackLayout({
  children,
  params,
}: LayoutProps) {
  const { goal: slug } = await params;
  const goal = goalFromTrackSlug(slug);
  if (!goal) notFound();

  const seo = LEARN_TRACK_SEO[goal];
  const subjects = await fetchTrackSubjects(goal);

  return (
    <>
      <LearnTrackJsonLd
        goal={goal}
        description={seo.description}
        subjects={subjects}
      />
      {children}
    </>
  );
}

export function generateStaticParams() {
  return [
    { goal: "gate" },
    { goal: "upsc" },
    { goal: "state-pcs" },
    { goal: "judiciary" },
    { goal: "ca" },
    { goal: "neet-pg" },
  ];
}
