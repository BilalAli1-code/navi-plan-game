<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
# ProjectSim Development Principles
## 1. Product Vision
ProjectSim is an immersive AI-powered project management simulator, not a quiz engine.
The goal is to develop real project leadership skills through realistic business simulations where learners manage projects, communicate with stakeholders, make decisions, and experience the consequences of those decisions.
## 2. Core Principles
- Story drives learning.
- Every simulation represents a real business project.
- Every project should feel like working inside a real organization.
- Stakeholders have persistent memory and evolving relationships.
- Every decision has short-term and long-term consequences.
- Maya is a coach, not an autopilot.
- Communication is a core gameplay mechanic.
- PMBOK concepts are experienced naturally, not presented as lectures.
- Business value is always more important than completing tasks.
- Build reusable systems that support multiple business cases.
- Preserve the existing architecture whenever possible.
- Every new feature should improve immersion, realism, and learning.
## 3. Success Criteria
Every feature should contribute to one or more of the following:
- Realistic project management experience
- Strong business storytelling
- High learner engagement
- Practical leadership development
- PMBOK-aligned learning outcomes
- Maintainable and scalable architecture
## 4. Development Rule
When implementing new functionality:
1. Preserve existing functionality.
2. Follow the Simulation Design Blueprint.
3. Follow the Business Case Content Bible.
4. Prioritize realism over complexity.
5. Build reusable components whenever possible.

## 5. Copilot CI Efficiency
- Keep changes surgical and avoid re-running the same validation commands unless code changed after the last run.
- Prefer targeted checks for modified files first, then run the required full validation once before finalizing.
