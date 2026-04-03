# Daily Doom Is Done. Here's What I Learned.

For 41 nights, an AI agent built a Doom-style FPS while I slept. No game engine. No frameworks. Just Claude, a set of instructions, and a GitHub repo.

Every morning I woke up to pull requests. New enemies, new weapons, procedural audio, a morale system where demons flee when you're on a kill streak. 30,000 lines of JavaScript, 55 automated tests, 360 commits. A playable game that didn't exist six weeks ago.

Now I'm shutting it down. Not because it broke — because it answered the question I was asking.

If you want the backstory, I wrote about the [early days](https://mikeveerman.be/blog/substack-2026-02-21-daily-doom-fighting-demons-and-software/) and the [40-day mark](https://mikeveerman.be/blog/substack-2026-03-30-40-days-of-doom/) along the way. This is the postmortem.

## The Pipeline

The setup was simple. Every night, the agent:

1. Pulled the latest code from `main`
2. Checked open GitHub issues — only ones filed by me
3. If fewer than three tickets existed, it invented improvements and filed them
4. Picked the highest priority issue, branched, coded, wrote tests
5. Ran the Playwright test suite locally
6. Opened a PR, merged if green
7. Updated the landing page stats and wrote a dev log entry

Rinse, repeat. Every single night for 41 days.

The human-filed issues always took priority over the agent's own ideas. That distinction turned out to matter a lot.

## What Went Right

The stability surprised me most. Over 41 days and 360 commits, there was exactly one game-crashing bug. One. The rest of the time, the game just worked. New features landed, old features kept functioning, and the test suite stayed green.

That's not a small thing. Anyone who's worked on a codebase with multiple daily deploys knows how fast things can degrade. The agent maintained a clean architecture across six weeks of continuous feature development without a single human refactor. The code isn't beautiful, but it's organized. Files are where you'd expect them. Naming is consistent. The module boundaries held.

The testing pipeline deserves credit here. Fifty-five Playwright tests, split into baseline checks (does the game boot, does the HUD render, does the player move) and feature tests tagged to the GitHub issues that spawned them. Every PR had to pass the full suite. The agent couldn't merge broken code even if it wanted to.

## What Went Wrong

The features were technically correct but often shallow. The agent would implement exactly what a ticket described, sometimes impressively so, but it rarely went beyond the literal spec. An enemy morale system that works? Yes. An enemy morale system that makes the game more *fun*? That's a different question, and one the agent couldn't answer.

This is where automated testing hits its ceiling. The Playwright suite could tell me if the game crashed, if sprites rendered, if the player could move. It could not tell me if a feature felt good. Whether the shotgun had enough punch. Whether the new enemy type was too aggressive or not aggressive enough. Whether a power-up was satisfying to pick up. Quality and feel are human judgments, and there was no automated gate for them.

The most interesting limitation was creative. When the backlog ran dry and the agent had to invent its own tickets, the ideas were... fine. Reasonable. Conservative. Add a minimap legend. Add floating pickup text. Improve the death screen stats. All defensible improvements, none of them surprising. It never proposed something that made me think "I wouldn't have thought of that." The features it invented were the features you'd get from reading a list of what other FPS games have and checking off boxes.

It's as if the agent was optimizing for "don't break anything" rather than "make something great." Which, given the pipeline, makes sense. The incentive structure rewarded passing tests, not taking creative risks.

## What This Proved

Daily Doom was never really about making a game. It was about answering a question: can an AI agent maintain a real software project autonomously, shipping working code every day, without human intervention in the development loop?

The answer is yes, with caveats.

The agent is a reliable coder. It can read a spec, write an implementation, add tests, and ship it. It can do this at 3 AM while you're asleep. It can do it 41 times in a row without setting the codebase on fire. That's genuinely impressive, and it would have been unthinkable two years ago.

But the agent is not a product person. It can't tell you what to build. It can't judge whether what it built is good. It can't take a creative risk, because it doesn't understand what "risk" means in the context of user experience. It needs a human at two gates: deciding what matters, and judging whether the result actually works.

The overnight pipeline isn't a replacement for a developer. It's a force multiplier for one. File the right tickets before bed, review the output in the morning. The boring middle — the implementation grind — that part is handled.

## What Happens Now

The game stays live at [mikeveerman.github.io/dailydoom](https://mikeveerman.github.io/dailydoom). The repo stays public. If you want to fork a 30,000-line FPS built entirely by an AI agent — raycasting engine, procedural audio, behavior trees, the works — go for it.

I'm not running the pipeline anymore. The question is answered. Forty-one nights was enough to see the pattern clearly: the ceiling isn't technical capability. It's taste. And taste still requires a human in the loop.

The screen goes dark. The demons rest. The experiment is done.
