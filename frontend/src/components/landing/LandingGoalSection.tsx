import { RevealOnScroll } from "@/components/RevealOnScroll";

export function LandingGoalSection() {
  return (
    <section className="landing-goal-section" id="goal">
      <div className="landing-goal-wrap">
        <RevealOnScroll>
          <div className="landing-goal-left">
            <div className="landing-kicker">Optional study goal</div>
            <h2>A smart layer when you want focus — never required on day one.</h2>
            <p>
              Shelf starts with your library and reader. When you are ready, set
              a study goal in Settings so Study AI, quizzes, and planning can
              stay aligned to what you are working toward — without locking you
              into a single exam or track on the homepage.
            </p>
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <div className="landing-goal-right">
            <div className="landing-goal-prompt">What are you using Shelf for?</div>
            <div className="landing-goal-help">Choose one, or write your own in Settings.</div>
            <div className="landing-goal-pills">
              <div className="landing-goal-pill">Learn a new subject</div>
              <div className="landing-goal-pill">Work on a research project</div>
              <div className="landing-goal-pill landing-goal-pill-active">
                Build expertise in my field
              </div>
              <div className="landing-goal-pill">Prepare for an assessment</div>
            </div>
            <div className="landing-goal-impact">
              <strong>Goal active · Your chosen focus area</strong>
              <span>
                Shelf adds context about what you are trying to achieve. Your
                library stays yours, while Study AI and planning can use the goal
                to stay focused.
              </span>
              <div className="landing-goal-mini-grid">
                <div className="landing-goal-mini-cell">
                  <b>Study AI</b>
                  <small>More relevant answers</small>
                </div>
                <div className="landing-goal-mini-cell">
                  <b>Library</b>
                  <small>Surface useful material</small>
                </div>
                <div className="landing-goal-mini-cell">
                  <b>Planner</b>
                  <small>Keep tasks aligned</small>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
