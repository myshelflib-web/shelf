# SEO growth — discovery beyond on-page copy

On-page SEO (titles, features, comparison posts) is in the frontend catalog.
This doc covers **priorities that cannot ship as code**: backlinks and Search Console.

## 1. Google Search Console (do first after deploy)

1. Open [Google Search Console](https://search.google.com/search-console) for `https://www.myshelflib.com` (and apex if verified).
2. **URL inspection** → request indexing for:
   - `/`
   - `/features/chat-with-pdf`
   - `/features/ai-tutor`
   - `/features/ai-flashcards-quizzes`
   - `/features/study-ai-summaries`
   - `/features/shelf-vs-alternatives`
   - `/features/all-in-one-study-workspace`
   - `/features/notes-pdfs-ask-llm`
   - `/features/teacher-test-prep`
   - `/features/study-ai`
   - `/quiz`
   - `/subscribe`
   - `/blog/best-notebooklm-alternatives`
   - `/blog/chat-with-pdf-ai`
   - `/blog/ai-pdf-summarizer-students`
   - `/blog/ai-flashcards-quizzes-from-pdf`
   - `/blog/best-study-apps-for-students`
   - `/blog/free-ai-study-tools`
   - `/blog/ai-tutor-from-notes`
   - `/blog/remnote-quizlet-anki-alternatives`
   - `/blog/goodnotes-notability-alternative`
   - `/blog/shelf-vs-alternatives-features-pricing`
   - `/sitemap.xml`
3. **Pages** report: fix “Crawled – currently not indexed” / soft 404s on the URLs above.
4. **Performance**: filter `chat with pdf`, `notebooklm alternative`, `ai tutor`, `pdf summarizer`, `flashcards`, `best study apps`, `free ai study`, `quizlet alternative`. Note impressions vs clicks after 2–4 weeks.
5. After blog seed to production S3/Postgres (`npm run blog:seed --prefix backend`), re-inspect the new `/blog/...` URLs.

## 2. Earn links (ongoing)

Category tools rarely rank on cold queries without referring domains.

| Channel | Action |
|---|---|
| **Product Hunt** | Launch Shelf with tagline “all-in-one study workspace — notes, PDFs, LLM, quizzes”. Link `/features/all-in-one-study-workspace`. |
| **Student / exam communities** | Share workflows (not spam): Reddit (r/UPSC, r/GATE, r/GetStudying), Discord study servers, Telegram coaching groups — answer with a genuine tip + link when relevant. |
| **Teacher communities** | Post about preparing tests from lesson PDFs; link `/features/teacher-test-prep`. |
| **Quora / Stack Exchange-style Q&A** | Answer “student study tool”, “ask LLM about my notes”, “NotebookLM / Obsidian / Notion alternative” with comparison posts. |
| **Newsletters & blogs** | Pitch student newsletters and indie-hacker roundups; offer a short guest blurb + OG image. |
| **Directories** | Submit to AI tool directories, AlternativeTo, “ChatPDF alternatives” lists with accurate feature bullets. |
| **Partners** | Coaching institutes / creators: Share Shelf demos; ask for a footer or resources-page link. |

**Do not** buy PBNs or spam comments. Prefer one quality editorial link over dozens of junk listings.

## 3. After each product feature

Follow `.cursor/rules/feature-blog.mdc`: new user-visible capability → blog (or update) with SEO fields, then seed if production serves from S3.

## 4. Sanity checklist before claiming “SEO done”

- [ ] Production deploy includes new feature + blog routes
- [ ] `blog:seed` run against prod when blog is S3-backed
- [ ] GSC indexing requested for hub + comparison URLs
- [ ] At least one external listing or community post live
- [ ] Homepage title in a private window matches: store PDFs & notes + ask LLM / Study AI
