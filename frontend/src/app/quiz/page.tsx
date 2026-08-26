import { QuizJsonLd } from "@/components/seo/QuizJsonLd";
import { QuizMarketingLanding } from "@/components/quiz/QuizMarketingLanding";
import { QuizPageClient } from "@/components/quiz/QuizPageClient";

export default function QuizPage() {
  return (
    <>
      <QuizJsonLd />
      <QuizPageClient>
        <QuizMarketingLanding />
      </QuizPageClient>
    </>
  );
}
