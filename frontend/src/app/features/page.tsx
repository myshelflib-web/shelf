import { FeaturesHub } from "@/components/features/FeaturePages";
import { FeaturesHubJsonLd } from "@/components/seo/FeatureJsonLd";
import { SHELF_FEATURES } from "@/lib/seo/featureCatalog";

export default function FeaturesIndexPage() {
  return (
    <>
      <FeaturesHubJsonLd features={SHELF_FEATURES} />
      <FeaturesHub />
    </>
  );
}
