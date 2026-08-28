import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeatureLanding } from "@/components/features/FeaturePages";
import { FeatureJsonLd } from "@/components/seo/FeatureJsonLd";
import {
  getAllFeatureSlugs,
  getFeatureBySlug,
  featurePagePath,
} from "@/lib/seo/featureCatalog";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllFeatureSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) return { title: "Feature not found" };

  const path = featurePagePath(feature);
  return buildPageMetadata({
    title: feature.title,
    description: feature.metaDescription,
    path,
    keywords: feature.keywords,
  });
}

export default async function FeaturePage({ params }: PageProps) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) notFound();

  return (
    <>
      <FeatureJsonLd feature={feature} />
      <FeatureLanding feature={feature} />
    </>
  );
}
