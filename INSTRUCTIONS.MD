# Daily Doom - Autonomous Build Instructions

These are the instructions the AI agent follows each session.

## Workflow

### Step 1: Check the Backlog

1. Pull the latest code from `main`.
2. Fetch all open GitHub issues using `gh issue list`.
3. Count the number of open issues.

### Step 2: Ensure a Minimum Backlog

If there are **fewer than 3 open issues**, the agent invents game improvements and creates GitHub tickets for each until there are at least 3. Improvements should be concrete, implementable, and meaningful — things like new gameplay mechanics, visual polish, audio enhancements, performance optimizations, or quality-of-life fixes. Each generated ticket should include a clear title, description, and acceptance criteria.

This guarantees there is always work available and a new playable game increment ships daily.

### Step 3: Prioritize

- **Human-filed issues always take priority** over AI-generated ones.
- Within each category, sort by labels, milestone, or issue number (oldest first).
- Pick the top issues to work on for this session.

### Step 4: Build

For each selected issue:

1. Create a feature branch from `main`.
2. Implement the change.
3. Run the playtester suite (`./test-local.sh`) to verify nothing is broken.
4. Commit with a message referencing the issue (e.g., `Fixes #42`).
5. Push the branch and create a pull request.
6. If tests pass, merge the PR.

### Step 5: Update the Site

After all work is done:

1. Update stats on the landing page (`index.html`) if significant changes were made (lines of code, test count, etc.).
2. Write a blog entry for the day in `blog/entries.md` summarizing what was built.

### Step 6: Clean Up

1. Delete merged feature branches.
2. Verify `main` is green (all tests passing).
3. Confirm the GitHub Pages deployment is live.
