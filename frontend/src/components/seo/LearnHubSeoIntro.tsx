import Link from "next/link";
import { LEARN_DESCRIPTION } from "@/lib/seo/keywords";
import { INDEXABLE_LEARN_TRACKS, learnTrackPath } from "@/lib/seo/learnTrackSeo";
import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";

/** Visible hub copy for /learn — answer engines + Google need real HTML, not only JSON-LD. */
export function LearnHubSeoIntro() {
  return (
    <article className="learn-article-seo-intro" aria-label="About Shelf Learn">
      <h1 className="learn-article-seo-title">Shelf Learn — free study curriculum</h1>
      <p className="learn-article-seo-lead">{LEARN_DESCRIPTION}</p>
      <section className="learn-article-seo-children">
        <h2>Exam tracks</h2>
        <ul>
          {INDEXABLE_LEARN_TRACKS.map((goal) => (
            <li key={goal}>
              <Link href={learnTrackPath(goal)}>{STUDY_GOAL_LABELS[goal]}</Link>
            </li>
          ))}
          <li>
            <Link href="/learn/current-affairs">Current affairs</Link>
          </li>
          <li>
            <Link href="/features">Shelf product features</Link>
          </li>
        </ul>
      </section>
    </article>
  );
}
