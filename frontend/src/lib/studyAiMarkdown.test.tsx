import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { normalizeTryNextMarkdown } from "./studyAiMath";
import { StudyAIContent } from "./studyAiMarkdown";

describe("Try next markdown", () => {
  it("lifts bullet + heading mash into a callout", () => {
    const md = normalizeTryNextMarkdown(
      '- ### Try next: Type "quiz me on probability" for a quick drill.'
    );
    expect(md).toContain("### Try next");
    expect(md).toContain('Type "quiz me on probability"');
    expect(md).not.toContain("### Try next:");
  });

  it("renders a styled callout in chat", () => {
    const html = renderToStaticMarkup(
      <StudyAIContent
        content={
          '### Try next\n\nType "Give me a quick 5-question math quiz" to test readiness.'
        }
      />
    );
    expect(html).toContain("study-ai-try-next");
    expect(html).toContain("Try next");
    expect(html).toContain("Give me a quick 5-question math quiz");
    expect(html).not.toContain("### Try next");
  });
});
