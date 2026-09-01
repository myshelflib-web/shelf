import { notFound } from "next/navigation";
import { CurrentAffairsItemView } from "@/components/learn/CurrentAffairsItemView";
import { fetchCurrentAffairsItem } from "@/lib/seo/currentAffairsFetch";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CurrentAffairsItemPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await fetchCurrentAffairsItem(slug);
  if (!item) notFound();

  return (
    <>
      <CurrentAffairsItemView item={item} />
    </>
  );
}
