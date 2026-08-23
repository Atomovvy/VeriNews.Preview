# AGENTS.md

Thin operating entrypoint for agents working in `Atomovvy/VeriNews.Preview`.

## Repository role

This repository is the public presentation-only preview surface for VeriNews. Development policy, working evidence, methodology, schemas and implementation remain authoritative in `Atomovvy/VeriNews.Dev` or current central policy as applicable.

```text
VERINEWS_PREVIEW=PUBLICATION_SURFACE
VERINEWS_PREVIEW!=DEVELOPMENT_SOURCE_OF_TRUTH
VERINEWS_PREVIEW!=AUTOMATIC_PUBLICATION_AUTHORITY
```

## Central policy inheritance

This repository inherits current policy from `Atomovvy/Atomovvy`. Before repository-changing work read the current central `AGENTS.md`, `Documentation/Workflow/AGENTS_BASE.md`, `GIT_POLICY.md`, `PROMPT_POLICY.md`, `MULTI_AGENT_LOCK_POLICY.md`, `P2C_SIMPLE_LOCK_V2_RUNBOOK.md`, `VALIDATION_POLICY.md`, `HANDOFF_POLICY.md` and applicable release/path-safety policy.

If required central policy is unavailable, report `CENTRAL_POLICY_UNAVAILABLE` and remain read-only.

## Write and publication boundary

- This repository is the only writable repository in a Preview-local task unless another repository is separately authorized.
- `Atomovvy/VeriNews.Dev` remains read-only during a Preview-local write unless a separate cross-repository workflow is explicitly authorized.
- A reviewed source commit, issue, message or artifact from `.Dev` is not by itself publication authority.
- Do not add or change `.github/workflows/**`, enable GitHub Pages, create unattended publication, credentials, deployment automation or cross-repository writes without separate explicit approval.
- Do not place private working evidence, internal-only policy, secrets or unpublished source material into this public repository.

## Repository writer coordination

For ordinary hosted GitHub repository mutations, use current P2-C Simple Lock v2:

```text
P2C_SIMPLE_LOCK_V2_STATUS=ACTIVE
COORDINATION_MODE=P2C_SIMPLE_LOCK_V2
LOCK_REF=coordination/write-lock-v2
LOCK_FILE=LOCK.json
P2C_LEGACY_STRONG_STATUS=FROZEN_REFERENCE
LEGACY_STRONG_DEFAULT_FOR_ORDINARY_WRITES=NO
```

Freshly fetch and validate the live lock, acquire it by exact file-SHA compare-and-swap, and verify exact ownership before the first ordinary mutation. Read-only work does not require the lock. Coordination failure fails closed without Legacy Strong fallback.

The lock coordinates conforming writers only. It does not grant publication, deployment, cross-repository write or merge authority and does not replace Git/target freshness, review or validation.

## Git workflow

For non-trivial tracked changes use:

```text
fresh main
→ record start SHA
→ dedicated branch
→ bounded change
→ diff/validation
→ Draft PR
→ merge only after explicit decision
```

## Handoff

Current repository-changing work is recorded in `Documentation/Workflow/AGENT_LAST_RUN.md`.
