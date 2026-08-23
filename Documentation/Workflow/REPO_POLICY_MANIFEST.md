# REPO_POLICY_MANIFEST.md

Repository: `Atomovvy/VeriNews.Preview`
Policy mode: inherited
Central policy repository: `Atomovvy/Atomovvy`
Repository role: `public preview / publication surface`

## Required central policy

Read current applicable versions of:

```text
AGENTS.md
Documentation/Workflow/AGENTS_BASE.md
Documentation/Workflow/GIT_POLICY.md
Documentation/Workflow/PROMPT_POLICY.md
Documentation/Workflow/MULTI_AGENT_LOCK_POLICY.md
Documentation/Workflow/P2C_SIMPLE_LOCK_V2_RUNBOOK.md
Documentation/Workflow/VALIDATION_POLICY.md
Documentation/Workflow/HANDOFF_POLICY.md
Documentation/Workflow/RELEASE_POLICY.md
Documentation/Workflow/PATH_PRESENTATION_POLICY.md
```

If required current central policy is unavailable, repository-changing work fails closed as `CENTRAL_POLICY_UNAVAILABLE`.

## Repository writer coordination

```text
P2C_SIMPLE_LOCK_V2_STATUS=ACTIVE
COORDINATION_MODE=P2C_SIMPLE_LOCK_V2
LOCK_REF=coordination/write-lock-v2
LOCK_FILE=LOCK.json
CLAIM_PRIMITIVE=GITHUB_CONTENTS_FILE_SHA_CAS
READ_ONLY_LOCK_REQUIRED=NO
P2C_LEGACY_STRONG_STATUS=FROZEN_REFERENCE
LEGACY_STRONG_DEFAULT_FOR_ORDINARY_WRITES=NO
RUNTIME_ACTIVATION_COMMIT=8781d5be69a7a70ca6f1e247d9d761d94900e1ad
```

For ordinary hosted GitHub mutations, freshly fetch and validate the live lock, retain the exact returned file SHA, acquire by exact file-SHA compare-and-swap, and verify exact ownership before crossing the target-mutation boundary.

If lock validation or acquisition fails, ordinary writes fail closed. No silent Legacy Strong fallback is allowed.

## Publication boundary

```text
SIMPLE_LOCK_OWNERSHIP!=PUBLICATION_AUTHORITY
SIMPLE_LOCK_OWNERSHIP!=DEPLOYMENT_AUTHORITY
SIMPLE_LOCK_OWNERSHIP!=CROSS_REPOSITORY_WRITE_AUTHORITY
```

`Atomovvy/VeriNews.Dev` remains the private development source. Material reaches Preview only through a separately authorized, reviewed publication workflow. This policy package does not enable GitHub Pages, Actions, deployment, unattended publication or repository-to-repository copying.

## Handoff

Completed repository-changing work uses `Documentation/Workflow/AGENT_LAST_RUN.md`. Live lock state is always read from `coordination/write-lock-v2:LOCK.json`.
