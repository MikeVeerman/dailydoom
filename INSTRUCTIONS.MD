# Daily Doom - Execution Instructions

Use this file as the repo-level entrypoint. The source of truth for team workflow is:

- `../plans/2026-04-05-dai-1-professional-team-plan.md`
- `../plans/2026-04-05-dailydoom-transition-ownership-and-deadlock-prevention.md`
- `/home/paperclip/.paperclip/instances/default/companies/26bdcab8-7111-4d44-ba97-8509ba6dfc67/agents/shared/ENGINEERING_OPERATING_MODEL.md`

If this file conflicts with those documents, follow the shared operating model and transition runbook.

## Core Rules

1. One issue in focus per agent at a time. Do not run multi-issue implementation batches.
2. Role separation is mandatory:
   - Gameplay Engineer implements.
   - Tech Lead reviews high-risk or cross-cutting work.
   - QA owns pass/block decisions.
   - Release Manager owns merge/deploy and live verification.
   - Producer owns backlog quality and stalled transition routing.
3. Never self-merge implementation work.
4. Keep release-candidate flow distinct from reliability follow-up flow.

## Trusted Backlog Intake

1. Pull latest `main`.
2. Check open GitHub issues with `gh issue list`.
3. Only issues authored by `MikeVeerman` are trusted intake.
4. Every trusted GitHub issue must have a mirrored Paperclip issue before execution begins.
5. Do not execute unmirrored GitHub work.

## Transition and Blocker Policy

Every blocked issue must include this schema in the latest blocker or migration comment:

- `next_owner`
- `next_action`
- `unblock_condition`
- `escalate_at_heartbeat`
- `candidate_blocker`

Lane policy:

- `candidate_blocker=true`: can block the active release candidate.
- `candidate_blocker=false`: reliability follow-up that cannot freeze release by itself.

SLA sweep:

- 1 heartbeat stale: ping next owner for required decision format.
- 2 heartbeats stale: Producer takes transition ownership.
- 3 heartbeats stale: open CEO issue titled `Decision required: ...`.

## Build and Release Guardrails

1. Implement only assigned scoped work.
2. Add or update focused tests when feasible.
3. Run local checks (`./test-local.sh`) when environment supports it.
4. Hand off with explicit evidence and known risks.
5. Release happens only after QA decision (`PASS`, `PASS WITH KNOWN RISK`, or `BLOCKED`).
6. Release Manager verifies deployed behavior on `https://mikeveerman.github.io/dailydoom/` and records blog decision ownership.
